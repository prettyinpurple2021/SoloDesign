import { collection, doc, setDoc, getDocs, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface BrandKit {
  typography: string[];
  voice: string;
  secondaryColors: string[];
  slogan?: string;
  mission?: string;
  usageRules?: {
    do: string[];
    dont: string[];
  };
}

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
  brandKit?: BrandKit;
  matchingIcons?: { base64: string; mimeType: string; url: string; label: string }[];
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  animationPreset?: string;
}

export interface Template {
  id: string;
  userId?: string;
  name: string;
  category: string;
  description: string;
  settings: {
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
    imageSize: '1K' | '2K' | '4K';
    stylePreset: string;
    negativePrompt: string;
    palette: string[];
    animationPreset: string;
  };
  createdAt: number;
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
  
  try {
    await setDoc(projectRef, {
      ...projectData,
      userId: user.uid,
      updatedAt: projectData.updatedAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `projects/${project.id}`);
  }

  const promises = [];

  // Save image permutations as chunks to avoid 1MB document limits on 4K renders
  for (let i = 0; i < imageOptions.length; i++) {
    const rawBase64 = imageOptions[i].base64;
    const numChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);
    
    const metaPath = `projects/${project.id}/images/${i}_meta`;
    promises.push(setDoc(doc(db, metaPath), {
      userId: user.uid,
      index: i,
      mimeType: imageOptions[i].mimeType,
      numChunks
    }).catch(e => handleFirestoreError(e, OperationType.WRITE, metaPath)));

    for (let c = 0; c < numChunks; c++) {
      const chunkPath = `projects/${project.id}/images/${i}_chunk_${c}`;
      promises.push(setDoc(doc(db, chunkPath), {
        userId: user.uid,
        data: rawBase64.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
      }).catch(e => handleFirestoreError(e, OperationType.WRITE, chunkPath)));
    }
  }

  // Save Video file as chunks
  if (project.videoOptions && project.videoOptions.length > 0) {
    const videoMetaPath = `projects/${project.id}/video/meta`;
    promises.push(setDoc(doc(db, videoMetaPath), {
      userId: user.uid,
      multiCount: project.videoOptions.length
    }).catch(e => handleFirestoreError(e, OperationType.WRITE, videoMetaPath)));

    for (let i = 0; i < project.videoOptions.length; i++) {
      const vOpt = project.videoOptions[i];
      if (!vOpt.blob) continue;
      const videoDataUrl = await blobToBase64(vOpt.blob);
      const numChunks = Math.ceil(videoDataUrl.length / CHUNK_SIZE);
      
      const subMetaPath = `projects/${project.id}/video/meta_${i}`;
      promises.push(setDoc(doc(db, subMetaPath), {
        userId: user.uid,
        style: vOpt.style,
        numChunks
      }).catch(e => handleFirestoreError(e, OperationType.WRITE, subMetaPath)));

      for (let c = 0; c < numChunks; c++) {
        const chunkPath = `projects/${project.id}/video/chunk_${i}_${c}`;
        promises.push(setDoc(doc(db, chunkPath), {
          userId: user.uid,
          data: videoDataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
        }).catch(e => handleFirestoreError(e, OperationType.WRITE, chunkPath)));
      }
    }
  } else if (project.videoBlob) {
    const videoDataUrl = await blobToBase64(project.videoBlob);
    const numChunks = Math.ceil(videoDataUrl.length / CHUNK_SIZE);
    
    const videoMetaPath = `projects/${project.id}/video/meta`;
    promises.push(setDoc(doc(db, videoMetaPath), {
      userId: user.uid,
      numChunks
    }).catch(e => handleFirestoreError(e, OperationType.WRITE, videoMetaPath)));

    for (let c = 0; c < numChunks; c++) {
      const chunkPath = `projects/${project.id}/video/chunk_${c}`;
      promises.push(setDoc(doc(db, chunkPath), {
        userId: user.uid,
        data: videoDataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
      }).catch(e => handleFirestoreError(e, OperationType.WRITE, chunkPath)));
    }
  }

  // Save matching icons as chunks
  if (project.matchingIcons && project.matchingIcons.length > 0) {
    for (let i = 0; i < project.matchingIcons.length; i++) {
      const rawBase64 = project.matchingIcons[i].base64;
      const numChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);
      
      const iconMetaPath = `projects/${project.id}/icons/${i}_meta`;
      promises.push(setDoc(doc(db, iconMetaPath), {
        userId: user.uid,
        index: i,
        mimeType: project.matchingIcons[i].mimeType,
        label: project.matchingIcons[i].label,
        numChunks
      }).catch(e => handleFirestoreError(e, OperationType.WRITE, iconMetaPath)));

      for (let c = 0; c < numChunks; c++) {
        const iconChunkPath = `projects/${project.id}/icons/${i}_chunk_${c}`;
        promises.push(setDoc(doc(db, iconChunkPath), {
          userId: user.uid,
          data: rawBase64.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)
        }).catch(e => handleFirestoreError(e, OperationType.WRITE, iconChunkPath)));
      }
    }
  }

  await Promise.all(promises);
}

export async function getProjects(): Promise<Project[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const projectsPath = 'projects';
  let querySnapshot;
  try {
    const q = query(collection(db, projectsPath), where('userId', '==', user.uid));
    querySnapshot = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, projectsPath);
    return [];
  }
  
  const projects: Project[] = [];
  
  for (const document of querySnapshot.docs) {
    const data = document.data();
    
    // Fetch and reassemble images
    const imagesPath = `projects/${document.id}/images`;
    let imagesSnap;
    try {
      imagesSnap = await getDocs(collection(db, imagesPath));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, imagesPath);
      continue;
    }
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
    const videoPath = `projects/${document.id}/video`;
    let videoSnap;
    try {
      videoSnap = await getDocs(collection(db, videoPath));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, videoPath);
      continue;
    }
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

    // Fetch and reassemble matching icons
    const iconsPath = `projects/${document.id}/icons`;
    let iconsSnap;
    try {
      iconsSnap = await getDocs(collection(db, iconsPath));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, iconsPath);
      continue;
    }
    const iconMetas = iconsSnap.docs.filter(d => d.id.endsWith('_meta')).map(d => ({ id: d.id, ...d.data() }));
    const matchingIcons: any[] = [];
    for (const meta of iconMetas) {
      let rawBase64 = '';
      for (let c = 0; c < (meta as any).numChunks; c++) {
        const chunkDoc = iconsSnap.docs.find(d => d.id === `${(meta as any).index}_chunk_${c}`);
        if (chunkDoc) rawBase64 += chunkDoc.data().data;
      }
      if (rawBase64) {
        matchingIcons[(meta as any).index] = {
          base64: rawBase64,
          mimeType: (meta as any).mimeType,
          label: (meta as any).label,
          url: `data:${(meta as any).mimeType};base64,${rawBase64}`
        };
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
      brandKit: data.brandKit,
      matchingIcons: matchingIcons.filter(Boolean),
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
  
  const imagesPath = `projects/${id}/images`;
  let imagesSnap;
  try {
    imagesSnap = await getDocs(collection(db, imagesPath));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, imagesPath);
    return;
  }
  const deleteImages = imagesSnap.docs.map(docSnap => 
    deleteDoc(doc(db, imagesPath, docSnap.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `${imagesPath}/${docSnap.id}`))
  );
  
  const videoPath = `projects/${id}/video`;
  let videoSnap;
  try {
    videoSnap = await getDocs(collection(db, videoPath));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, videoPath);
    return;
  }
  const deleteVideos = videoSnap.docs.map(docSnap => 
    deleteDoc(doc(db, videoPath, docSnap.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `${videoPath}/${docSnap.id}`))
  );
  
  const iconsPath = `projects/${id}/icons`;
  let iconsSnap;
  try {
    iconsSnap = await getDocs(collection(db, iconsPath));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, iconsPath);
    return;
  }
  const deleteIcons = iconsSnap.docs.map(docSnap => 
    deleteDoc(doc(db, iconsPath, docSnap.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `${iconsPath}/${docSnap.id}`))
  );

  await Promise.all([...deleteImages, ...deleteVideos, ...deleteIcons]);
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
}

export async function saveTemplate(template: Template): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  const templatePath = `templates/${template.id}`;
  try {
    const templateRef = doc(db, 'templates', template.id);
    await setDoc(templateRef, {
      ...template,
      userId: user.uid,
      createdAt: template.createdAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, templatePath);
  }
}

export async function getTemplates(): Promise<Template[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const templatesPath = 'templates';
  try {
    const q = query(collection(db, templatesPath), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as Template);
    });
    
    return templates.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, templatesPath);
    return [];
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');
  const templatePath = `templates/${id}`;
  try {
    await deleteDoc(doc(db, 'templates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, templatePath);
  }
}
