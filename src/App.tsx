import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip';
import { Image as ImageIcon, Loader2, Film, Sparkles, Download, Settings2, KeyRound, Wand2, FolderHeart, LayoutGrid, Plus, X, Trash2, Undo2, Redo2, Palette, Type, Volume2, Monitor, Smartphone, CreditCard, ChevronRight, Share2, Archive } from 'lucide-react';
import { loginWithGoogle, logoutUser, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveProject, getProjects, deleteProject, Project, BrandKit } from './lib/db';

const STYLE_PRESETS = [
  'Logo', 'Minimalist', 'Corporate', 'Futuristic', 'Vintage', '3D', 'Vector', 'Flat', 'Photorealistic', 'Artistic'
];

export interface InteractiveVideoOption {
  style: string;
  blob: Blob | null;
  url: string | null;
  isLoading?: boolean;
}

export default function App() {
  const [hasKey, setHasKey] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [stylePreset, setStylePreset] = useState<string>('Logo');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageOptions, setImageOptions] = useState<{ base64: string; mimeType: string; url: string }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [animationPreset, setAnimationPreset] = useState<string>('Subtle Zoom');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
   const [videoOptions, setVideoOptions] = useState<InteractiveVideoOption[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [generationAction, setGenerationAction] = useState<string>('');
  
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isGeneratingBrandKit, setIsGeneratingBrandKit] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'brand' | 'mockup'>('design');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'transparent' | 'primary'>('transparent');
  const [selectedMockup, setSelectedMockup] = useState<'none' | 'businessCard' | 'phone' | 'sign'>('none');

  const [editHistory, setEditHistory] = useState<number[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  
  const [palette, setPalette] = useState<string[]>([]);
  const [palettePrompt, setPalettePrompt] = useState<string>('');
  const [paletteImageUrl, setPaletteImageUrl] = useState<string>('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('SOLODESIGN');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkedImageUrl, setWatermarkedImageUrl] = useState<string | null>(null);

  const [showProjects, setShowProjects] = useState(false);
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showProjects && user) {
      getProjects().then(setProjectsList);
    }
  }, [showProjects, user]);

  useEffect(() => {
    if (selectedImageIndex !== null && imageOptions[selectedImageIndex]) {
      if (!watermarkEnabled) {
        setWatermarkedImageUrl(null);
        return;
      }

      const originalUrl = imageOptions[selectedImageIndex].url;
      const applyCanvasWatermark = async () => {
        const result = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(originalUrl);

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(20, img.width * 0.04);
            ctx.font = `bold ${fontSize}px Helvetica Neue, Arial, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity})`;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(watermarkText || 'WATERMARK', img.width - (fontSize * 0.8), img.height - (fontSize * 0.8));

            resolve(canvas.toDataURL('image/png'));
          };
          img.src = originalUrl;
        });
        setWatermarkedImageUrl(result);
      };
      applyCanvasWatermark();
    } else {
      setWatermarkedImageUrl(null);
    }
  }, [selectedImageIndex, imageOptions, watermarkEnabled, watermarkText, watermarkOpacity]);

  const requestKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const generateLogo = async () => {
    if (!description.trim()) return;
    
    try {
      setIsGeneratingImage(true);
      setGenerationAction('Drafting logo designs...');
      setVideoUrl(null); // Reset video if making a new logo
      setVideoBlob(null);
      setImageOptions([]);
      setSelectedImageIndex(null);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompts = [
        `A professional ${stylePreset} style company logo. Clean, minimalist, and sleek. Description: ${description}. White background or transparent-like clean studio setup.${palette.length > 0 ? ` Use exactly this color palette: ${palette.join(', ')}.` : ''}${negativePrompt ? ` Elements to avoid: ${negativePrompt}` : ''}`,
        `A professional ${stylePreset} style company logo. Bold, vibrant, and highly expressive. Description: ${description}. White background or transparent-like clean studio setup.${palette.length > 0 ? ` Use exactly this color palette: ${palette.join(', ')}.` : ''}${negativePrompt ? ` Elements to avoid: ${negativePrompt}` : ''}`,
        `A professional ${stylePreset} style company logo. Abstract, geometric, and conceptual. Description: ${description}. White background or transparent-like clean studio setup.${palette.length > 0 ? ` Use exactly this color palette: ${palette.join(', ')}.` : ''}${negativePrompt ? ` Elements to avoid: ${negativePrompt}` : ''}`
      ];

      const promises = prompts.map(prompt => 
        ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize
            }
          }
        })
      );

      const responses = await Promise.all(promises);
      
      const newOptions = responses.map(res => {
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
          const { data, mimeType } = part.inlineData;
          return { base64: data, mimeType, url: `data:${mimeType};base64,${data}` };
        }
        return null;
      }).filter(Boolean) as { base64: string; mimeType: string; url: string }[];

      if (newOptions.length > 0) {
        setImageOptions(newOptions);
        setSelectedImageIndex(0);
        setEditHistory([0]);
        setHistoryPointer(0);
        
        const id = currentProjectId || crypto.randomUUID();
        if (!currentProjectId) setCurrentProjectId(id);
        
        await saveProject({
          id,
          title: description.trim().substring(0, 30) || 'Untitled Design',
          description,
          aspectRatio,
          imageSize,
          stylePreset,
          negativePrompt,
          imageOptions: newOptions,
          selectedImageIndex: 0,
          videoBlob: null,
          updatedAt: Date.now(),
          editHistory: [0],
          historyPointer: 0,
          palette,
          watermarkEnabled,
          watermarkText,
          watermarkOpacity,
          animationPreset,
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Requested entity was not found')) {
        setHasKey(false);
      } else {
        alert('Failed to generate image. Please check your API key and quota.');
      }
    } finally {
      setIsGeneratingImage(false);
      setGenerationAction('');
    }
  };

  const editLogo = async () => {
    if (!editPrompt.trim() || selectedImageIndex === null || !imageOptions[selectedImageIndex]) return;
    
    try {
      setIsEditingImage(true);
      setGenerationAction('Applying your edits...');
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const sourceImage = imageOptions[selectedImageIndex];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: sourceImage.base64,
                mimeType: sourceImage.mimeType
              }
            },
            { text: `${editPrompt}${palette.length > 0 ? `. Apply this color palette: ${palette.join(', ')}.` : ''}` }
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
          }
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        const { data, mimeType } = part.inlineData;
        const newImage = { base64: data, mimeType, url: `data:${mimeType};base64,${data}` };
        const updatedOptions = [...imageOptions, newImage];
        const newIndex = updatedOptions.length - 1;
        
        const newHistory = editHistory.slice(0, historyPointer + 1);
        newHistory.push(newIndex);
        
        setImageOptions(updatedOptions);
        setSelectedImageIndex(newIndex);
        setEditHistory(newHistory);
        setHistoryPointer(newHistory.length - 1);
        setEditPrompt('');
        
        await saveCurrent({
          imageOptions: updatedOptions,
          selectedImageIndex: newIndex,
          editHistory: newHistory,
          historyPointer: newHistory.length - 1,
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Requested entity was not found')) {
        setHasKey(false);
      } else {
        alert('Failed to edit image. Please check your API key and quota.');
      }
    } finally {
      setIsEditingImage(false);
      setGenerationAction('');
    }
  };

  const animateLogo = async () => {
    if (selectedImageIndex === null || !imageOptions[selectedImageIndex]) return;
    const selectedImageData = imageOptions[selectedImageIndex];
    
    try {
      setIsGeneratingVideo(true);
      setGenerationAction('Initializing video synthesis...');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const styles = ['Subtle Fades', 'Dynamic Spins', 'Flowing Movements'];
      
      const initialOptions = styles.map(style => ({ style, blob: null, url: null, isLoading: true }));
      setVideoOptions(initialOptions);
      setSelectedVideoIndex(0);

      const promises = styles.map(async (style, index) => {
        try {
          let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Animate this logo smoothly and professionally using a ${style} cinematic style. Ensure it looks high-end. Description context: ${description}`,
            image: {
              imageBytes: selectedImageData.base64,
              mimeType: selectedImageData.mimeType
            },
            config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: aspectRatio
            }
          });

          // Staggered polling loop per video
          while (!operation.done) {
            await new Promise(r => setTimeout(r, 8000 + Math.random() * 2000));
            operation = await ai.operations.getVideosOperation({ operation });
          }

          const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (uri) {
            const response = await fetch(uri, {
              method: 'GET',
              headers: {
                'x-goog-api-key': process.env.GEMINI_API_KEY as string,
              },
            });
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            setVideoOptions(prev => {
              const n = [...prev];
              n[index] = { style, blob, url, isLoading: false };
              return n;
            });
            return { style, blob, url };
          }
        } catch (err: any) {
          console.error(`Failed video style ${style}:`, err);
          setVideoOptions(prev => {
             const n = [...prev];
             n[index] = { style, blob: null, url: null, isLoading: false };
             return n;
          });
        }
        return { style, blob: null, url: null };
      });

      setGenerationAction('Synthesizing 3 simultaneous styles...');
      const results = await Promise.all(promises);
      const finalOptions = results.map((r, i) => r || { style: styles[i], blob: null, url: null, isLoading: false });
      
      const firstSuccess = finalOptions.findIndex(o => o.url);
      if (firstSuccess !== -1) {
         setSelectedVideoIndex(firstSuccess);
      }
      
      const vOptionsForDb = finalOptions
        .filter(opt => opt.blob)
        .map(({ blob, style, url }) => ({ blob: blob as Blob, style, url: url as string }));

      await saveCurrent({ videoOptions: vOptionsForDb.length > 0 ? vOptionsForDb : undefined });

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Requested entity was not found')) {
        setHasKey(false);
      } else {
        alert('Failed to generate video. Please check your API key and quota.');
      }
    } finally {
      setIsGeneratingVideo(false);
      setGenerationAction('');
    }
  };

  const startNewProject = () => {
    setCurrentProjectId(null);
    setDescription('');
    setAspectRatio('16:9');
    setImageSize('1K');
    setStylePreset('Logo');
    setNegativePrompt('');
    setImageOptions([]);
    setSelectedImageIndex(null);
    setEditHistory([]);
    setHistoryPointer(-1);
    setPalette([]);
    setPalettePrompt('');
    setWatermarkEnabled(false);
    setWatermarkText('SOLODESIGN');
    setAnimationPreset('Subtle Zoom');
    setVideoUrl(null);
    setVideoBlob(null);
    setVideoOptions([]);
    setSelectedVideoIndex(null);
    setBrandKit(null);
    setActiveTab('design');
    setPreviewBg('transparent');
    setSelectedMockup('none');
    setEditPrompt('');
    setShowProjects(false);
  };

  const loadProject = (prj: Project) => {
    setCurrentProjectId(prj.id);
    setDescription(prj.description);
    setAspectRatio(prj.aspectRatio);
    setImageSize(prj.imageSize);
    setImageOptions(prj.imageOptions);
    setSelectedImageIndex(prj.selectedImageIndex);
    setEditHistory(prj.editHistory || [prj.selectedImageIndex ?? 0]);
    setHistoryPointer(prj.historyPointer ?? 0);
    setPalette(prj.palette || []);
    setBrandKit(prj.brandKit || null);
    setWatermarkEnabled(prj.watermarkEnabled || false);
    setWatermarkText(prj.watermarkText || 'SOLODESIGN');
    setWatermarkOpacity(prj.watermarkOpacity ?? 0.7);
    setAnimationPreset(prj.animationPreset || 'Subtle Zoom');
    
    if (prj.videoOptions && prj.videoOptions.length > 0) {
       setVideoOptions(prj.videoOptions.map(o => ({ ...o, isLoading: false, url: o.url || URL.createObjectURL(o.blob) })));
       setSelectedVideoIndex(prj.selectedVideoIndex ?? 0);
       setVideoBlob(null);
       setVideoUrl(null);
    } else if (prj.videoBlob) {
       setVideoBlob(prj.videoBlob);
       setVideoUrl(URL.createObjectURL(prj.videoBlob));
       setVideoOptions([]);
       setSelectedVideoIndex(null);
    } else {
       setVideoBlob(null);
       setVideoUrl(null);
       setVideoOptions([]);
       setSelectedVideoIndex(null);
    }
    setStylePreset(prj.stylePreset || 'Logo');
    setNegativePrompt(prj.negativePrompt || '');
    setEditPrompt('');
    setShowProjects(false);
  };

  const saveCurrent = async (overrides: Partial<Project> = {}) => {
    if (!currentProjectId) return;
    
    let safeVideoOptionsFromState = undefined;
    if (videoOptions && videoOptions.length > 0) {
      safeVideoOptionsFromState = videoOptions
          .filter(o => o.blob)
          .map(({ blob, style, url }) => ({ blob: blob as Blob, style, url: url || undefined }));
    }

    await saveProject({
      id: currentProjectId,
      title: description.trim().substring(0, 30) || 'Untitled Design',
      description,
      aspectRatio,
      imageSize,
      stylePreset,
      negativePrompt,
      imageOptions,
      selectedImageIndex,
      videoBlob,
      videoOptions: safeVideoOptionsFromState,
      selectedVideoIndex,
      updatedAt: Date.now(),
      editHistory,
      historyPointer,
      palette,
      brandKit: overrides.brandKit !== undefined ? overrides.brandKit : brandKit,
      watermarkEnabled,
      watermarkText,
      watermarkOpacity,
      animationPreset,
      ...overrides
    });
  };

  const handleSelectImage = async (index: number) => {
    const newHistory = editHistory.slice(0, historyPointer + 1);
    // Don't push duplicates if they click the same image twice in a row
    if (newHistory[newHistory.length - 1] !== index) {
       newHistory.push(index);
    }
    
    setSelectedImageIndex(index);
    setEditHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);

    await saveCurrent({
       selectedImageIndex: index,
       editHistory: newHistory,
       historyPointer: newHistory.length - 1,
    });
  };

  const handleUndo = async () => {
     if (historyPointer > 0) {
        const newPointer = historyPointer - 1;
        const prevIndex = editHistory[newPointer];
        setSelectedImageIndex(prevIndex);
        setHistoryPointer(newPointer);
        
        await saveCurrent({
          selectedImageIndex: prevIndex,
          historyPointer: newPointer,
        });
     }
  };

  const handleRedo = async () => {
     if (historyPointer < editHistory.length - 1) {
        const newPointer = historyPointer + 1;
        const nextIndex = editHistory[newPointer];
        setSelectedImageIndex(nextIndex);
        setHistoryPointer(newPointer);

        await saveCurrent({
          selectedImageIndex: nextIndex,
          historyPointer: newPointer,
        });
     }
  };

  const generateColors = async (mode: 'text' | 'image' | 'url') => {
    setIsGeneratingPalette(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let parts: any[] = [];
      
      if (mode === 'text') {
        parts = [{ text: `You are an expert color designer. Suggest a beautiful color palette of exactly 5 hex codes based on this description: "${palettePrompt}". Respond ONLY with a JSON array of strings, e.g. ["#FFFFFF", "#000000", ...].` }];
      } else if (mode === 'image' && selectedImageIndex !== null && imageOptions[selectedImageIndex]) {
        const sourceImage = imageOptions[selectedImageIndex];
        parts = [
          { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
          { text: `You are an expert color designer. Extract a beautiful color palette of exactly 5 hex codes from this image. Respond ONLY with a JSON array of strings, e.g. ["#FFFFFF", "#000000", ...].` }
        ];
      } else if (mode === 'url' && paletteImageUrl.trim()) {
        const url = paletteImageUrl.trim();
        const base64Data = await new Promise<{base64: string, mimeType: string}>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
             const canvas = document.createElement('canvas');
             canvas.width = img.width;
             canvas.height = img.height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/png' });
             } else {
                reject(new Error("Failed to get context"));
             }
          };
          img.onerror = () => reject(new Error("Failed to load image from URL. Typical cause is CORS restrictions from the host site."));
          img.src = url;
        });

        parts = [
          { inlineData: { data: base64Data.base64, mimeType: base64Data.mimeType } },
          { text: `You are an expert color designer. Extract a beautiful color palette of exactly 5 hex codes from this image. Respond ONLY with a JSON array of strings, e.g. ["#FFFFFF", "#000000", ...].` }
        ];
      }

      if (parts.length === 0) {
        throw new Error('Invalid input or missing image for palette generation.');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
      });
      
      const text = response.text || '';
      const match = text.match(/\[(.*?)\]/s);
      
      if (match) {
        const parsed = JSON.parse(`[${match[1]}]`);
        if (Array.isArray(parsed)) {
          setPalette(parsed);
          await saveCurrent({ palette: parsed });
        }
      }
    } catch (err) {
      console.error('Failed to generate palette:', err);
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const generateBrandKit = async () => {
    if (!description.trim()) return;
    setIsGeneratingBrandKit(true);
    setGenerationAction('Analyzing brand identity...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an elite brand strategist. Based on this company description: "${description}", suggest a professional brand kit. 
      Respond ONLY with a JSON object in this exact format:
      {
        "typography": ["Primary Font Name", "Secondary Font Name"],
        "voice": "A one-sentence description of the brand's tone of voice",
        "secondaryColors": ["#hex1", "#hex2"]
      }
      Ensure the suggestions are high-end and cohesive with the description.`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: { parts: [{ text: prompt }] },
      });
      
      const text = response.text || '';
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        const kitData = JSON.parse(match[0]);
        setBrandKit(kitData);
        await saveCurrent({ brandKit: kitData });
        setActiveTab('brand');
      }
    } catch (err) {
      console.error('Failed to generate brand kit:', err);
    } finally {
      setIsGeneratingBrandKit(false);
      setGenerationAction('');
    }
  };

  const handlePaletteAdd = async (color: string) => {
     const newPalette = [...palette, color];
     setPalette(newPalette);
     await saveCurrent({ palette: newPalette });
  };

  const handlePaletteRemove = async (indexToRemove: number) => {
     const newPalette = palette.filter((_, idx) => idx !== indexToRemove);
     setPalette(newPalette);
     await saveCurrent({ palette: newPalette });
  };

  const toggleWatermark = async () => {
    const newState = !watermarkEnabled;
    setWatermarkEnabled(newState);
    await saveCurrent({ watermarkEnabled: newState });
  };

  const handleWatermarkBlur = async () => {
    await saveCurrent();
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    
    setGenerationAction('Packaging assets...');
    try {
      // 1. Add images
      for (let i = 0; i < imageOptions.length; i++) {
        const img = imageOptions[i];
        zip.file(`logo-variation-${i + 1}.png`, img.base64, { base64: true });
      }
      
      // 2. Add videos
      for (let i = 0; i < videoOptions.length; i++) {
          const v = videoOptions[i];
          if (v.blob) {
              zip.file(`animation-${v.style.replace(/\s+/g, '-').toLowerCase()}.mp4`, v.blob);
          }
      }

      // 3. Add brand info
      let brandInfo = `SOLODESIGN CREATIVE DELIVERY\n`;
      brandInfo += `Project: ${description.substring(0, 50)}\n\n`;
      brandInfo += `PRIMARY PALETTE:\n${palette.join(', ')}\n\n`;
      
      if (brandKit) {
          brandInfo += `TYPOGRAPHY:\n${brandKit.typography.join(', ')}\n\n`;
          brandInfo += `BRAND VOICE:\n${brandKit.voice}\n\n`;
          brandInfo += `SECONDARY ACCENTS:\n${brandKit.secondaryColors.join(', ')}\n\n`;
      }
      
      zip.file('brand-identity-kit.txt', brandInfo);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solodesign-delivery-${Date.now()}.zip`;
      link.click();
    } catch (err) {
      console.error('Failed to create batch export:', err);
    } finally {
      setGenerationAction('');
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjectsList(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      startNewProject();
      setShowProjects(true); // stay on dashboard
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative font-['Helvetica_Neue',Arial,sans-serif]" style={{ backgroundColor: '#0f111a' }}>
        <Loader2 className="animate-spin text-white/50" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative font-['Helvetica_Neue',Arial,sans-serif]" 
           style={{ 
             backgroundColor: '#0f111a', 
             backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(100, 149, 237, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(138, 43, 226, 0.3) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(0, 255, 127, 0.2) 0%, transparent 50%)' 
           }}>
        <div className="max-w-sm w-full bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-[32px] p-8 text-center space-y-6 shadow-2xl text-white">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-[#4facfe]">
            <KeyRound size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to SoloDesign</h2>
            <p className="text-white/60 text-sm">
              Please sign in to manage, export, and sync your personalized creative portfolio across devices.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="w-full py-4 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (authReady && !user) {
    return <LandingPage onStart={loginWithGoogle} />;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative font-['Helvetica_Neue',Arial,sans-serif]" 
           style={{ 
             backgroundColor: '#0f111a', 
             backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(100, 149, 237, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(138, 43, 226, 0.3) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(0, 255, 127, 0.2) 0%, transparent 50%)' 
           }}>
        <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-[32px] p-8 text-center space-y-6 shadow-2xl text-white">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-yellow-500">
            <KeyRound size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Paid API Key Required</h2>
            <p className="text-white/60 text-sm">
              This app uses advanced Video (Veo) and Image (Pro) generation models which require an API key from a paid Google Cloud project.
            </p>
          </div>
          <a href="https://ai.google.dev/pricing" target="_blank" rel="noreferrer" className="block text-xs text-[#4facfe] hover:underline">
            View billing documentation
          </a>
          <button
            onClick={requestKey}
            className="w-full py-4 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  if (showProjects) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center relative font-['Helvetica_Neue',Arial,sans-serif]" 
           style={{ 
              backgroundColor: '#0f111a', 
              backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(100, 149, 237, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(138, 43, 226, 0.3) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(0, 255, 127, 0.2) 0%, transparent 50%)' 
           }}>
        <div className="w-full max-w-[1240px] h-full md:h-[800px] max-h-[calc(100vh-2rem)] backdrop-blur-[20px] bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl text-white p-8">
          
          <div className="flex justify-between items-center mb-10 shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <FolderHeart className="text-[#4facfe]" size={24} />
               </div>
               <div>
                 <h1 className="text-2xl font-bold tracking-tight">Saved Designs</h1>
                 <p className="text-sm text-white/50">Pick up where you left off</p>
               </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowProjects(false)} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-semibold hover:bg-white/10 transition flex items-center gap-2">
                <X size={16} /> Close
              </button>
              <button onClick={startNewProject} className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Plus size={16} /> New Design
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 pb-8">
            {projectsList.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                 <LayoutGrid size={48} className="opacity-50" />
                 <p className="text-lg">No saved designs found.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {projectsList.map(p => (
                   <div key={p.id} onClick={() => loadProject(p)} className="group cursor-pointer bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 hover:border-[#4facfe]/50 hover:bg-white/10 transition-all flex flex-col overflow-hidden relative shadow-lg hover:shadow-[0_0_30px_rgba(79,172,254,0.15)]">
                     <div className="w-full aspect-square bg-black/40 rounded-[16px] mb-5 overflow-hidden relative border border-white/5">
                       {p.imageOptions && p.imageOptions.length > 0 && p.selectedImageIndex !== null ? (
                         <img src={p.imageOptions[p.selectedImageIndex].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-white/20"><ImageIcon size={32}/></div>
                       )}
                       {p.videoBlob && (
                         <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/20">
                           <Film size={14} className="text-[#00f2fe]" />
                         </div>
                       )}
                     </div>
                     <div className="flex justify-between items-start gap-4 flex-1">
                        <div>
                          <h3 className="font-semibold text-[17px] text-white line-clamp-1 mb-1">{p.title}</h3>
                          <p className="text-white/40 text-[12px]">{new Date(p.updatedAt).toLocaleDateString()} • {p.imageOptions.length} variants</p>
                        </div>
                        <button onClick={(e) => handleDeleteProject(p.id, e)} className="p-2.5 text-white/30 hover:text-red-400 hover:bg-black/20 rounded-full transition-colors z-10">
                          <Trash2 size={16} />
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-start md:items-center justify-center relative font-['Helvetica_Neue',Arial,sans-serif]" 
         style={{ 
            backgroundColor: '#0f111a', 
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(100, 149, 237, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(138, 43, 226, 0.3) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(0, 255, 127, 0.2) 0%, transparent 50%)' 
         }}>
      
      <div className="w-full max-w-[1240px] flex flex-col md:flex-row md:h-[800px] md:max-h-[calc(100vh-2rem)] backdrop-blur-[20px] bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl text-white">
        
        {/* Left Panel: Controls */}
        <div className="w-full md:w-[360px] lg:w-[400px] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col md:shrink-0 overflow-visible md:overflow-y-auto">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-[3px] bg-gradient-to-br from-[#00f2fe] to-[#4facfe]"></div>
              <h1 className="text-[20px] font-extrabold tracking-tight uppercase">SOLODESIGN</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowProjects(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-[#4facfe] transition-colors"
                title="Saved Designs"
              >
                <FolderHeart size={18} />
              </button>
              <button 
                onClick={logoutUser}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-5 flex-1 flex flex-col">
            {/* Describe Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 block">
                Company Description
              </label>
              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] transition-all resize-none h-[110px] text-sm"
                placeholder="A modern fintech startup focused on fluid currency exchange and instant digital borderless payments. Sharp, clean, and professional feel."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </section>

            {/* Configuration Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 block">
                Dimensions & Quality
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Aspect Ratio</span>
                  <select
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-[13px] focus:outline-none focus:border-[#4facfe] transition-all appearance-none text-white [&>option]:text-black"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="4:3">4:3 Desktop</option>
                    <option value="3:4">3:4 Social</option>
                    <option value="16:9">16:9 Cinematic</option>
                    <option value="9:16">9:16 Vertical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Quality</span>
                  <select
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-[13px] focus:outline-none focus:border-[#4facfe] transition-all appearance-none text-white [&>option]:text-black"
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as '1K' | '2K' | '4K')}
                  >
                    <option value="1K">1K Base</option>
                    <option value="2K">2K Super</option>
                    <option value="4K">4K Ultra</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Visual Style Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 block">
                Visual Style & Constraints
              </label>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Style Preset</span>
                  <select
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-[13px] focus:outline-none focus:border-[#4facfe] transition-all appearance-none text-white [&>option]:text-black"
                    value={stylePreset}
                    onChange={(e) => setStylePreset(e.target.value)}
                  >
                    {STYLE_PRESETS.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Negative Prompt (Avoid)</span>
                  <input
                    type="text"
                    placeholder="e.g. text, blurry, distorted"
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] text-[13px] transition-all"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Brand Colors Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 block">
                Brand Colors (Optional)
              </label>
              
              <div className="flex gap-2 mb-4 flex-wrap">
                {palette.map((color, i) => (
                  <div 
                    key={i} 
                    className="relative group w-8 h-8 rounded-full border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] cursor-pointer hover:scale-110 transition-transform" 
                    style={{ backgroundColor: color }}
                    title={`Click to add ${color} to prompt`}
                    onClick={() => {
                       setDescription(prev => {
                          const separator = prev.trim() && !prev.endsWith(',') && !prev.endsWith('.') ? ', ' : (prev.trim() ? ' ' : '');
                          return prev + separator + `use the hex color ${color}`;
                       });
                    }}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePaletteRemove(i); }}
                      className="absolute -top-1 -right-1 bg-red-500/90 hover:bg-red-500 text-white rounded-full w-[18px] h-[18px] flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] transition-all backdrop-blur-md"
                      title="Remove color"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {color} (Click to use)
                    </div>
                  </div>
                ))}
                {palette.length < 6 && (
                   <div className="relative w-8 h-8 rounded-full border border-dashed border-white/30 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors group">
                      <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handlePaletteAdd(e.target.value)} />
                      <Plus size={14} className="text-white/50 group-hover:text-white" />
                   </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      placeholder="AI Palette (e.g. Neo Tokyo)" 
                      value={palettePrompt}
                      onChange={(e) => setPalettePrompt(e.target.value)}
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] text-[13px] transition-all"
                   />
                   <button 
                      onClick={() => generateColors('text')}
                      disabled={isGeneratingPalette || !palettePrompt.trim()}
                      className="px-3.5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 flex items-center justify-center transition-colors"
                      title="Suggest colors from text"
                   >
                     {isGeneratingPalette ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                   </button>
                </div>
                <div className="flex gap-2">
                   <input 
                      type="url" 
                      placeholder="Paste Image URL to extract" 
                      value={paletteImageUrl}
                      onChange={(e) => setPaletteImageUrl(e.target.value)}
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] text-[13px] transition-all"
                   />
                   <button 
                      onClick={() => generateColors('url')}
                      disabled={isGeneratingPalette || !paletteImageUrl.trim()}
                      className="px-3.5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 flex items-center justify-center transition-colors"
                      title="Extract colors from URL"
                   >
                     {isGeneratingPalette && paletteImageUrl.trim() ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                   </button>
                </div>
                <button 
                   onClick={() => generateColors('image')}
                   disabled={isGeneratingPalette || imageOptions.length === 0 || selectedImageIndex === null}
                   className="w-full py-2.5 bg-white/5 border border-white/10 text-white/70 text-[12px] rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                   <ImageIcon size={14} /> Extract from Selected Image
                </button>
              </div>
            </section>

            {/* Watermark Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 block">
                  Watermark
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest leading-none mt-[2px]">{watermarkEnabled ? 'On' : 'Off'}</span>
                  <button
                    onClick={toggleWatermark}
                    className={`shrink-0 w-8 h-4 rounded-full flex items-center transition-colors px-0.5 ${watermarkEnabled ? 'bg-[#4facfe]' : 'bg-white/20'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${watermarkEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              <div className={`transition-opacity ${watermarkEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'} space-y-3`}>
                <input 
                  type="text" 
                  placeholder="Custom Watermark Text" 
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  onBlur={handleWatermarkBlur}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] text-[13px] transition-all"
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase text-white/50 tracking-wider">Opacity</label>
                    <span className="text-[10px] text-white/50 font-mono">{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    onMouseUp={handleWatermarkBlur}
                    onTouchEnd={handleWatermarkBlur}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#4facfe] [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>
            </section>

            {/* Refine Section */}
            <section className={`bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5 transition-opacity ${imageOptions.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 block">
                  Refine Selected Design
                </label>
                <div className="flex gap-1">
                  <button 
                    onClick={handleUndo} 
                    disabled={historyPointer <= 0}
                    className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button 
                    onClick={handleRedo} 
                    disabled={historyPointer >= editHistory.length - 1}
                    className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>
              </div>
              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] transition-all resize-none h-[60px] text-sm"
                placeholder="e.g., Change accent colors to gold, make it sharper..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
              />
              <button
                onClick={editLogo}
                disabled={!editPrompt.trim() || isEditingImage || imageOptions.length === 0}
                className="w-full mt-3 py-[10px] px-4 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[13px]"
              >
                {isEditingImage ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {isEditingImage ? 'Applying Edit...' : 'Apply Edit'}
              </button>
            </section>

            {/* Brand Kit Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 block">
                  AI Brand Kit
                </label>
                {brandKit && (
                  <button 
                    onClick={() => setActiveTab(activeTab === 'brand' ? 'design' : 'brand')} 
                    className="text-[10px] text-[#4facfe] flex items-center gap-1 hover:underline uppercase font-bold tracking-widest"
                  >
                    {activeTab === 'brand' ? 'Hide' : 'Show Details'}
                  </button>
                )}
              </div>
              
              {!brandKit ? (
                <button
                  onClick={generateBrandKit}
                  disabled={isGeneratingBrandKit || !description.trim()}
                  className="w-full py-2.5 bg-white/5 border border-white/10 text-white text-[12px] rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {isGeneratingBrandKit ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="text-[#4facfe]" />}
                  {isGeneratingBrandKit ? 'Strategic Analysis...' : 'Generate Brand Strategy'}
                </button>
              ) : (
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Type size={16} className="text-[#4facfe]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[10px] text-white/40 uppercase mb-0.5 tracking-wider font-bold">Suggested Typography</div>
                        <div className="text-[12px] truncate">{brandKit.typography.join(' / ')}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Volume2 size={16} className="text-[#4facfe]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[10px] text-white/40 uppercase mb-0.5 tracking-wider font-bold">Brand Voice</div>
                        <div className="text-[12px] line-clamp-1 italic italic text-white/70">"{brandKit.voice}"</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Archive size={16} className="text-[#4facfe]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-white/40 uppercase mb-0.5 tracking-wider font-bold">Secondary Accents</div>
                        <div className="flex gap-1.5 mt-0.5">
                           {brandKit.secondaryColors.map((c, i) => (
                             <div key={i} className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: c }} title={c} />
                           ))}
                        </div>
                      </div>
                   </div>
                </div>
              )}
            </section>

            {/* Export & Delivery Session */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 block mb-3">
                Final Delivery
              </label>
              <button
                onClick={downloadAll}
                disabled={imageOptions.length === 0}
                className="w-full py-3 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 text-[13px] shadow-[0_0_20px_rgba(79,172,254,0.3)]"
              >
                <Archive size={18} />
                Generate Assets Zip (.ZIP)
              </button>
            </section>

          </div>
        </div>

        {/* Right Panel: Output & Preview */}
        <div className="flex-1 min-h-[500px] md:min-h-0 p-6 relative flex flex-col bg-black/10">
          <div className="w-full h-full bg-black/20 rounded-[20px] border border-white/5 flex flex-col relative overflow-hidden">
            
            <div className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <h2 className="text-[14px] uppercase tracking-[2px] text-white/50">{videoOptions.length > 0 || videoUrl ? 'Final_Render.mp4' : imageOptions.length > 0 ? `Draft_Option_0${(selectedImageIndex || 0) + 1}.png` : 'Awaiting_Prompt...'}</h2>
                
                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setActiveTab('design')}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'design' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Design
                  </button>
                  <button 
                    onClick={() => setActiveTab('mockup')}
                    disabled={imageOptions.length === 0}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-20 ${activeTab === 'mockup' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Context
                  </button>
                  <button 
                    onClick={() => setActiveTab('brand')}
                    disabled={!brandKit}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-20 ${activeTab === 'brand' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Kit
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setPreviewBg('light')}
                    className={`w-6 h-6 rounded bg-white border border-white/10 transition-all ${previewBg === 'light' ? 'scale-110 shadow-[0_0_10px_white]' : 'opacity-40 hover:opacity-100'}`}
                  />
                  <button 
                    onClick={() => setPreviewBg('dark')}
                    className={`w-6 h-6 rounded bg-black border border-white/10 transition-all ml-1 ${previewBg === 'dark' ? 'scale-110 shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'opacity-40 hover:opacity-100'}`}
                  />
                  <button 
                    onClick={() => setPreviewBg('primary')}
                    className={`w-6 h-6 rounded bg-[#4facfe] border border-white/10 transition-all ml-1 ${previewBg === 'primary' ? 'scale-110 shadow-[0_0_10px_rgba(79,172,254,0.5)]' : 'opacity-40 hover:opacity-100'}`}
                  />
                  <button 
                    onClick={() => setPreviewBg('transparent')}
                    className={`w-6 h-6 rounded bg-[url(https://www.transparenttextures.com/patterns/carbon-fibre.png)] border border-white/10 transition-all ml-1 ${previewBg === 'transparent' ? 'scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'opacity-40 hover:opacity-100'}`}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-md"></div>
                  <div className="w-8 h-8 bg-white/10 rounded-md"></div>
                </div>
              </div>
            </div>

            <div className={`flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
              previewBg === 'light' ? 'bg-white' :
              previewBg === 'dark' ? 'bg-[#0a0a0a]' :
              previewBg === 'primary' ? 'bg-[#4facfe]' :
              'bg-[#0f111a] bg-[url(https://www.transparenttextures.com/patterns/carbon-fibre.png)]'
            }`}>
              <AnimatePresence mode="wait">
                {(isGeneratingImage || isGeneratingVideo || isEditingImage) ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-center justify-center text-center z-10"
                  >
                    <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-[40px] bg-gradient-to-br from-[#00f2fe] to-[#4facfe] shadow-[0_0_60px_rgba(79,172,254,0.4)] flex items-center justify-center relative mb-8">
                       <div className="absolute top-[-10px] left-[-10px] w-5 h-5 border border-white opacity-30"></div>
                       <div className="absolute bottom-[-10px] right-[-10px] w-5 h-5 border border-white opacity-30"></div>
                       <Loader2 size={48} className="text-white animate-spin opacity-80" />
                    </div>
                    <div className="px-5 py-2.5 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-full text-[12px] flex items-center gap-2 text-white">
                      <div className="w-2 h-2 rounded-full bg-[#00ff7f] shadow-[0_0_10px_#00ff7f] animate-pulse"></div>
                      {generationAction}
                    </div>
                  </motion.div>
                ) : activeTab === 'brand' && brandKit ? (
                  <motion.div
                    key="brand-kit-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-2xl bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-2xl space-y-12 z-10"
                  >
                    <div className="space-y-4">
                       <h3 className="text-[#4facfe] text-[10px] uppercase font-bold tracking-[0.3em]">Institutional Tone</h3>
                       <p className="text-2xl font-medium leading-relaxed italic text-white/90">"{brandKit.voice}"</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <h3 className="text-[#4facfe] text-[10px] uppercase font-bold tracking-[0.3em]">Typographic Pairings</h3>
                          <div className="space-y-4">
                             {brandKit.typography.map((font, i) => (
                               <div key={i} className="flex flex-col border-l-2 border-white/10 pl-6 space-y-1">
                                  <span className="text-4xl font-light tracking-tight">{font}</span>
                                  <span className="text-[10px] text-white/30 uppercase tracking-widest">{i === 0 ? 'Display Header' : 'Accent Copy'}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <h3 className="text-[#4facfe] text-[10px] uppercase font-bold tracking-[0.3em]">Core Color DNA</h3>
                          <div className="grid grid-cols-5 gap-2">
                             {[...palette, ...brandKit.secondaryColors].slice(0, 5).map((c, i) => (
                               <div key={i} className="group relative">
                                  <div className="aspect-[2/3] rounded-lg border border-white/10 shadow-xl" style={{ backgroundColor: c }} />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg">
                                    <span className="text-[8px] font-mono font-bold tracking-tighter uppercase">{c}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'mockup' ? (
                   <motion.div
                    key="mockup-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full flex flex-col items-center justify-center p-8 z-10"
                   >
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                        <div className="group relative aspect-video bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                           <img src="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-40" />
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-12">
                              <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-24 h-24 object-contain drop-shadow-2xl mix-multiply contrast-125 brightness-90 shadow-black" />
                           </div>
                           <div className="absolute bottom-4 left-4 text-[10px] uppercase font-bold tracking-widest text-[#4facfe]/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Institutional Wall</div>
                        </div>
                        <div className="group relative aspect-video bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                           <img src="https://images.unsplash.com/photo-1586075010633-2470acfd858b?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-40 saturate-0" />
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-12">
                              <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-16 h-16 object-contain drop-shadow-xl rotate-[-2deg] opacity-80" />
                           </div>
                           <div className="absolute bottom-4 left-4 text-[10px] uppercase font-bold tracking-widest text-[#4facfe]/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Business Suite</div>
                        </div>
                        <div className="group relative aspect-video bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                           <img src="https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-40 brightness-50" />
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                              <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-32 h-32 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
                           </div>
                           <div className="absolute bottom-4 left-4 text-[10px] uppercase font-bold tracking-widest text-[#4facfe]/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Retail Identity</div>
                        </div>
                     </div>
                     <button onClick={() => setActiveTab('design')} className="mt-12 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                       Return to Design Studio <ChevronRight size={14} />
                     </button>
                   </motion.div>
                ) : (videoOptions.length > 0 && selectedVideoIndex !== null) || videoUrl ? (
                  <motion.div 
                    key="video-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col justify-between items-center z-10 p-2 relative"
                  >
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 mb-4 px-4 overflow-hidden relative group">
                      <div className="relative flex items-center justify-center w-full h-full overflow-hidden rounded-[20px] p-2">
                        {((videoOptions.length > 0 && !videoOptions[selectedVideoIndex ?? 0]?.url) && !videoUrl) ? (
                          <div className="animate-pulse bg-white/5 w-full h-full rounded-[12px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-white/20" size={32} />
                          </div>
                        ) : (
                          <video 
                            src={videoOptions.length > 0 ? videoOptions[selectedVideoIndex ?? 0]?.url! : videoUrl!}
                            autoPlay 
                            loop 
                            controls
                            className={`max-w-full max-h-full rounded-[12px] drop-shadow-2xl ${aspectRatio === '16:9' ? 'w-full object-contain' : 'h-full object-contain'}`}
                          />
                        )}
                      </div>
                      <a 
                        href={videoOptions.length > 0 ? videoOptions[selectedVideoIndex ?? 0]?.url! : videoUrl!}
                        download={`animated-logo-${videoOptions[selectedVideoIndex ?? 0]?.style || 'style'}.mp4`}
                        className="absolute top-4 right-8 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-full text-sm font-semibold shadow-xl"
                      >
                        <Download size={16} /> Save Motion
                      </a>
                    </div>
                    {videoOptions.length > 0 && (
                      <div className="flex gap-4 shrink-0 overflow-x-auto pb-4 justify-center w-full px-4">
                        {videoOptions.map((opt, i) => (
                           <button 
                             key={i} 
                             onClick={() => setSelectedVideoIndex(i)}
                             disabled={!opt.url}
                             className={`relative shrink-0 flex flex-col items-center justify-center w-32 h-20 md:w-40 md:h-24 rounded-[12px] overflow-hidden border-[3px] transition-all bg-black/50 ${
                               selectedVideoIndex === i ? 'border-[#4facfe] shadow-[0_0_20px_rgba(79,172,254,0.4)] scale-105' : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/30'
                             }`}
                           >
                             <div className="text-[12px] font-bold z-10 text-center">{opt.style}</div>
                             {!opt.url && <div className="text-[10px] text-white/40 mt-1">Failed</div>}
                             {opt.url && (
                                <video src={opt.url} muted className="absolute inset-0 w-full h-full object-cover opacity-30" />
                             )}
                           </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (imageOptions.length > 0 && selectedImageIndex !== null) ? (
                   <motion.div 
                    key="image-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col justify-between items-center z-10 p-2 relative"
                  >
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 mb-4 px-4 overflow-hidden relative group">
                      <img 
                        src={watermarkedImageUrl || imageOptions[selectedImageIndex].url} 
                        alt="Selected Option" 
                        className="object-contain max-h-full max-w-full rounded-[24px] shadow-2xl"
                      />
                      <a 
                        href={watermarkedImageUrl || imageOptions[selectedImageIndex].url}
                        download={`solodesign-variant-${selectedImageIndex + 1}${watermarkEnabled ? '-watermarked' : ''}.png`}
                        className="absolute top-4 right-8 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-semibold shadow-xl"
                      >
                        <Download size={16} /> Save 
                      </a>
                    </div>
                    <div className="flex gap-4 shrink-0 overflow-x-auto pb-4 justify-center w-full px-4">
                       {imageOptions.map((opt, i) => (
                         <button 
                           key={i} 
                           onClick={() => handleSelectImage(i)}
                           className={`relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-[12px] overflow-hidden border-[3px] transition-all bg-black/50 ${
                             selectedImageIndex === i ? 'border-[#4facfe] shadow-[0_0_20px_rgba(79,172,254,0.4)] scale-105' : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/30'
                           }`}
                         >
                           <img src={opt.url} className="w-full h-full object-cover" />
                           <div className="absolute top-1 left-1 bg-black/60 rounded px-1.5 py-0.5 text-[9px] font-bold">0{i+1}</div>
                         </button>
                       ))}
                    </div>
                  </motion.div>
                ) : (
                   <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center z-10 opacity-40 flex flex-col items-center"
                  >
                    <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-[40px] border border-white/10 bg-black/20 flex items-center justify-center relative mb-8">
                       <div className="absolute top-[-10px] left-[-10px] w-5 h-5 border border-white/50"></div>
                       <div className="absolute bottom-[-10px] right-[-10px] w-5 h-5 border border-white/50"></div>
                       <div className="w-[90px] h-[90px] border-[14px] border-white/20 rounded-full border-r-transparent -rotate-45"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="text-white/40 text-[11px] uppercase tracking-widest">
                 Resolution: {imageSize} | Format: {aspectRatio}
              </div>
              {(isGeneratingImage || isGeneratingVideo || isEditingImage) && (
                <div className="w-[100px] h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-[#4facfe] rounded-full animate-pulse mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-[#4facfe] selection:text-white items-center justify-center p-8 overflow-hidden relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-[#4facfe] rounded-full opacity-[0.07] blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-[#00f2fe] rounded-full opacity-[0.05] blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#00f2fe] to-[#4facfe] shadow-[0_0_20px_rgba(79,172,254,0.6)]"></div>
            <span className="text-[14px] font-bold tracking-[0.3em] uppercase opacity-70">SOLODESIGN</span>
          </div>
          
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[0.9] tracking-tighter mb-8 uppercase italic selection:bg-white selection:text-black">
            The next<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#4facfe]">Generation</span><br />
            of Identity
          </h1>

          <p className="text-[16px] md:text-[20px] text-white/50 max-w-xl mx-auto mb-12 font-medium leading-relaxed">
            Generate high-end corporate identity, logos, and motion graphics with AI-driven precision. Professional tools for modern enterprise.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={onStart}
              className="px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center gap-3 text-lg group"
            >
              Get Started Free <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
            <div className="px-6 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold uppercase tracking-widest text-white/40 text-nowrap">
              No Credit Card Required
            </div>
          </div>
        </motion.div>

        {/* Floating Examples */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
           {[1, 2, 3, 4].map(i => (
             <motion.div 
               key={i}
               className="aspect-square bg-white/5 border border-white/10 rounded-[20px] overflow-hidden"
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 * i }}
             >
               <img 
                 src={`https://picsum.photos/seed/logo${i}/400/400`} 
                 alt="Example Logo" 
                 referrerPolicy="no-referrer"
                 className="w-full h-full object-cover"
               />
             </motion.div>
           ))}
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-widest text-white/20 whitespace-nowrap">
        Built for the future of professional branding &copy; 2024 SoloDesign
      </div>
    </div>
  );
}

