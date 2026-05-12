import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip';
import { Image as ImageIcon, Loader2, Film, Sparkles, Download, Settings2, KeyRound, Wand2, FolderHeart, LayoutGrid, Plus, X, Trash2, Undo2, Redo2, Palette, Type, Volume2, Monitor, Smartphone, CreditCard, ChevronRight, Share2, Archive, ShieldCheck, Bookmark, BookMarked, Tags, FileCode, Brush, Zap, Target } from 'lucide-react';
import { loginWithGoogle, logoutUser, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveProject, getProjects, deleteProject, Project, BrandKit, Template, saveTemplate, getTemplates, deleteTemplate } from './lib/db';

const STYLE_PRESETS = [
  'Logo', 'Minimalist', 'Corporate', 'Futuristic', 'Vintage', '3D', 'Vector', 'Flat', 'Photorealistic', 'Artistic'
];

export interface InteractiveVideoOption {
  style: string;
  blob: Blob | null;
  url: string | null;
  isLoading?: boolean;
}

function OnboardingTutorial({ step, steps, onNext, onSkip }: { step: number; steps: any[]; onNext: () => void; onSkip: () => void }) {
  const currentStep = steps[step];
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const updateCoords = () => {
      const el = document.getElementById(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    };
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [step, currentStep.target]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onSkip}
      />
      
      {/* Target Highlight */}
      <motion.div
        animate={{
          top: coords.top - 8,
          left: coords.left - 8,
          width: coords.width + 16,
          height: coords.height + 16,
        }}
        className="absolute border-2 border-[#4facfe] rounded-2xl shadow-[0_0_50px_rgba(79,172,254,0.3)] z-[10000]"
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      />

      {/* Tooltip */}
      <motion.div
        animate={{
          top: coords.top + (currentStep.position === 'right' ? 0 : coords.height + 20),
          left: coords.left + (currentStep.position === 'right' ? coords.width + 40 : 0),
          scale: 1,
          opacity: 1
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        className="absolute w-[300px] bg-[#1a1c25] border border-white/10 rounded-[32px] p-8 shadow-2xl z-[10001] pointer-events-auto"
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      >
        <div className="space-y-4">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4facfe]">Step {step + 1} of {steps.length}</span>
              <button onClick={onSkip} className="p-1 hover:bg-white/5 rounded-md text-white/20 hover:text-white transition-colors">
                <X size={12} />
              </button>
           </div>
           <h3 className="text-xl font-bold tracking-tight">{currentStep.title}</h3>
           <p className="text-sm text-white/50 leading-relaxed">{currentStep.description}</p>
           
           <div className="flex items-center gap-3 pt-4">
              <button 
                onClick={onNext}
                className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-opacity-90 transition-all text-[12px] uppercase tracking-widest shadow-lg"
              >
                {step === steps.length - 1 ? 'Finish' : 'Next Step'}
              </button>
              {step < steps.length - 1 && (
                <button onClick={onSkip} className="text-[10px] uppercase font-bold tracking-widest text-white/20 hover:text-white transition-colors">
                  Skip Tutorial
                </button>
              )}
           </div>
        </div>
      </motion.div>
    </div>
  );
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
  const [editMode, setEditMode] = useState<'refine' | 'inpaint' | 'style'>('refine');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
   const [videoOptions, setVideoOptions] = useState<InteractiveVideoOption[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [generationAction, setGenerationAction] = useState<string>('');
  
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isGeneratingBrandKit, setIsGeneratingBrandKit] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'brand' | 'mockup' | 'assets'>('design');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'transparent' | 'primary'>('transparent');
  const [selectedMockup, setSelectedMockup] = useState<'none' | 'businessCard' | 'phone' | 'sign' | 'stationery'>('phone');
  const [matchingIcons, setMatchingIcons] = useState<{ base64: string; mimeType: string; url: string; label: string }[]>([]);
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  const [editHistory, setEditHistory] = useState<number[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(text);
    setTimeout(() => setCopyStatus(null), 2000);
  };
  const [palettePrompt, setPalettePrompt] = useState<string>('');
  const [paletteImageUrl, setPaletteImageUrl] = useState<string>('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('SOLODESIGN');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkedImageUrl, setWatermarkedImageUrl] = useState<string | null>(null);

  const [showProjects, setShowProjects] = useState(false);
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  const [showTemplates, setShowTemplates] = useState(false);
  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Tech');
  const [templateDescription, setTemplateDescription] = useState('');

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
    if (showTemplates && user) {
      getTemplates().then(setTemplatesList);
    }
  }, [showProjects, showTemplates, user]);

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

  const [isExporting, setIsExporting] = useState(false);
  const [typographyTestText, setTypographyTestText] = useState('Experience the synergy of vision and speed.');
  const [isEditingBrandKit, setIsEditingBrandKit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('solo_design_tutorial_v1');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Welcome to SoloDesign",
      description: "Let's turn your vision into a professional brand identity in seconds.",
      target: "tutorial-step-1",
      position: "right"
    },
    {
      title: "Define Your Vision",
      description: "Describe your company, its values, and any specific symbols you want to see.",
      target: "brand-description",
      position: "right"
    },
    {
      title: "Visual Strategy",
      description: "Choose a visual preset to guide the AI's stylistic direction.",
      target: "style-presets",
      position: "right"
    },
    {
      title: "Synthesize!",
      description: "Click here to generate your high-fidelity logo variants.",
      target: "generate-button",
      position: "right"
    },
    {
      title: "Identity Analysis",
      description: "Once you have a logo, extract a full strategic brand kit with typography and voice.",
      target: "analyze-identity-button",
      position: "right"
    },
    {
      title: "Iconography System",
      description: "Generate a harmonized set of UI icons that perfectly match your new logo.",
      target: "generate-assets-button",
      position: "left"
    }
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('solo_design_tutorial_v1', 'true');
    }
  };

  const skipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('solo_design_tutorial_v1', 'true');
  };

  // Helper for WCAG Accessibility
  const getContrastRatio = (hex1: string, hex2: string) => {
    const getLuminance = (hex: string) => {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const downloadFullBundle = async () => {
    if (!brandKit || selectedImageIndex === null) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      // 1. Logo Assets
      const logoFolder = zip.folder("01_Logos");
      if (logoFolder) {
        imageOptions.forEach((opt, i) => {
          logoFolder.file(`Logo_Variant_0${i+1}.png`, opt.base64, { base64: true });
        });
      }

      // 2. Icon Assets
      if (matchingIcons.length > 0) {
        const iconFolder = zip.folder("02_Icons");
        if (iconFolder) {
          matchingIcons.forEach((icon, i) => {
            iconFolder.file(`UI_Icon_${icon.label.replace(/\s+/g, '_')}.png`, icon.base64, { base64: true });
          });
        }
      }

      // 3. Guidelines
      const guidelinesFolder = zip.folder("03_Guidelines");
      if (guidelinesFolder) {
        const mdContent = `# ${description} - Brand Guidelines

## Manifesto
- **Slogan:** ${brandKit.slogan || 'N/A'}
- **Mission:** ${brandKit.mission || 'N/A'}
- **Tone of Voice:** ${brandKit.voice}

## Visual DNA
### Typography
- Primary: ${brandKit.typography[0]}
- Secondary: ${brandKit.typography[1]}

### Palette
${palette.map((c, i) => `- Color ${i+1}: ${c}`).join('\n')}
${brandKit.secondaryColors.map((c, i) => `- Secondary ${i+1}: ${c}`).join('\n')}

## Usage Rules
### Do
${brandKit.usageRules?.do.map(r => `- ${r}`).join('\n')}

### Don't
${brandKit.usageRules?.dont.map(r => `- ${r}`).join('\n')}
`;
        guidelinesFolder.file("Identity_Guidelines.md", mdContent);
        
        const cssContent = `:root {
  --brand-primary: ${palette[0] || '#4facfe'};
  --brand-font-display: "${brandKit.typography[0]}";
  --brand-font-body: "${brandKit.typography[1]}";
}`;
        guidelinesFolder.file("Brand_Tokens.css", cssContent);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${description.substring(0, 15).replace(/\s+/g, '_')}_Brand_Identity_Bundle.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export bundle:", err);
    } finally {
      setIsExporting(false);
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
      const actionLabels = {
        refine: 'Refining details...',
        inpaint: 'Inpainting new elements...',
        style: 'Reimagining style...'
      };
      setGenerationAction(actionLabels[editMode]);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const sourceImage = imageOptions[selectedImageIndex];
      
      let finalPrompt = editPrompt;
      if (editMode === 'inpaint') {
        finalPrompt = `Modify and inpaint this design: ${editPrompt}. Precisely target the requested changes while maintaining the integrity of the rest of the logo.`;
      } else if (editMode === 'style') {
        finalPrompt = `Keep the structure but apply a new visual style: ${editPrompt}. Re-render the entire design with these new stylistic constraints.`;
      }

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
            { text: `${finalPrompt}${palette.length > 0 ? `. Apply this color palette: ${palette.join(', ')}.` : ''}` }
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
    setMatchingIcons([]);
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
    setMatchingIcons(prj.matchingIcons || []);
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
      matchingIcons,
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
      const prompt = `You are an elite brand strategist. Based on this company description: "${description}", suggest a professional brand kit and digital guidelines. 
      Respond ONLY with a JSON object in this exact format:
      {
        "typography": ["Primary Font Name", "Secondary Font Name"],
        "voice": "A one-sentence description of the brand's tone of voice",
        "secondaryColors": ["#hex1", "#hex2"],
        "slogan": "A short, memorable slogan",
        "mission": "A powerful mission statement",
        "usageRules": {
          "do": ["Include clear white space", "Use correct color profiles", "Maintain aspect ratio"],
          "dont": ["Stretch or distort", "Use on busy backgrounds", "Modify the logo color"]
        }
      }
      Ensure the suggestions are high-end and cohesive with the description.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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

  const generateIcons = async () => {
    if (selectedImageIndex === null || !imageOptions[selectedImageIndex]) return;
    setIsGeneratingIcons(true);
    setGenerationAction('Synthesizing matching iconography...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const sourceImage = imageOptions[selectedImageIndex];
      
      const iconLabels = ['Dashboard', 'Settings', 'Profile', 'Analytics', 'Help'];
      
      const iconPromises = iconLabels.map(async (label) => {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
                { text: `Create a simple, matching UI icon for "${label}". 
                The icon should perfectly match the visual style, line weight, and mood of the provided logo. 
                Keep it minimalist and on a solid background that matches the logo's context. Style: ${stylePreset}. Output a single clear icon.` }
              ],
            },
            config: {
              imageConfig: { aspectRatio: "1:1" }
            }
          });

          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return {
                base64: part.inlineData.data,
                mimeType: 'image/png',
                url: `data:image/png;base64,${part.inlineData.data}`,
                label
              };
            }
          }
        } catch (e) {
          console.error(`Failed to generate icon for ${label}`, e);
        }
        return null;
      });

      const results = await Promise.all(iconPromises);
      const filtered = results.filter((i): i is NonNullable<typeof i> => i !== null);
      
      setMatchingIcons(filtered);
      await saveCurrent({ matchingIcons: filtered });
      setActiveTab('design');
    } catch (err) {
      console.error('Failed to generate icons:', err);
    } finally {
      setIsGeneratingIcons(false);
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

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    
    const newTemplate: Template = {
      id: `template_${Date.now()}`,
      name: templateName,
      category: templateCategory,
      description: templateDescription,
      settings: {
        aspectRatio,
        imageSize,
        stylePreset,
        negativePrompt,
        palette,
        animationPreset
      },
      createdAt: Date.now()
    };
    
    try {
      await saveTemplate(newTemplate);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');
      if (showTemplates) {
        const updated = await getTemplates();
        setTemplatesList(updated);
      }
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const applyTemplate = (template: Template) => {
    setAspectRatio(template.settings.aspectRatio);
    setImageSize(template.settings.imageSize);
    setStylePreset(template.settings.stylePreset);
    setNegativePrompt(template.settings.negativePrompt);
    setPalette(template.settings.palette);
    setAnimationPreset(template.settings.animationPreset);
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTemplate(id);
    setTemplatesList(prev => prev.filter(t => t.id !== id));
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative font-['Helvetica_Neue',Arial,sans-serif]" style={{ backgroundColor: '#0f111a' }}>
        <Loader2 className="animate-spin text-white/50" size={32} />
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

  if (showTemplates) {
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
                  <BookMarked className="text-[#4facfe]" size={24} />
               </div>
               <div>
                 <h1 className="text-2xl font-bold tracking-tight">Design Templates</h1>
                 <p className="text-sm text-white/50">Your custom project starting points</p>
               </div>
            </div>
            <button onClick={() => setShowTemplates(false)} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-semibold hover:bg-white/10 transition flex items-center gap-2">
              <X size={16} /> Close
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 pb-8">
            {templatesList.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                 <LayoutGrid size={48} className="opacity-50" />
                 <p className="text-lg">No templates saved yet.</p>
                 <p className="text-sm">Save a project as a template to see it here.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {templatesList.map(t => (
                   <div key={t.id} onClick={() => applyTemplate(t)} className="group cursor-pointer bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 hover:border-[#4facfe]/50 hover:bg-white/10 transition-all flex flex-col overflow-hidden relative shadow-lg hover:shadow-[0_0_30px_rgba(79,172,254,0.15)]">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="px-2 py-1 bg-[#4facfe]/20 rounded text-[10px] text-[#4facfe] font-bold uppercase tracking-widest mb-2 inline-block">
                             {t.category || 'General'}
                          </div>
                          <h3 className="font-bold text-[18px] text-white line-clamp-1">{t.name}</h3>
                        </div>
                        <button onClick={(e) => handleDeleteTemplate(t.id, e)} className="p-2 text-white/30 hover:text-red-400 hover:bg-black/20 rounded-full transition-colors z-10">
                          <Trash2 size={16} />
                        </button>
                     </div>
                     <p className="text-white/50 text-[13px] line-clamp-2 mb-4 h-10">
                        {t.description || 'No description provided.'}
                     </p>
                     <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex gap-1.5 overflow-hidden">
                           {t.settings.palette.slice(0, 4).map((c, i) => (
                             <div key={i} className="w-4 h-4 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: c }} />
                           ))}
                        </div>
                        <span className="text-[10px] text-white/30 font-mono italic">Style: {t.settings.stylePreset}</span>
                     </div>
                     <div className="absolute inset-0 bg-[#4facfe]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform">
                           Apply Template
                        </div>
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
      
      {showTutorial && (
        <OnboardingTutorial 
          step={tutorialStep} 
          steps={tutorialSteps} 
          onNext={nextTutorialStep} 
          onSkip={skipTutorial} 
        />
      )}

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
                onClick={() => setShowTemplates(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-[#4facfe] transition-colors"
                title="Design Templates"
              >
                <BookMarked size={18} />
              </button>
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
            <section id="tutorial-step-1" className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 block">
                Company Description
              </label>
              <textarea
                id="brand-description"
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
            <section id="tutorial-step-2" className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 block">
                Visual Style & Constraints
              </label>
              
              <div className="space-y-4">
                <div id="style-presets" className="space-y-2">
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

            {/* Main Action Button */}
            <section className="space-y-3">
              <div className="flex gap-2">
                <button
                  id="generate-button"
                  onClick={generateLogo}
                  disabled={isGeneratingImage || isGeneratingVideo || !description.trim()}
                  className="flex-1 py-4 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-black rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 text-[15px] shadow-[0_4px_20px_rgba(79,172,254,0.4)] uppercase tracking-tight"
                >
                  {isGeneratingImage ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  {isGeneratingImage ? 'Synthesizing...' : 'Generate Lab 1.4'}
                </button>
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  disabled={isGeneratingImage || isGeneratingVideo}
                  className="w-14 h-14 shrink-0 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:text-[#4facfe] transition-all flex items-center justify-center text-white/50"
                  title="Save as Template"
                >
                  <Bookmark size={22} />
                </button>
              </div>

              {!isGeneratingImage && !isGeneratingVideo && imageOptions.length > 0 && (
                <button
                  onClick={animateLogo}
                  disabled={isGeneratingVideo}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest group"
                >
                  <Film size={16} className="group-hover:text-[#4facfe] transition-colors" />
                  Motion Synthesis (Veo)
                </button>
              )}
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
                  Design Refinement
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

              <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 mb-3">
                <button
                  onClick={() => setEditMode('refine')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editMode === 'refine' ? 'bg-[#4facfe] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Wand2 size={12} /> Refine
                </button>
                <button
                  onClick={() => setEditMode('inpaint')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editMode === 'inpaint' ? 'bg-[#4facfe] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Brush size={12} /> Inpaint
                </button>
                <button
                  onClick={() => setEditMode('style')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editMode === 'style' ? 'bg-[#4facfe] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Zap size={12} /> Stylize
                </button>
              </div>

              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4facfe] transition-all resize-none h-[60px] text-sm"
                placeholder={
                  editMode === 'refine' ? "e.g., Make the edges sharper, improve contrast..." :
                  editMode === 'inpaint' ? "e.g., Add a golden laurel wreath around the icon..." :
                  "e.g., Re-style as a futuristic 3D glassmorphism icon..."
                }
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
              />
              <button
                onClick={editLogo}
                disabled={!editPrompt.trim() || isEditingImage || imageOptions.length === 0}
                className="w-full mt-3 py-[10px] px-4 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[13px]"
              >
                {isEditingImage ? <Loader2 className="animate-spin" size={16} /> : 
                  editMode === 'refine' ? <Wand2 size={16} /> :
                  editMode === 'inpaint' ? <Brush size={16} /> :
                  <Zap size={16} />
                }
                {isEditingImage ? 'Applying Synthesis...' : `Apply ${editMode.charAt(0).toUpperCase() + editMode.slice(1)}`}
              </button>
            </section>

            {/* Brand Kit Section */}
            <section id="tutorial-step-5" className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5">
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
                  id="analyze-identity-button"
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
              
              <div className="pt-5 mt-5 border-t border-white/5 space-y-4" id="tutorial-step-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">System Assets</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4facfe]/50"></div>
                </div>
                <button 
                  id="generate-assets-button"
                  onClick={generateIcons} 
                  disabled={isGeneratingIcons || selectedImageIndex === null} 
                  className="w-full py-3.5 bg-[#4facfe]/5 border border-[#4facfe]/10 text-[#4facfe] font-bold rounded-xl hover:bg-[#4facfe]/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-20"
                >
                  {isGeneratingIcons ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  <div className="flex flex-col items-start gap-0">
                    <span className="text-[12px] tracking-tight">{isGeneratingIcons ? 'Synthesizing...' : 'Generate Matching Assets'}</span>
                    <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Dynamic Icon Library</span>
                  </div>
                </button>
              </div>
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
          
          {/* Save Template Modal */}
          <AnimatePresence>
            {showSaveTemplateModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-[#1a1d2e] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Save Template</h2>
                    <button onClick={() => setShowSaveTemplateModal(false)} className="text-white/40 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-white/50">Template Name</label>
                      <input 
                        type="text" 
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Fintech Minimalist"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#4facfe] transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold tracking-widest text-white/50">Industry/Category</label>
                        <select 
                          value={templateCategory}
                          onChange={(e) => setTemplateCategory(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#4facfe] transition-all text-sm [&>option]:text-black"
                        >
                          <option value="Tech">Tech</option>
                          <option value="Luxury">Luxury</option>
                          <option value="Creative">Creative</option>
                          <option value="Fintech">Fintech</option>
                          <option value="Brutalist">Brutalist</option>
                          <option value="Organic">Organic</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold tracking-widest text-white/50">Animation</label>
                        <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white/70">
                          {animationPreset}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-white/50">Notes (Optional)</label>
                      <textarea 
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="What makes this template special?"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#4facfe] transition-all resize-none h-20 text-sm"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName.trim()}
                    className="w-full py-4 bg-[#4facfe] text-white font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={20} />
                    Confirm Blueprint
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-full bg-black/20 rounded-[20px] border border-white/5 flex flex-col relative overflow-hidden">
            
            <div className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <h2 className="text-[14px] uppercase tracking-[2px] text-white/50">{videoOptions.length > 0 || videoUrl ? 'Final_Render.mp4' : imageOptions.length > 0 ? `Draft_Option_0${(selectedImageIndex || 0) + 1}.png` : 'Awaiting_Prompt...'}</h2>
                
                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                  <button 
                    id="nav-design"
                    onClick={() => setActiveTab('design')}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'design' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Design
                  </button>
                  <button 
                    id="nav-mockup"
                    onClick={() => setActiveTab('mockup')}
                    disabled={imageOptions.length === 0}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-20 ${activeTab === 'mockup' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Context
                  </button>
                  <button 
                    id="nav-brand"
                    onClick={() => setActiveTab('brand')}
                    disabled={!brandKit}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-20 ${activeTab === 'brand' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Guidelines
                  </button>
                  <button 
                    id="nav-assets"
                    onClick={() => setActiveTab('assets')}
                    disabled={matchingIcons.length === 0}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-20 ${activeTab === 'assets' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Assets
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
                {(isGeneratingImage || isGeneratingVideo || isEditingImage || isGeneratingIcons) ? (
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full h-full overflow-y-auto px-10 py-12 z-10 custom-scrollbar"
                  >
                    <div className="max-w-5xl mx-auto space-y-20">
                       {/* Identity Header */}
                      <header className="space-y-6 relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-1 px-2 py-1 bg-[#4facfe] rounded opacity-50" />
                             <h2 className="text-[12px] uppercase font-bold tracking-[0.4em] text-[#4facfe]">Brand Manifesto</h2>
                          </div>
                          <button 
                            onClick={() => {
                              if (isEditingBrandKit) saveCurrent();
                              setIsEditingBrandKit(!isEditingBrandKit);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[#4facfe]"
                          >
                            {isEditingBrandKit ? (
                              <>
                                <ShieldCheck size={16} />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white">Save Changes</span>
                              </>
                            ) : (
                              <>
                                <Wand2 size={16} />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white">Refine Strategy</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {isEditingBrandKit ? (
                          <div className="space-y-4">
                            <input 
                              type="text" 
                              value={brandKit.slogan || ''} 
                              onChange={(e) => setBrandKit({...brandKit, slogan: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-3xl font-bold focus:border-[#4facfe] outline-none"
                              placeholder="Brand Slogan"
                            />
                            <textarea 
                              value={brandKit.mission || brandKit.voice} 
                              onChange={(e) => setBrandKit({...brandKit, mission: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg text-white/60 focus:border-[#4facfe] outline-none h-32"
                              placeholder="Mission Statement"
                            />
                          </div>
                        ) : (
                          <>
                            <h1 className="text-5xl font-bold tracking-tight">{brandKit.slogan || 'Evolving Identity'}</h1>
                            <p className="text-xl text-white/60 max-w-2xl leading-relaxed italic border-l-4 border-[#4facfe]/30 pl-8">{brandKit.mission || brandKit.voice}</p>
                          </>
                        )}
                      </header>

                      {/* Logo Construction Section */}
                      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 py-12 border-y border-white/5 bg-white/[0.01] -mx-10 px-10">
                        <div className="space-y-8">
                          <div className="flex items-center gap-3">
                            <LayoutGrid className="text-[#4facfe]" size={20} />
                            <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40">Logo Construction</h3>
                          </div>
                          <div className="aspect-video bg-black/40 rounded-[32px] border border-white/5 relative flex items-center justify-center overflow-hidden">
                             {/* Safe Zone Grid */}
                             <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10 pointer-events-none">
                                {[...Array(24)].map((_, i) => <div key={i} className="border border-white/20" />)}
                             </div>
                             {/* Measurement Lines */}
                             <div className="absolute w-[30%] border-t border-dashed border-[#4facfe]/40 top-[50%] -translate-y-1/2 left-[10%] flex justify-between px-2">
                                <span className="text-[8px] text-[#4facfe] -mt-4 uppercase font-bold letter-spacing-widest">x-height</span>
                                <span className="text-[8px] text-[#4facfe] -mt-4 uppercase font-bold letter-spacing-widest">unit</span>
                             </div>
                             <div className="absolute h-[30%] border-l border-dashed border-[#4facfe]/40 left-[50%] -translate-x-1/2 top-[15%] flex flex-col justify-between py-2">
                                <span className="text-[8px] text-[#4facfe] -ml-4 rotate-90 origin-left uppercase font-bold">padding</span>
                             </div>
                             
                             <div className="relative p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                <img 
                                  src={imageOptions[selectedImageIndex || 0]?.url} 
                                  className="w-32 h-32 object-contain filter drop-shadow-[0_0_20px_rgba(79,172,254,0.3)]" 
                                  alt="Logo Construction" 
                                />
                                <div className="absolute -inset-4 border border-[#4facfe]/30 rounded-xl pointer-events-none" />
                                <div className="absolute -inset-8 border border-[#4facfe]/10 rounded-2xl pointer-events-none" />
                             </div>
                             
                             <div className="absolute bottom-6 left-8 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#4facfe]" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#4facfe]">Safe Exclusion Zone: 32px</span>
                             </div>
                          </div>
                        </div>
                        <div className="space-y-8">
                           <div className="flex items-center gap-3">
                              <Target className="text-[#4facfe]" size={20} />
                              <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40">Optical Balancing</h3>
                           </div>
                           <div className="space-y-6">
                              <p className="text-sm text-white/50 leading-relaxed italic">"Architecture that respects the void. The SoloDesign identity system is built on a modular grid of 8, ensuring mathematical harmony across all touchpoints."</p>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                    <div className="text-[10px] uppercase font-bold tracking-widest text-white/30">Vertical Axis</div>
                                    <div className="text-[14px]">Centric Align</div>
                                 </div>
                                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                    <div className="text-[10px] uppercase font-bold tracking-widest text-white/30">Ratio</div>
                                    <div className="text-[14px]">0.618 Golden</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </section>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Typography Section */}
                        <section className="space-y-8">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Type className="text-[#4facfe]" size={20} />
                                <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40">System Typography</h3>
                             </div>
                           </div>
                           
                           <div className="space-y-10">
                              {brandKit.typography.map((font, i) => (
                                <div key={i} className={`flex flex-col space-y-4 ${i === 0 ? 'border-b border-white/5 pb-8' : ''}`}>
                                   <div className="flex items-center justify-between">
                                      <span className={`text-[10px] uppercase font-mono tracking-widest text-[#4facfe]/60`}>{i === 0 ? 'Primary Display' : 'Secondary Body'}</span>
                                      <span className="text-[10px] text-white/20 font-mono italic">{font}</span>
                                   </div>
                                   <div className="relative group/type">
                                      <span className="text-6xl font-light tracking-tighter leading-none block overflow-hidden truncate px-1" style={{ fontFamily: font }}>
                                        {typographyTestText || font}
                                      </span>
                                   </div>
                                </div>
                              ))}
                           </div>

                           <div className="pt-6">
                              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                 <h4 className="text-[9px] uppercase font-bold tracking-widest text-white/30">Type Playground</h4>
                                 <input 
                                   type="text" 
                                   value={typographyTestText}
                                   onChange={(e) => setTypographyTestText(e.target.value)}
                                   placeholder="Test your brand typography..."
                                   className="w-full bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-[#4facfe] transition-colors"
                                 />
                              </div>
                           </div>
                        </section>

                        {/* Color Section */}
                        <section className="space-y-8">
                           <div className="flex items-center gap-3">
                              <Palette className="text-[#4facfe]" size={20} />
                              <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40">Chromatic DNA</h3>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              {[...palette, ...(brandKit.secondaryColors || [])].slice(0, 4).map((c, i) => (
                                <div key={i} className="group relative">
                                   <div className="h-48 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-end p-4 transition-transform hover:scale-[1.02]" style={{ backgroundColor: c }}>
                                      <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <span className="text-[10px] font-mono font-bold uppercase">{c}</span>
                                          <button 
                                            onClick={() => copyToClipboard(c)} 
                                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors relative"
                                          >
                                            {copyStatus === c ? <ShieldCheck size={12} className="text-[#00ff7f]" /> : <FileCode size={12} />}
                                            {copyStatus === c && (
                                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#00ff7f] text-black text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                                                Copied!
                                              </span>
                                            )}
                                          </button>
                                      </div>
                                   </div>
                                   <div className="mt-3 flex flex-col">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{i === 0 ? 'Primary' : `Accent 0${i}`}</span>
                                        {i > 0 && (
                                          <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${getContrastRatio(c, palette[0] || '#ffffff') >= 4.5 ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-red-400/20 text-red-400'}`}>
                                            {getContrastRatio(c, palette[0] || '#ffffff').toFixed(1)}:1 {getContrastRatio(c, palette[0] || '#ffffff') >= 4.5 ? 'Pass' : 'Fail'}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[11px] font-mono opacity-30">{c}</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </section>
                      </div>

                      {/* Usage Rules & Code */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-12 border-t border-white/5">
                        <section className="space-y-8">
                            <div className="flex items-center gap-3">
                               <ShieldCheck className="text-[#4facfe]" size={20} />
                               <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40">System Logic & Voice</h3>
                            </div>
                            <div className="space-y-8">
                               <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl space-y-4">
                                  <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-[#4facfe]">
                                     <Volume2 size={14} /> Brand Resonance
                                  </div>
                                  <p className="text-sm text-white/70 leading-relaxed italic">"{brandKit.voice}"</p>
                                  <div className="pt-2 flex flex-wrap gap-2">
                                     {brandKit.voice.split(',').map((v: string, i: number) => (
                                       <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] uppercase font-bold tracking-tighter text-white/40">
                                         {v.trim()}
                                       </span>
                                     ))}
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                     <h4 className="text-[10px] uppercase font-bold text-[#00ff7f] tracking-widest">Always Do</h4>
                                     <ul className="text-[13px] text-white/50 space-y-2 list-disc pl-4 leading-relaxed">
                                        {brandKit.usageRules?.do.map((r, i) => <li key={i}>{r}</li>) || <li>Maintain clear space</li>}
                                     </ul>
                                  </div>
                                  <div className="space-y-4">
                                     <h4 className="text-[10px] uppercase font-bold text-red-400 tracking-widest">Never Do</h4>
                                     <ul className="text-[13px] text-white/50 space-y-2 list-disc pl-4 leading-relaxed">
                                        {brandKit.usageRules?.dont.map((r, i) => <li key={i}>{r}</li>) || <li>Distort aspect ratio</li>}
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </section>

                        <section className="space-y-8">
                           <div className="flex items-center gap-3">
                              <FileCode className="text-[#4facfe]" size={20} />
                              <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40">Developer Integration</h3>
                           </div>
                           <div className="space-y-4">
                              <div className="bg-black/60 border border-white/10 rounded-2xl p-6 font-mono relative group">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"><FileCode size={16} /></button>
                                </div>
                                <pre className="text-[11px] text-[#4facfe]/80 leading-relaxed">
{`:root {
  --brand-primary: ${palette[0] || '#4facfe'};
  --brand-accent: ${palette[1] || '#ffffff'};
  --brand-font-display: "${brandKit.typography[0]}";
  --brand-font-body: "${brandKit.typography[1]}";
  --brand-radius: 16px;
  --brand-shadow: 0 10px 40px rgba(0,0,0,0.4);
}`}
                                </pre>
                              </div>
                              <button 
                                onClick={downloadFullBundle}
                                disabled={isExporting}
                                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                              >
                                {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                {isExporting ? 'Packaging Bundle...' : 'Download Full Brand Identity (.zip)'}
                              </button>
                           </div>
                        </section>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'assets' ? (
                  <motion.div
                    key="assets-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full flex flex-col p-12 z-10 overflow-y-auto custom-scrollbar"
                  >
                    <div className="max-w-6xl mx-auto w-full space-y-12">
                      <header className="flex justify-between items-end">
                        <div className="space-y-2">
                           <h2 className="text-[11px] uppercase font-bold tracking-[0.3em] text-[#4facfe]">Generated Asset Library</h2>
                           <h1 className="text-4xl font-bold tracking-tight">Smart UI Iconography</h1>
                        </div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/50 uppercase font-bold tracking-widest">
                           {matchingIcons.length} System Icons Generated
                        </div>
                      </header>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                        {/* Favicon Preview */}
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-[32px] p-6 text-center hover:bg-white/5 transition-all cursor-pointer shadow-lg"
                        >
                           <div className="aspect-square w-full rounded-2xl bg-black/40 border border-white/5 p-8 mb-6 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-2xl bg-white p-2">
                                 <img src={imageOptions[selectedImageIndex || 0]?.url} className="w-full h-full object-contain" alt="Favicon" />
                              </div>
                           </div>
                           <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">UI.Symbol.00</span>
                           <h4 className="font-bold text-[15px]">App Favicon</h4>
                        </motion.div>
                        {matchingIcons.map((icon, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-[32px] p-6 text-center hover:bg-white/5 hover:border-[#4facfe]/30 transition-all cursor-pointer shadow-lg"
                          >
                             <div className="aspect-square w-full rounded-2xl bg-black/40 border border-white/5 p-8 mb-6 group-hover:scale-105 transition-transform flex items-center justify-center">
                                <img src={icon.url} className="w-full h-full object-contain filter drop-shadow-lg" alt={icon.label} />
                             </div>
                             <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">UI.Symbol.0{i+1}</span>
                             <h4 className="font-bold text-[15px]">{icon.label}</h4>
                             
                             <div className="mt-4 pt-4 border-t border-white/5 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-white/30 hover:text-white transition-colors" title="Download PNG"><Download size={14} /></button>
                                <button className="p-2 text-white/30 hover:text-white transition-colors" title="Copy SVG Vector"><FileCode size={14} /></button>
                             </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-gradient-to-r from-[#4facfe]/10 to-transparent p-8 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center gap-8 justify-between">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#4facfe]/20 flex items-center justify-center">
                               <Tags className="text-[#4facfe]" size={32} />
                            </div>
                            <div className="space-y-1">
                               <h3 className="font-bold text-[18px]">Unified Visual Language</h3>
                               <p className="text-sm text-white/50 max-w-sm">Every icon is synthesised using your primary logo as a visual seed, ensuring perfect stylistic harmony.</p>
                            </div>
                         </div>
                         <button 
                            onClick={async () => {
                               const zip = new JSZip();
                               const iconFolder = zip.folder("System_Icons");
                               if (iconFolder) {
                                  matchingIcons.forEach(icon => {
                                     iconFolder.file(`${icon.label.replace(/\s+/g, '_')}.png`, icon.base64, { base64: true });
                                  });
                                  const content = await zip.generateAsync({ type: "blob" });
                                  const url = URL.createObjectURL(content);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = "UI_Icon_Set_Export.zip";
                                  link.click();
                               }
                            }}
                            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-opacity-90 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                         >
                            Export Symbol Library (.zip)
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'mockup' ? (
                   <motion.div
                    key="mockup-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full flex flex-col p-8 z-10 overflow-hidden"
                   >
                     <div className="flex-1 flex items-center justify-center relative">
                        <AnimatePresence mode="wait">
                           {selectedMockup === 'phone' && (
                              <motion.div 
                                key="phone-scene"
                                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative w-[280px] h-[580px] bg-[#1a1a1a] rounded-[48px] border-[8px] border-[#333] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
                              >
                                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-2xl z-20" />
                                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10" />
                                 <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8">
                                    <motion.div 
                                      animate={{ y: [0, -10, 0] }}
                                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                      className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl"
                                    >
                                       <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-24 h-24 object-contain" />
                                    </motion.div>
                                    <div className="space-y-2">
                                       <div className="h-2 w-32 bg-white/20 rounded-full mx-auto" />
                                       <div className="h-2 w-24 bg-white/10 rounded-full mx-auto" />
                                    </div>
                                 </div>
                                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full" />
                              </motion.div>
                           )}

                           {selectedMockup === 'businessCard' && (
                              <motion.div 
                                key="card-scene"
                                initial={{ opacity: 0, rotateY: -30 }}
                                animate={{ opacity: 1, rotateY: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                className="relative w-[500px] h-[280px] bg-white rounded-xl shadow-[20px_40px_80px_rgba(0,0,0,0.3)] overflow-hidden flex"
                              >
                                 <div className="flex-1 p-12 flex flex-col justify-between">
                                    <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-16 h-16 object-contain grayscale opacity-80" />
                                    <div className="space-y-1">
                                       <div className="text-black font-bold text-lg leading-tight">{brandKit.slogan || 'Executive Identity'}</div>
                                       <div className="text-black/40 text-[10px] uppercase font-bold tracking-widest">Digital Design Studio</div>
                                    </div>
                                 </div>
                                 <div className="w-1/3 bg-black flex items-center justify-center p-8">
                                    <div className="w-full aspect-square border border-white/20 rounded-lg flex items-center justify-center opacity-20">
                                       <Share2 className="text-white" size={32} />
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {selectedMockup === 'sign' && (
                              <motion.div 
                                key="sign-scene"
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative w-full h-[400px] max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
                              >
                                 <img src="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1500" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div 
                                      className="relative group cursor-pointer"
                                      whileHover={{ scale: 1.05 }}
                                    >
                                       <div className="absolute -inset-10 bg-[#4facfe]/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                       <div className="relative p-12 bg-black/40 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl">
                                          <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-48 h-48 object-contain" />
                                       </div>
                                    </motion.div>
                                 </div>
                                 <div className="absolute bottom-6 left-8 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-[#00ff7f] animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ff7f]">Studio Live View</span>
                                 </div>
                              </motion.div>
                           )}

                           {selectedMockup === 'stationery' && (
                              <motion.div 
                                key="stationery-scene"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full h-[450px] max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center space-y-8 p-12 border-[16px] border-[#111]"
                              >
                                 <div className="grid grid-cols-2 gap-8 w-full h-full">
                                    <div className="bg-[#f0f0f0] rounded-3xl p-8 flex flex-col items-center justify-center shadow-inner">
                                       <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center mb-4">
                                          <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-16 h-16 object-contain" />
                                       </div>
                                       <div className="h-2 w-24 bg-black/5 rounded-full" />
                                    </div>
                                    <div className="flex flex-col gap-6">
                                       <div className="flex-1 bg-black rounded-3xl p-8 flex flex-col justify-end space-y-4">
                                          <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-12 h-12 object-contain invert opacity-80" />
                                          <div className="h-1 w-full bg-white/20 rounded-full" />
                                          <div className="h-1 w-2/3 bg-white/10 rounded-full" />
                                       </div>
                                       <div className="h-1/3 bg-[#4facfe] rounded-3xl p-8 flex items-center justify-center">
                                          <Sparkles className="text-white opacity-40" size={32} />
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>

                     <div className="mt-12 flex flex-col items-center gap-6">
                        <div className="flex bg-white/5 backdrop-blur-xl p-2 rounded-[24px] border border-white/10 shadow-2xl">
                           <button 
                             onClick={() => setSelectedMockup('phone')}
                             className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 ${selectedMockup === 'phone' ? 'bg-[#4facfe] text-white shadow-[0_10px_30px_rgba(79,172,254,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                           >
                              <Smartphone size={24} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Mobile</span>
                           </button>
                           <button 
                             onClick={() => setSelectedMockup('businessCard')}
                             className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 ${selectedMockup === 'businessCard' ? 'bg-[#4facfe] text-white shadow-[0_10px_30px_rgba(79,172,254,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                           >
                              <CreditCard size={24} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Card</span>
                           </button>
                           <button 
                             onClick={() => setSelectedMockup('sign')}
                             className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 ${selectedMockup === 'sign' ? 'bg-[#4facfe] text-white shadow-[0_10px_30px_rgba(79,172,254,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                           >
                              <Monitor size={24} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Signage</span>
                           </button>
                           <button 
                             onClick={() => setSelectedMockup('stationery')}
                             className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 ${selectedMockup === 'stationery' ? 'bg-[#4facfe] text-white shadow-[0_10px_30px_rgba(79,172,254,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                           >
                              <FileCode size={24} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Print</span>
                           </button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase font-bold tracking-[0.2em]">
                           Projected Visualization Environment 01.A
                        </div>
                     </div>
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

function CursorFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('.group')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-[#4facfe] pointer-events-none z-[9999] hidden md:block mix-blend-difference"
      animate={{
        x: position.x - 16,
        y: position.y - 16,
        scale: isHovering ? 2 : 1,
        borderWidth: isHovering ? '1px' : '2px'
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 250, mass: 0.5 }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[#4facfe] rounded-full" />
    </motion.div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-[#4facfe] selection:text-white overflow-x-hidden overflow-y-auto relative no-scrollbar">
      {/* Texture Overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#4facfe] rounded-full opacity-[0.1] blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#8A2BE2] rounded-full opacity-[0.1] blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[30%] right-[20%] w-[20vw] h-[20vw] bg-[#00f2fe] rounded-full opacity-[0.05] blur-[100px]"></div>
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 md:p-24 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="max-w-6xl w-full"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-10"
          >
            <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f2fe] animate-ping"></div>
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase opacity-70">Design Intelligence 3.1</span>
            </div>
          </motion.div>
          
          <h1 className="text-[clamp(3.5rem,12vw,10rem)] font-black leading-[0.8] tracking-[-0.07em] mb-12 uppercase italic text-white mix-blend-difference">
            Studio<br />
            <motion.span 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1.5 }}
              className="text-transparent bg-clip-text bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"
            >
              Mastery
            </motion.span>
          </h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-[18px] md:text-[26px] text-white/50 max-w-3xl mx-auto mb-16 font-light leading-relaxed tracking-tight"
          >
            Where advanced image synthesis meets cinematic motion architecture. SoloDesign is the definitive workspace for high-stakes visual identity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-8"
          >
            <button 
              onClick={onStart}
              className="px-14 py-7 bg-[#4facfe] text-white font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(79,172,254,0.4)] flex items-center gap-4 text-2xl group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative z-10">Start Project</span> 
              <ChevronRight size={28} className="relative z-10 group-hover:translate-x-2 transition-transform duration-500" />
            </button>
            
            <div className="flex flex-col items-start text-left gap-1 border-l border-white/10 pl-8">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#00ff7f]"></div>
                 <span className="text-[11px] uppercase font-black tracking-[0.2em] text-white/60">System Online</span>
               </div>
               <span className="text-[14px] font-medium text-white/30">VEO 3.1 Fast-GPU Active</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 flex flex-col items-center gap-4 opacity-20"
        >
          <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent"></div>
        </motion.div>
      </section>

      {/* Grid Features */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 p-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] flex flex-col justify-between group hover:border-[#4facfe]/50 transition-colors h-[400px]">
             <div className="w-14 h-14 rounded-[20px] bg-white/5 flex items-center justify-center text-[#4facfe]">
               <ImageIcon size={28} />
             </div>
             <div>
               <h3 className="text-3xl font-black mb-4 uppercase italic">Advanced Synthesis</h3>
               <p className="text-white/40 text-[16px] leading-relaxed">Multi-variant logo workflows with photorealistic 4K delivery. Designed for elite corporate assets.</p>
             </div>
          </div>
          
          {[
            { icon: <Film />, title: "Motion Path", desc: "Cinematic 720p 60fps renders." },
            { icon: <ShieldCheck />, title: "Vault Sync", desc: "Encrypted project history." },
            { icon: <Archive />, title: "Brand Kit", desc: "Strategic delivery assets." },
            { icon: <Monitor />, title: "Mockup View", desc: "Real-world site visualizer." }
          ].map((f, i) => (
            <div key={i} className="p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[40px] flex flex-col justify-between hover:bg-white/[0.05] transition-all">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 mb-8">
                 {f.icon}
               </div>
               <div>
                  <h4 className="text-xl font-bold uppercase mb-2 italic tracking-tight">{f.title}</h4>
                  <p className="text-white/30 text-[13px]">{f.desc}</p>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* High-Fidelity Gallery */}
      <section className="relative z-10 py-32 overflow-hidden bg-white/[0.01]">
        <div className="px-6 mb-16 max-w-7xl mx-auto flex justify-between items-end">
           <div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter mix-blend-difference">Aura of Excellence</h2>
              <p className="text-white/30 mt-2 font-medium">Recently deployed conceptual identities</p>
           </div>
           <div className="text-[10px] uppercase font-black tracking-[0.4em] text-white/20">Scroll to Explore</div>
        </div>

        <div className="flex whitespace-nowrap gap-10 animate-marquee group py-10">
          {[1,2,3,4,5,6,1,2,3,4,5,6].map((i, idx) => (
            <motion.div 
              key={idx} 
              whileHover={{ rotateY: -15, rotateX: 5, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-[320px] h-[480px] md:w-[450px] md:h-[600px] shrink-0 bg-[#111] rounded-[48px] overflow-hidden border border-white/5 relative group/card"
            >
               <img 
                 src={`https://picsum.photos/seed/solovault-${i}${idx}/900/1200`} 
                 className="w-full h-full object-cover grayscale brightness-75 group-hover/card:grayscale-0 group-hover/card:brightness-100 transition-all duration-1000" 
                 alt="Branding Case"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover/card:opacity-90 transition-opacity p-12 flex flex-col justify-end">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-[1px] bg-[#4facfe]"></div>
                     <span className="text-[#4facfe] text-[11px] uppercase font-black tracking-widest leading-none">Studio Case {idx + 1}</span>
                  </div>
                  <span className="text-3xl font-black uppercase italic leading-none tracking-tighter">Digital<br/>Vanguard</span>
               </div>
            </motion.div>
          ))}
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 50s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
          .vertical-rl {
            writing-mode: vertical-rl;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-64 px-6 text-center border-t border-white/5 bg-gradient-to-b from-transparent to-[#4facfe]/5">
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="max-w-4xl mx-auto"
        >
          <h2 className="text-[clamp(3rem,10vw,8rem)] font-black uppercase italic tracking-tighter mb-16 leading-[0.8]">
            Built For<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4facfe] to-white/20">The Visionary</span>
          </h2>
          <button 
            onClick={onStart}
            className="px-20 py-10 bg-white text-black font-black rounded-full hover:scale-105 active:scale-95 transition-all text-3xl uppercase italic tracking-widest shadow-[0_40px_120px_rgba(255,255,255,0.15)] group relative overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-2 bg-[#4facfe] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            Access The Lab
          </button>
        </motion.div>
      </section>

      <footer className="relative z-10 p-16 flex flex-col md:flex-row items-start justify-between gap-16 border-t border-white/5 bg-[#080808]">
        <div className="space-y-8 max-w-sm">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-lg bg-[#4facfe] rotate-45 shadow-[0_0_20px_rgba(79,172,254,0.5)]"></div>
            <span className="text-[18px] font-black tracking-[0.4em] uppercase italic">SoloDesign</span>
          </div>
          <p className="text-white/20 text-sm font-medium leading-relaxed">
            Leading the paradigm shift in automated high-end visual design. Built with cutting-edge synthesis architecture.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-24">
           <div className="space-y-6">
              <h5 className="text-[11px] uppercase font-black tracking-widest text-[#4facfe]">Resources</h5>
              <div className="flex flex-col gap-3 text-sm text-white/30 font-bold uppercase tracking-tight italic">
                 <a href="#" className="hover:text-white transition-colors">Documentation</a>
                 <a href="#" className="hover:text-white transition-colors">API Specs</a>
                 <a href="#" className="hover:text-white transition-colors">Studio News</a>
              </div>
           </div>
           <div className="space-y-6">
              <h5 className="text-[11px] uppercase font-black tracking-widest text-[#4facfe]">Enterprise</h5>
              <div className="flex flex-col gap-3 text-sm text-white/30 font-bold uppercase tracking-tight italic">
                 <a href="#" className="hover:text-white transition-colors">License Kit</a>
                 <a href="#" className="hover:text-white transition-colors">Lab Support</a>
                 <a href="#" className="hover:text-white transition-colors">Security</a>
              </div>
           </div>
        </div>
      </footer>
      
      <div className="relative z-10 p-6 text-center text-[10px] uppercase font-black tracking-[0.8em] text-white/10 bg-[#080808] border-t border-white/[0.03]">
        Architected by code and intelligence &copy; 2024.
      </div>
    </div>
  );
}

