import { collection, doc, setDoc, getDocs, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Project {
  id: string;
  userId?: string;
  title: string;
  description: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize: '1K' | '2K' | '4K';
  stylePreset?: string;
  negativePrompt?: string;
  imageOptions: { base64: string; mimeType: string; url: string }[];
  selectedImageIndex: number | null;
  videoBlob: Blob | null;
  videoOptions?: { blob: Blob; style: string; url?: string; }[];
  selectedVideoIndex?: number | null;
  updatedAt: number;
  editHistory?: number[];
  historyPointer?: number;
  palette?: string[];
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  animationPreset?: string;
}

const CHUNK_SIZE = 800000; // 800kb per document chunk to avoid 1MB limits safely

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function saveProject(project: Project): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  const projectRef = doc(db, 'projects', project.id);
  const { imageOptions, videoBlob, ...projectData } = project;
  
  await setDoc(projectRef, {
    ...projectData,
    userId: user.uid,
    updatedAt: projectData.updatedAt || Date.now(),
  });

  const promises = [];

  // Save image permutations as chunks to avoid 1MB document limits on 4K renders
  for (let i = 0; i < imageOptions.length; i++) {
    const rawBase64 = imageOptions[i].base64;
    const numChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);
    
    promises.push(setDoc(doc(db, `projects/${project.id}/images`, `${i}_meta`), {
      userId: user.uid,
      index: i,
      mimeType: imageOptions[i].mimeType,
      numChunks
    }));

    for (let c = 0; c < numChunks; c++) {
      promises.push(setDoc(doc(db, `projects/${project.id}/images`, `${i}_chunk_${c}`), {
        userId: user.uid,
        data: rawBase64.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
      }));
    }
  }

  // Save Video file as chunks
  if (project.videoOptions && project.videoOptions.length > 0) {
    promises.push(setDoc(doc(db, `projects/${project.id}/video`, 'meta'), {
      userId: user.uid,
      multiCount: project.videoOptions.length
    }));
    for (let i = 0; i < project.videoOptions.length; i++) {
      const vOpt = project.videoOptions[i];
      if (!vOpt.blob) continue;
      const videoDataUrl = await blobToBase64(vOpt.blob);
      const numChunks = Math.ceil(videoDataUrl.length / CHUNK_SIZE);
      
      promises.push(setDoc(doc(db, `projects/${project.id}/video`, `meta_${i}`), {
        userId: user.uid,
        style: vOpt.style,
        numChunks
      }));
      for (let c = 0; c < numChunks; c++) {
        promises.push(setDoc(doc(db, `projects/${project.id}/video`, `chunk_${i}_${c}`), {
          userId: user.uid,
          data: videoDataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
        }));
      }
    }
  } else if (project.videoBlob) {
    const videoDataUrl = await blobToBase64(project.videoBlob);
    const numChunks = Math.ceil(videoDataUrl.length / CHUNK_SIZE);
    
    promises.push(setDoc(doc(db, `projects/${project.id}/video`, 'meta'), {
      userId: user.uid,
      numChunks
    }));
    for (let c = 0; c < numChunks; c++) {
      promises.push(setDoc(doc(db, `projects/${project.id}/video`, `chunk_${c}`), {
        userId: user.uid,
        data: videoDataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
      }));
    }
  }

  await Promise.all(promises);
}

export async function getProjects(): Promise<Project[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  
  const projects: Project[] = [];
  
  for (const document of querySnapshot.docs) {
    const data = document.data();
    
    // Fetch and reassemble images
    const imagesRef = collection(db, `projects/${document.id}/images`);
    const imagesSnap = await getDocs(imagesRef);
    const metas = imagesSnap.docs.filter(d => d.id.endsWith('_meta')).map(d => ({ id: d.id, ...d.data() }));
    
    const imageOptions: any[] = [];
    for (const meta of metas) {
       let rawBase64 = '';
       for (let c = 0; c < (meta as any).numChunks; c++) {
          const chunkDoc = imagesSnap.docs.find(d => d.id === `${(meta as any).index}_chunk_${c}`);
          if (chunkDoc) rawBase64 += chunkDoc.data().data;
       }
       if (rawBase64) {
          imageOptions[(meta as any).index] = {
             base64: rawBase64,
             mimeType: (meta as any).mimeType,
             url: `data:${(meta as any).mimeType};base64,${rawBase64}`
          };
       }
    }

    // Fetch and reassemble video
    let videoBlob = null;
    let videoOptions: { blob: Blob, style: string, url?: string }[] = [];
    const videoRef = collection(db, `projects/${document.id}/video`);
    const videoSnap = await getDocs(videoRef);
    const videoMetaDoc = videoSnap.docs.find(d => d.id === 'meta');
    
    if (videoMetaDoc) {
       const vMeta = videoMetaDoc.data();
       if (vMeta.multiCount !== undefined) {
          for (let i = 0; i < vMeta.multiCount; i++) {
             const subMeta = videoSnap.docs.find(d => d.id === `meta_${i}`)?.data();
             if (!subMeta) continue;
             let vDataUrl = '';
             for (let c = 0; c < subMeta.numChunks; c++) {
                const chunkDoc = videoSnap.docs.find(d => d.id === `chunk_${i}_${c}`);
                if (chunkDoc) vDataUrl += chunkDoc.data().data;
             }
             if (vDataUrl) {
                const res = await fetch(vDataUrl);
                const blob = await res.blob();
                videoOptions.push({
                   blob,
                   style: subMeta.style,
                   url: URL.createObjectURL(blob)
                });
             }
          }
       } else {
          let vDataUrl = '';
          for (let c = 0; c < vMeta.numChunks; c++) {
             const chunkDoc = videoSnap.docs.find(d => d.id === `chunk_${c}`);
             if (chunkDoc) vDataUrl += chunkDoc.data().data;
          }
          if (vDataUrl) {
             const res = await fetch(vDataUrl);
             videoBlob = await res.blob();
          }
       }
    }

    projects.push({
      id: document.id,
      title: data.title,
      description: data.description,
      aspectRatio: data.aspectRatio,
      imageSize: data.imageSize,
      stylePreset: data.stylePreset,
      negativePrompt: data.negativePrompt,
      imageOptions: imageOptions.filter(Boolean),
      selectedImageIndex: data.selectedImageIndex ?? null,
      videoBlob,
      videoOptions,
      selectedVideoIndex: data.selectedVideoIndex ?? null,
      updatedAt: data.updatedAt,
      editHistory: data.editHistory,
      historyPointer: data.historyPointer,
      palette: data.palette,
      watermarkEnabled: data.watermarkEnabled,
      watermarkText: data.watermarkText,
      watermarkOpacity: data.watermarkOpacity,
      animationPreset: data.animationPreset,
      userId: data.userId
    } as Project);
  }
  
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');
  
  const imagesRef = collection(db, `projects/${id}/images`);
  const imagesSnap = await getDocs(imagesRef);
  const deleteImages = imagesSnap.docs.map(docSnap => deleteDoc(doc(db, `projects/${id}/images`, docSnap.id)));
  
  const videoRef = collection(db, `projects/${id}/video`);
  const videoSnap = await getDocs(videoRef);
  const deleteVideos = videoSnap.docs.map(docSnap => deleteDoc(doc(db, `projects/${id}/video`, docSnap.id)));

  await Promise.all([...deleteImages, ...deleteVideos]);
  await deleteDoc(doc(db, 'projects', id));
}
