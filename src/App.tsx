import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { Image as ImageIcon, Loader2, Film, Sparkles, Download, Settings2, KeyRound, Wand2, FolderHeart, LayoutGrid, Plus, X, Trash2, Undo2, Redo2, Palette, Type, Volume2, Monitor, Smartphone, CreditCard, ChevronRight, Share2, Archive, ShieldCheck, Bookmark, BookMarked, Tags, FileCode, Brush, Zap, Target, LogOut } from 'lucide-react';
import { loginWithGoogle, logoutUser, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveProject, getProjects, deleteProject, Project, BrandKit, Template, saveTemplate, getTemplates, deleteTemplate } from './lib/db';
import { BrandKitWorkspace } from './components/BrandKitWorkspace';
import { PhysicalMockupStudio } from './components/PhysicalMockupStudio';

export function getLuminance(hex: string): number {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) return 1;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const transform = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

const STYLE_PRESETS = [
  'Logo', 'Minimalist', 'Corporate', 'Futuristic', 'Vintage', '3D', 'Vector', 'Flat', 'Photorealistic', 'Artistic'
];

const ANIMATION_PRESETS = [
  'Subtle Zoom', 'Floating', 'Pulse', 'Spin', 'Glitch', 'Shake', 'None'
];

const getAnimationProps = (preset: string) => {
  switch (preset) {
    case 'Floating':
      return {
        animate: { y: [0, -15, 0] },
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      };
    case 'Pulse':
      return {
        animate: { scale: [1, 1.05, 1] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    case 'Spin':
      return {
        animate: { rotate: 360 },
        transition: { duration: 20, repeat: Infinity, ease: "linear" }
      };
    case 'Subtle Zoom':
      return {
        animate: { scale: [1, 1.03, 1] },
        transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
      };
    case 'Glitch':
      return {
        animate: {
          x: [0, 4, -4, 0, 2, -2, 0],
          y: [0, -2, 2, 0, 1, -1, 0],
          opacity: [1, 0.8, 1, 0.7, 1],
          filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(-90deg)', 'hue-rotate(0deg)']
        },
        transition: { duration: 0.2, repeat: Infinity, repeatDelay: 3 }
      };
    case 'Shake':
      return {
        animate: { x: [-2, 2, -2, 2, 0], rotate: [-1, 1, -1, 1, 0] },
        transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
      };
    default:
      return {};
  }
};

function ProceduralVFX({ preset, color = '#4facfe' }: { preset: string; color?: string }) {
  if (preset === 'None') return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {preset === 'Pulse' && (
        <>
          <motion.div 
            animate={{ scale: [0.8, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-64 h-64 rounded-full border-2"
            style={{ borderColor: `${color}44` }}
          />
          <motion.div 
            animate={{ scale: [0.8, 1.8], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute w-64 h-64 rounded-full border"
            style={{ borderColor: `${color}22` }}
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-80 h-80 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${color}44 0%, transparent 70%)` }}
          />
        </>
      )}
      
      {preset === 'Floating' && (
        <div className="absolute inset-0">
           {[...Array(12)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ 
                 opacity: 0, 
                 x: (Math.random() - 0.5) * 400, 
                 y: (Math.random() - 0.5) * 400 
               }}
               animate={{ 
                 y: [null, (Math.random() - 0.5) * 200],
                 x: [null, (Math.random() - 0.5) * 200],
                 opacity: [0, 0.4, 0],
                 scale: [0, 1, 0]
               }}
               transition={{ 
                 duration: 4 + Math.random() * 6, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: Math.random() * 5
               }}
               className="absolute w-1.5 h-1.5 rounded-full"
               style={{ 
                 left: '50%', 
                 top: '50%',
                 backgroundColor: color,
                 boxShadow: `0 0 10px ${color}`
               }}
             />
           ))}
        </div>
      )}

      {preset === 'Spin' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute w-72 h-72 border border-dashed rounded-full"
            style={{ borderColor: `${color}33` }}
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute w-96 h-96 border border-dashed rounded-full opacity-50"
            style={{ borderColor: `${color}22` }}
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-72 h-72"
          >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }} />
          </motion.div>
        </div>
      )}

      {preset === 'Glitch' && (
        <div className="absolute inset-0 overflow-hidden">
           {[...Array(3)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ 
                 opacity: [0, 0.3, 0],
                 x: [-200, 200],
                 y: (Math.random() - 0.5) * 300,
                 height: [`${Math.random() * 3}px`, `${Math.random() * 10}px`]
               }}
               transition={{ 
                 duration: 0.1 + Math.random() * 0.1, 
                 repeat: Infinity, 
                 repeatDelay: 0.5 + Math.random() * 2 
               }}
               className="absolute w-full blur-[1px]"
               style={{ backgroundColor: i === 0 ? color : i === 1 ? '#ff00ff' : '#00ffff' }}
             />
           ))}
        </div>
      )}
      
      {preset === 'Subtle Zoom' && (
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-full h-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${color}66 0%, transparent 60%)` }}
        />
      )}
      
      {preset === 'Shake' && (
        <div className="absolute inset-0 flex items-center justify-center">
           <motion.div 
             animate={{ 
               scale: [1, 1.05, 0.95, 1],
               opacity: [0, 0.1, 0]
             }}
             transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
             className="absolute w-64 h-64 bg-white rounded-[40px] blur-2xl"
           />
        </div>
      )}
    </div>
  );
}

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
  
  const [userTier, setUserTier] = useState<'Trial' | 'Pro' | 'Agency'>('Trial');
  const [userCredits, setUserCredits] = useState<number>(3);
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

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
  const [selectedMockup, setSelectedMockup] = useState<'none' | 'businessCard' | 'phone' | 'sign' | 'stationery' | 'physicalStudio'>('physicalStudio');
  const [matchingIcons, setMatchingIcons] = useState<{ base64: string; mimeType: string; url: string; label: string }[]>([]);
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  const [editHistory, setEditHistory] = useState<number[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  
  const [palette, setPalette] = useState<string[]>([]);
  const [paletteHistory, setPaletteHistory] = useState<string[][]>([]);
  const [palettePointer, setPalettePointer] = useState<number>(-1);
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

  const handleUpgrade = async (tier: 'Pro' | 'Agency') => {
    try {
      setIsUpgrading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user?.uid,
          email: user?.email,
          successUrl: window.location.origin + window.location.pathname,
          cancelUrl: window.location.origin + window.location.pathname
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Server did not provide checkout URL.');
      }
    } catch (e: any) {
      console.error("Upstream Stripe/Sandbox checkout failed:", e);
      alert(e.message || "Failed to initialize subscription checkout.");
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();

    // Check sandbox checkout redirect parameters
    const checkUpgrade = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sandboxTier = urlParams.get('sandbox_tier');
      const sandboxUser = urlParams.get('sandbox_user');
      
      if (sandboxTier && sandboxUser) {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          await setDoc(doc(db, 'user_subscriptions', sandboxUser), {
            userId: sandboxUser,
            tier: sandboxTier,
            credits: sandboxTier === 'Pro' ? 9999 : 99999,
            updatedAt: Date.now()
          }, { merge: true });
          
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
          alert(`Awesome! Successfully upgraded to SoloDesign ${sandboxTier}! Ready to conquer.`);
          window.location.reload();
        } catch (e) {
          console.error("Error matching sandbox tier transition:", e);
        }
      }
    };
    checkUpgrade();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        try {
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const docRef = doc(db, 'user_subscriptions', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserTier(data.tier || 'Trial');
            setUserCredits(data.credits !== undefined ? data.credits : 3);
          } else {
            // New user registration flow
            await setDoc(docRef, {
              userId: u.uid,
              email: u.email,
              tier: 'Trial',
              credits: 3,
              createdAt: Date.now()
            });
            setUserTier('Trial');
            setUserCredits(3);
          }
        } catch (e) {
          console.error("Error loading subscriber account:", e);
        }
      }
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

  // Curated premium Google Font configurations for live pairing select
  const CURATED_FONTS = [
    { name: 'Space Grotesk', importName: 'Space+Grotesk:wght@300;400;500;600;700', type: 'sans-serif' },
    { name: 'Inter', importName: 'Inter:wght@300;400;500;600;700', type: 'sans-serif' },
    { name: 'Playfair Display', importName: 'Playfair+Display:ital,wght@0,400;0,700;1,400', type: 'serif' },
    { name: 'JetBrains Mono', importName: 'JetBrains+Mono:wght@300;400;500;700', type: 'monospace' },
    { name: 'Syne', importName: 'Syne:wght@400;700;800', type: 'sans-serif' },
    { name: 'Cabinet Grotesk', importName: 'Cabinet+Grotesk:wght@300;400;500;700;800', type: 'sans-serif' },
    { name: 'Cinzel', importName: 'Cinzel:wght@400;600;700;900', type: 'serif' },
    { name: 'Clash Display', importName: 'Clash+Display:wght@400;500;600;700', type: 'sans-serif' },
    { name: 'Cormorant Garamond', importName: 'Cormorant+Garamond:ital,wght@0,400;0,700;1,400', type: 'serif' },
  ];

  // Advanced Interactive Brand & Design States
  const [logoPadding, setLogoPadding] = useState<number>(36);
  const [constructionGrid, setConstructionGrid] = useState<'none' | 'blueprint' | 'golden' | 'optical'>('none');
  const [grayscaleLogo, setGrayscaleLogo] = useState<boolean>(false);
  const [rotatedLogo, setRotatedLogo] = useState<number>(0);
  const [activeBrandMode, setActiveBrandMode] = useState<'guidelines' | 'presentation'>('guidelines');
  const [presentationSlideIndex, setPresentationSlideIndex] = useState<number>(0);
  const [contrastLevel, setContrastLevel] = useState<'AA' | 'AAA'>('AA');
  const [codeTargetType, setCodeTargetType] = useState<'tailwind' | 'css' | 'swift' | 'kotlin' | 'json'>('tailwind');
  const [typographySize, setTypographySize] = useState<number>(60);
  const [typographyWeight, setTypographyWeight] = useState<'300' | '400' | '500' | '700' | '800'>('400');

  // Load selected fonts dynamically by injecting head style sheets
  useEffect(() => {
    if (brandKit) {
      const fontsToLoad = [...(brandKit.typography || [])];
      fontsToLoad.forEach(font => {
        const match = CURATED_FONTS.find(f => f.name === font);
        if (match) {
          const id = `font-link-${font.replace(/\s+/g, '-')}`;
          if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${match.importName}&display=swap`;
            document.head.appendChild(link);
          }
        }
      });
    }
  }, [brandKit]);

  // Default Brand Kit layout fallback if initiated manually
  const defaultBrandKit: BrandKit = {
    typography: ['Space Grotesk', 'Inter'],
    voice: 'Professional, elegant, precise, and visionary.',
    secondaryColors: ['#334155', '#475569'],
    slogan: 'Architecting digital resonance.',
    mission: 'To create beautiful, functional assets that connect human intent with aesthetic harmony.',
    usageRules: {
      do: ['Include clear white space', 'Use correct color profiles', 'Maintain aspect ratio'],
      dont: ['Stretch or distort', 'Use on busy backgrounds', 'Modify the logo color']
    },
    manifesto: 'We believe that great design is not decorative—it is core identity. Every asset is a silent ambassador for your goals and aspirations in the digital wilderness.',
    vision: 'To build a lasting visual universe that remains timelessly relevant and responsive to cultural and technological progress.',
    targetAudience: 'Professional solo practitioners, design-conscious leaders, and visionaries looking for high-end aesthetic execution.'
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

  // Automated mathematical WCAG content contrast healer
  const autoHealContrast = (hex: string, targetBgHex: string, targetLevel: 'AA' | 'AAA' = 'AA') => {
    const targetRatio = targetLevel === 'AAA' ? 7.0 : 4.5;
    const ratio = getContrastRatio(hex, targetBgHex);
    if (ratio >= targetRatio) return hex;

    const hexToRgb = (h: string) => {
      let clean = h.replace('#', '');
      if (clean.length === 3) {
        clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
      }
      return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
      };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
      return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    };

    const getLuminanceForRgb = (rgb: { r: number, g: number, b: number }) => {
      const a = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const color = hexToRgb(hex);
    const bg = hexToRgb(targetBgHex);
    const isBgDark = getLuminanceForRgb(bg) < 0.5;
    
    let currentHex = hex;
    for (let step = 0; step < 40; step++) {
      const factor = step / 40;
      let r = color.r, g = color.g, b = color.b;
      if (isBgDark) {
        r = Math.round(color.r + (255 - color.r) * factor);
        g = Math.round(color.g + (255 - color.g) * factor);
        b = Math.round(color.b + (220 - color.b) * factor);
      } else {
        r = Math.round(color.r * (1 - factor));
        g = Math.round(color.g * (1 - factor));
        b = Math.round(color.b * (1 - factor));
      }
      currentHex = rgbToHex(r, g, b);
      if (getContrastRatio(currentHex, targetBgHex) >= targetRatio) {
        return currentHex;
      }
    }
    return isBgDark ? '#ffffff' : '#0e1726';
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

### Full Brand Manifesto
${brandKit.manifesto || 'N/A'}

### Strategic Ten-Year Vision
${brandKit.vision || 'N/A'}

### Target Audience & User Profile
${brandKit.targetAudience || 'N/A'}

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

  const deductCredit = async () => {
    if (user && userTier === 'Trial') {
      const nextCredits = Math.max(0, userCredits - 1);
      setUserCredits(nextCredits);
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        await updateDoc(doc(db, 'user_subscriptions', user.uid), {
          credits: nextCredits
        });
      } catch (e) {
        console.error("Error updating credits in Firestore:", e);
      }
    }
  };

  const generateLogo = async () => {
    if (!description.trim()) return;
    if (user && userTier === 'Trial' && userCredits <= 0) {
      setShowBillingModal(true);
      return;
    }
    
    try {
      setIsGeneratingImage(true);
      setGenerationAction('Drafting logo designs...');
      setVideoUrl(null); // Reset video if making a new logo
      setVideoBlob(null);
      setImageOptions([]);
      setSelectedImageIndex(null);
      
      const prompts = [
        `A professional ${stylePreset} style company logo. Clean, minimalist, and sleek. Description: ${description}. White background or transparent-like clean studio setup.${palette.length > 0 ? ` Use exactly this color palette: ${palette.join(', ')}.` : ''}${negativePrompt ? ` Elements to avoid: ${negativePrompt}` : ''}`,
        `A professional ${stylePreset} style company logo. Bold, vibrant, and highly expressive. Description: ${description}. White background or transparent-like clean studio setup.${palette.length > 0 ? ` Use exactly this color palette: ${palette.join(', ')}.` : ''}${negativePrompt ? ` Elements to avoid: ${negativePrompt}` : ''}`,
        `A professional ${stylePreset} style company logo. Abstract, geometric, and conceptual. Description: ${description}. White background or transparent-like clean studio setup.${palette.length > 0 ? ` Use exactly this color palette: ${palette.join(', ')}.` : ''}${negativePrompt ? ` Elements to avoid: ${negativePrompt}` : ''}`
      ];

      const promises = prompts.map(async (pStr) => {
        const res = await fetch('/api/generate-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: pStr,
            preset: stylePreset,
            resolution: imageSize,
            ratio: aspectRatio,
            palette,
            negative: negativePrompt
          })
        });
        if (!res.ok) {
          const errRes = await res.json();
          throw new Error(errRes.error || 'Server logo synthesis failed.');
        }
        return res.json();
      });

      const results = await Promise.all(promises);
      const newOptions = results.filter(Boolean) as { base64: string; mimeType: string; url: string }[];

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

        await deductCredit();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate logo. Please try again.');
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
      
      const sourceImage = imageOptions[selectedImageIndex];
      const res = await fetch('/api/edit-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBase64: sourceImage.base64,
          mimeType: sourceImage.mimeType,
          editPrompt,
          editMode,
          palette,
          ratio: aspectRatio,
          resolution: imageSize
        })
      });

      if (!res.ok) {
        const errVal = await res.json();
        throw new Error(errVal.error || 'Edit session failed on backend.');
      }

      const newImage = await res.json();
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
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to edit logo.');
    } finally {
      setIsEditingImage(false);
      setGenerationAction('');
    }
  };

  const animateLogo = async () => {
    if (selectedImageIndex === null || !imageOptions[selectedImageIndex]) return;
    const selectedImageData = imageOptions[selectedImageIndex];
    if (user && userTier === 'Trial') {
      alert("Veo synthesis is a Pro feature! Register or upgrade your trial in the billing panel to generate dynamic motion graphics.");
      setShowBillingModal(true);
      return;
    }
    
    try {
      setIsGeneratingVideo(true);
      setGenerationAction('Initializing video synthesis...');

      const styles = ['Subtle Fades', 'Dynamic Spins', 'Flowing Movements'];
      const initialOptions = styles.map(style => ({ style, blob: null, url: null, isLoading: true }));
      setVideoOptions(initialOptions);
      setSelectedVideoIndex(0);

      const promises = styles.map(async (style, index) => {
        try {
          const resInitiate = await fetch('/api/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64: selectedImageData.base64,
              mimeType: selectedImageData.mimeType,
              prompt: description,
              style,
              ratio: aspectRatio
            })
          });

          if (!resInitiate.ok) {
            const errVal = await resInitiate.json();
            throw new Error(errVal.error || 'Server video synthesis initialization failed.');
          }

          const { operationName } = await resInitiate.json();

          // Polling status loop on back-end securely
          let completed = false;
          while (!completed) {
            await new Promise(r => setTimeout(r, 8000 + Math.random() * 2000));
            const resStatus = await fetch('/api/video-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName })
            });

            if (!resStatus.ok) {
              throw new Error('Video check failed.');
            }

            const { done, error } = await resStatus.json();
            if (error) throw new Error(error.message || 'Error compiling video.');
            if (done) completed = true;
          }

          // Downloading stream safely from back-end
          const resDownload = await fetch('/api/video-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName })
          });

          if (!resDownload.ok) {
            throw new Error('Video download streaming failed.');
          }

          const blob = await resDownload.blob();
          const url = URL.createObjectURL(blob);
          
          setVideoOptions(prev => {
            const n = [...prev];
            n[index] = { style, blob, url, isLoading: false };
            return n;
          });
          return { style, blob, url };
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
      alert('Failed to generate video. Please try again.');
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
    setPaletteHistory([[]]);
    setPalettePointer(0);
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
    setPaletteHistory(prj.paletteHistory || [[prj.palette || []]]);
    setPalettePointer(prj.palettePointer ?? (prj.palette ? 0 : -1));
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
      paletteHistory,
      palettePointer,
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
      let payload: any = { mode };
      
      if (mode === 'text') {
        payload.palettePrompt = palettePrompt;
      } else if (mode === 'image' && selectedImageIndex !== null && imageOptions[selectedImageIndex]) {
        const sourceImage = imageOptions[selectedImageIndex];
        payload.sourceImage = { base64: sourceImage.base64, mimeType: sourceImage.mimeType };
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

        payload.sourceImage = base64Data;
        payload.mode = 'image';
      }

      if (mode === 'image' && (selectedImageIndex === null || !imageOptions[selectedImageIndex])) {
        throw new Error('Please generate or select a logo before extracting colors.');
      }

      const res = await fetch('/api/generate-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Server color synthesis failed.');
      }

      const { palette: resPalette } = await res.json();
      if (Array.isArray(resPalette)) {
        await handlePaletteChange(resPalette);
      }
    } catch (err: any) {
      console.error('Failed to generate palette:', err);
      alert(err.message || 'Color palette generation failed.');
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const generateBrandKit = async () => {
    if (!description.trim()) return;
    setIsGeneratingBrandKit(true);
    setGenerationAction('Analyzing brand identity...');
    try {
      const res = await fetch('/api/generate-brand-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: description })
      });

      if (!res.ok) {
        throw new Error('Guidelines synthesis failed on backend.');
      }

      const { brandKit: kitData } = await res.json();
      setBrandKit(kitData);
      await saveCurrent({ brandKit: kitData });
      setActiveTab('brand');
    } catch (err: any) {
      console.error('Failed to generate brand kit:', err);
      alert(err.message || 'Brand guidelines compilation failed.');
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
      const sourceImage = imageOptions[selectedImageIndex];
      const res = await fetch('/api/generate-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBase64: sourceImage.base64,
          mimeType: sourceImage.mimeType,
          stylePreset
        })
      });

      if (!res.ok) {
        throw new Error('Matching iconography compilation failed on backend.');
      }

      const { icons } = await res.json();
      setMatchingIcons(icons);
      await saveCurrent({ matchingIcons: icons });
      setActiveTab('design');
    } catch (err: any) {
      console.error('Failed to generate icons:', err);
      alert(err.message || 'UI Icon synthesis failed.');
    } finally {
      setIsGeneratingIcons(false);
      setGenerationAction('');
    }
  };

  const handlePaletteChange = async (newPalette: string[]) => {
    setPalette(newPalette);
    const newHistory = paletteHistory.slice(0, palettePointer + 1);
    const updatedHistory = [...newHistory, newPalette];
    // Limit history to 50 entries
    if (updatedHistory.length > 50) updatedHistory.shift();
    
    setPaletteHistory(updatedHistory);
    setPalettePointer(updatedHistory.length - 1);
    await saveCurrent({ palette: newPalette });
  };

  const undoPalette = async () => {
    if (palettePointer > 0) {
      const newPointer = palettePointer - 1;
      const prevPalette = paletteHistory[newPointer];
      setPalettePointer(newPointer);
      setPalette(prevPalette);
      await saveCurrent({ palette: prevPalette });
    }
  };

  const redoPalette = async () => {
    if (palettePointer < paletteHistory.length - 1) {
      const newPointer = palettePointer + 1;
      const nextPalette = paletteHistory[newPointer];
      setPalettePointer(newPointer);
      setPalette(nextPalette);
      await saveCurrent({ palette: nextPalette });
    }
  };

  const handlePaletteAdd = async (color: string) => {
     const newPalette = [...palette, color];
     await handlePaletteChange(newPalette);
  };

  const handlePaletteRemove = async (indexToRemove: number) => {
     const newPalette = palette.filter((_, idx) => idx !== indexToRemove);
     await handlePaletteChange(newPalette);
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
          brandInfo += `BRAND MANIFESTO:\n${brandKit.manifesto || 'N/A'}\n\n`;
          brandInfo += `STRATEGIC VISION:\n${brandKit.vision || 'N/A'}\n\n`;
          brandInfo += `TARGET AUDIENCE:\n${brandKit.targetAudience || 'N/A'}\n\n`;
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

  const applyTemplate = async (template: Template) => {
    setAspectRatio(template.settings.aspectRatio);
    setImageSize(template.settings.imageSize);
    setStylePreset(template.settings.stylePreset);
    setNegativePrompt(template.settings.negativePrompt);
    await handlePaletteChange(template.settings.palette);
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
            </div>
          </div>

          {/* Combined Account, Profile and Credits Control Panel */}
          <div className="mb-6 p-4 bg-white/[0.03] border border-white/10 rounded-[16px] backdrop-blur-[10px] space-y-4 shadow-md selection:bg-cyan-500/30">
            {/* User Profile Credentials with interactive Sign Out */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full border border-white/10" alt="Avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center font-bold text-xs text-black uppercase font-mono shrink-0">
                    {user?.displayName ? user.displayName.charAt(0) : (user?.email ? user.email.charAt(0) : 'U')}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-xs font-black truncate text-white">{user?.displayName || 'Active Member'}</div>
                  <div className="text-[9px] text-white/40 truncate font-mono">{user?.email}</div>
                </div>
              </div>
              
              <button 
                onClick={logoutUser}
                className="flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 text-white/60 transition-all font-mono text-[9px] font-bold uppercase tracking-widest gap-1 shrink-0"
                title="Sign Out of Session"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-mono">My Account Pipeline</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                userTier === 'Agency' ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' :
                userTier === 'Pro' ? 'text-cyan-400 bg-cyan-500/10 border-[#4facfe]/30' :
                'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
              }`}>
                {userTier === 'Agency' ? 'Agency Elite' : userTier === 'Pro' ? 'Pro Member' : 'Free Trial'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Zap size={14} className={userTier !== 'Trial' ? 'text-cyan-400 animate-pulse' : 'text-yellow-400'} />
                <span className="text-[12px] font-bold text-white tracking-tight">
                  {userTier === 'Trial' ? `${userCredits} Synthesis Credits Left` : 'Unlimited Pro Synthesis'}
                </span>
              </div>
              <button 
                onClick={() => setShowBillingModal(true)} 
                className="text-[9px] uppercase tracking-wider font-extrabold text-[#4facfe] border border-[#4facfe]/30 hover:border-[#4facfe] hover:bg-[#4facfe]/10 px-2.5 py-1.5 rounded-[8px] transition-all"
              >
                Plan ⚡
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
                Visual Identity Synthesis
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
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Motion Preset</span>
                  <div className="grid grid-cols-2 gap-2">
                    {ANIMATION_PRESETS.map(preset => (
                      <button
                        key={preset}
                        onClick={() => setAnimationPreset(preset)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          animationPreset === preset 
                            ? 'bg-[#4facfe]/10 border-[#4facfe] text-[#4facfe]' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
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
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/50 block">
                  Brand Colors (Optional)
                </label>
                <div className="flex gap-2">
                  <button 
                    onClick={undoPalette}
                    disabled={palettePointer <= 0}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-md text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Undo Palette Change"
                  >
                    <Undo2 size={12} />
                  </button>
                  <button 
                    onClick={redoPalette}
                    disabled={palettePointer >= paletteHistory.length - 1}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-md text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Redo Palette Change"
                  >
                    <Redo2 size={12} />
                  </button>
                </div>
              </div>
              
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

              {/* Dynamic WCAG 2.1 Contrast Ratio Audit Report */}
              {palette.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#4facfe] font-bold font-mono">WCAG 2.1 Contrast Audit</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/50 rounded font-bold font-mono">ON WHITE BG</span>
                  </div>
                  
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {palette.slice(0, 5).map((color, i) => {
                      const ratio = getContrastRatio(color, '#FFFFFF');
                      const normalAA = ratio >= 4.5;
                      const normalAAA = ratio >= 7.0;
                      
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-all font-mono">
                          <div className="flex items-center gap-2.5 flex-1">
                            <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color }} />
                            <div>
                              <div className="text-[11px] text-white font-bold">{color}</div>
                              <div className="text-[9px] text-white/40">{i === 0 ? 'Primary Accent' : i === 1 ? 'Secondary Accent' : `Variant 0${i+1}`}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[12px] font-black text-white font-mono">{ratio.toFixed(2)}:1</span>
                            </div>
                            
                            <div className="flex flex-col gap-0.5 text-[8px] font-bold text-center">
                              <span className={`px-1.5 py-0.5 rounded-sm uppercase text-[8px] ${
                                normalAA 
                                  ? 'text-teal-400 bg-teal-400/15 border border-teal-500/20' 
                                  : 'text-amber-400 bg-[#3a2f1d] border border-amber-500/20'
                              }`}>
                                AA: {normalAA ? 'Pass' : 'Fail'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-sm uppercase text-[8px] ${
                                normalAAA 
                                  ? 'text-purple-400 bg-purple-400/15 border border-purple-500/20' 
                                  : 'text-zinc-500 bg-zinc-800 border border-zinc-700/50'
                              }`}>
                                AAA: {normalAAA ? 'Pass' : 'Fail'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="bg-[#4facfe]/5 border border-[#4facfe]/10 p-2.5 rounded-lg text-[10px] text-white/60 leading-relaxed font-sans mt-2">
                    <span className="text-[#4facfe] font-bold">ℹ Guidelines:</span> WCAG AA requires a ratio of at least <b className="text-[#4facfe]">4.5:1</b> for normal text, and <b className="text-[#4facfe]">3.0:1</b> for visual branding elements.
                  </div>
                </div>
              )}
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
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'brand' ? 'bg-[#4facfe] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]' : 'text-white/40 hover:text-white'}`}
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
                ) : activeTab === 'brand' ? (
                  <BrandKitWorkspace
                    brandKit={brandKit}
                    setBrandKit={setBrandKit}
                    palette={palette}
                    handlePaletteChange={handlePaletteChange}
                    imageOptions={imageOptions}
                    selectedImageIndex={selectedImageIndex}
                    isGeneratingBrandKit={isGeneratingBrandKit}
                    generateBrandKit={generateBrandKit}
                    isEditingBrandKit={isEditingBrandKit}
                    setIsEditingBrandKit={setIsEditingBrandKit}
                    saveCurrent={saveCurrent}
                    CURATED_FONTS={CURATED_FONTS}
                    description={description}
                    isExporting={isExporting}
                    downloadFullBundle={downloadFullBundle}
                  />
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
                           {selectedMockup === 'physicalStudio' && (
                              <motion.div 
                                key="physical-studio-scene"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full h-full flex flex-col"
                              >
                                 <PhysicalMockupStudio 
                                    logoUrl={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url || ''} 
                                    palette={brandKit?.palette || palette || []}
                                    slogan={brandKit?.slogan || ''}
                                 />
                              </motion.div>
                           )}

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
                                      {...getAnimationProps(animationPreset)}
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
                                 <div className="flex-1 space-y-12">
                                    <div className="bg-[#f0f0f0] rounded-3xl p-8 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                                       <ProceduralVFX preset={animationPreset} color={palette[0]} />
                                       <motion.div 
                                         {...getAnimationProps(animationPreset)}
                                         className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 z-10"
                                       >
                                          <img src={watermarkedImageUrl || imageOptions[selectedImageIndex || 0]?.url} className="w-16 h-16 object-contain" />
                                       </motion.div>
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
                             onClick={() => setSelectedMockup('physicalStudio')}
                             className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 ${selectedMockup === 'physicalStudio' ? 'bg-[#4facfe] text-white shadow-[0_10px_30px_rgba(79,172,254,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                           >
                              <Sparkles size={24} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Product Studio</span>
                           </button>
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
                      <ProceduralVFX preset={animationPreset} color={palette[0]} />
                      <motion.img 
                        {...getAnimationProps(animationPreset)}
                        src={watermarkedImageUrl || imageOptions[selectedImageIndex].url} 
                        alt="Selected Option" 
                        className="object-contain max-h-[80%] max-w-[80%] rounded-[24px] shadow-2xl relative z-10"
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

      {/* Billing & Subscription Modal */}
      <AnimatePresence>
        {showBillingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-4xl bg-[#0b0c13] border border-white/20 rounded-[32px] p-8 text-white relative flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl space-y-8 font-['Helvetica_Neue',Arial,sans-serif]"
            >
              <button 
                onClick={() => setShowBillingModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase tracking-[0.5em] text-[#4facfe] font-extrabold font-mono">SoloDesign Labs</span>
                <h2 className="text-4xl font-extrabold tracking-tight italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-purple-400">
                  Select Membership Tier
                </h2>
                <p className="text-white/55 text-sm max-w-xl mx-auto">
                  Equip your enterprise pipeline with state-of-the-art Veo synthesis servers and high-res vector compiling channels.
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Free Trial Card */}
                <div className="flex flex-col justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[24px] space-y-6 relative overflow-hidden">
                  {userTier === 'Trial' && (
                    <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Active Plan
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white uppercase italic tracking-wider">Free Trial</h3>
                      <div className="flex items-baseline gap-1 text-white/50">
                        <span className="text-2xl font-black italic">$0</span>
                        <span className="text-xs">forever</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Evaluate standard design channels and publish real brand systems to the community.
                    </p>
                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-green-400 font-bold">✔</span> 3 basic logo drafts total
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-green-400 font-bold">✔</span> Canvas watermark enabled
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/30 line-through">
                        <span>✘</span> Video synthesis (Veo)
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/30 line-through">
                        <span>✘</span> Icon synth packs
                      </div>
                    </div>
                  </div>
                  <button 
                    disabled 
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/40 cursor-not-allowed"
                  >
                    {userTier === 'Trial' ? 'Active' : 'Unobtainable'}
                  </button>
                </div>

                {/* Pro Plan Card */}
                <div className="flex flex-col justify-between p-6 bg-white/[0.04] border border-[#4facfe]/30 rounded-[24px] space-y-6 relative overflow-hidden shadow-lg shadow-cyan-500/5">
                  {userTier === 'Pro' && (
                    <div className="absolute top-3 right-3 bg-cyan-500/20 text-cyan-400 border border-[#4facfe]/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Active Plan
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white uppercase italic tracking-wider">Pro Tier</h3>
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md">Popular</span>
                      </div>
                      <div className="flex items-baseline gap-1 text-cyan-400">
                        <span className="text-3xl font-black italic">$29</span>
                        <span className="text-xs text-white/50">/ month</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Unlimited generations and full access to smart brand strategist modules.
                    </p>
                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-cyan-400 font-bold">✔</span> Unlimited logo generations
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-cyan-400 font-bold">✔</span> 3x simultaneous Veo motions
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-cyan-400 font-bold">✔</span> Full premium Guidelines suite
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-cyan-400 font-bold">✔</span> Watermark toggles & uncompressed assets
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpgrade('Pro')}
                    disabled={isUpgrading || userTier === 'Pro'}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                      userTier === 'Pro' 
                        ? 'bg-white/5 border border-white/10 text-white/45 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-gray-200 active:scale-95'
                    }`}
                  >
                    {isUpgrading ? 'Redirecting...' : userTier === 'Pro' ? 'Owned' : 'Upgrade Pipeline ⚡'}
                  </button>
                </div>

                {/* Agency Elite card */}
                <div className="flex flex-col justify-between p-6 bg-white/[0.02] border border-purple-500/30 rounded-[24px] space-y-6 relative overflow-hidden">
                  {userTier === 'Agency' && (
                    <div className="absolute top-3 right-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Active Plan
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white uppercase italic tracking-wider">Agency Elite</h3>
                      <div className="flex items-baseline gap-1 text-purple-400">
                        <span className="text-3xl font-black italic">$99</span>
                        <span className="text-xs text-white/50">/ month</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Designed for fast-paced visual studios demanding priority 4K rendering layers.
                    </p>
                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-purple-400 font-bold">✔</span> Everything in Pro Tier
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-purple-400 font-bold">✔</span> Ultra high-fidelity 4K scaling
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-purple-400 font-bold">✔</span> Unlimited simultaneous videos
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="text-purple-400 font-bold">✔</span> Priority server queuing
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpgrade('Agency')}
                    disabled={isUpgrading || userTier === 'Agency'}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                      userTier === 'Agency' 
                        ? 'bg-white/5 border border-white/10 text-white/45 cursor-not-allowed'
                        : 'bg-purple-500 hover:bg-purple-600 active:scale-95 text-white'
                    }`}
                  >
                    {isUpgrading ? 'Redirecting...' : userTier === 'Agency' ? 'Owned' : 'Upgrade Studio ⚡'}
                  </button>
                </div>

              </div>

              {/* Secure payment confirmation */}
              <div className="flex items-center justify-between text-[11px] text-white/45 border-t border-white/5 pt-4">
                <span>Secure PCI-DSS Layer. Hosted with Stripe.</span>
                <span>Terminates autonomously. Real-time upgrade.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

function Vortex({ color = '#4facfe' }: { color?: string }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            scale: Math.random() * 0.5 + 0.5,
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%'
          }}
          animate={{ 
            x: [null, (Math.random() - 0.5) * 20 + '%'],
            y: [null, (Math.random() - 0.5) * 20 + '%'],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute w-[40vw] h-[40vw] rounded-full blur-[120px]"
          style={{ 
            backgroundColor: i % 2 === 0 ? color : '#8A2BE2',
            filter: 'blur(120px)',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[20px]"></div>
    </div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#0d0e13] text-white flex flex-col font-mono selection:bg-cyan-400 selection:text-black overflow-x-hidden relative">
      {/* Background Neon Grid Matrix */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#141622_1px,transparent_1px),linear-gradient(to_bottom,#141622_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Absolute brutal header border line */}
      <div className="h-2 w-full bg-gradient-to-r from-yellow-300 via-pink-500 to-cyan-400 z-50 relative"></div>

      {/* Floating System Deco Badge in Margins */}
      <div className="fixed top-6 right-6 z-50 flex gap-2">
        <span className="px-3 py-1 bg-black border-2 border-[#00f2fe] text-[#00f2fe] text-[9px] font-bold uppercase tracking-widest shadow-[3px_3px_0px_#000] rounded">
          SYSTEM: ONLINE // CLOUD_A1
        </span>
      </div>

      {/* Hero Container */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 md:p-20 text-center">
        <div className="max-w-6xl w-full space-y-12">
          
          {/* Neon Retro Sticker Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="px-4 py-1.5 bg-yellow-300 text-black border-2 border-black font-extrabold text-[10px] uppercase tracking-[0.3em] shadow-[4px_4px_0px_#000] rotate-[-2deg]">
              ⚡ LAUNCH RELEASE v1.5 [STABLE]
            </div>
          </motion.div>

          {/* Big Outlined Brutalist Title */}
          <div className="relative inline-block space-y-2">
            <motion.h1 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-[clamp(3.5rem,11vw,9.5rem)] font-black leading-[0.8] tracking-tighter uppercase font-mono text-white select-none relative"
            >
              SOLO<span className="text-yellow-300">DESIGN</span><br />
              <span className="text-transparent" style={{ WebkitTextStroke: "2px #00f2fe" }}>LABS</span>
            </motion.h1>
            {/* Background absolute retro shadow text */}
            <div className="absolute inset-0 text-[clamp(3.5rem,11vw,9.5rem)] font-black leading-[0.8] tracking-tighter uppercase font-mono text-pink-500/10 blur-[8px] -z-10 select-none pointer-events-none">
              SOLODESIGN<br />LABS
            </div>
          </div>

          {/* Subtext with Brutalist Border Highlight */}
          <div className="max-w-2xl mx-auto py-4 px-6 bg-[#161824] border-2 border-white/10 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] rounded-xl">
            <p className="text-[14px] md:text-[16px] text-white/70 leading-relaxed tracking-wide font-sans">
              Deploy uncompressed 4K vector brand kits and cinematic logo motion layers instantly. Zero simulated frameworks, pure machine inference.
            </p>
          </div>

          {/* Main Call to Action Button Pack */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <button 
              onClick={onStart}
              className="px-10 py-5 bg-[#00f2fe] text-black font-black border-3 border-black rounded-lg transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_#000] shadow-[4px_4px_0px_#000] text-lg uppercase tracking-wider flex items-center gap-3 cursor-pointer"
            >
              INITIATE DESIGN CHANNEL <ChevronRight size={20} className="stroke-[3px]" />
            </button>
            
            <div className="flex items-center gap-3 py-3 px-5 border-2 border-dashed border-white/20 rounded-lg text-left bg-black/40">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse border border-emerald-500/50"></div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-[#00ff7f] font-bold">VEO DIRECT CORE</div>
                <div className="text-[11px] text-white/40">LATENCY: 140ms</div>
              </div>
            </div>
          </div>

        </div>

        {/* Floating Arrow down */}
        <div className="absolute bottom-6 flex flex-col items-center gap-2 opacity-30 mt-12">
          <span className="text-[8px] font-bold uppercase tracking-[0.4em]">SYSTEM DETAILED INVENTORY BELOW</span>
          <div className="w-6 h-6 border-b-2 border-r-2 border-white/50 rotate-45 animate-bounce"></div>
        </div>
      </section>

      {/* Retro OS Windows Grid Section */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto space-y-16">
        
        <div className="text-center md:text-left space-y-2">
          <div className="inline-block px-3 py-1 bg-pink-500 text-white font-bold text-[9px] uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_#000] mb-3">
            DIRECTORY: UTILITIES
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
            Core Infrastructure Files
          </h2>
          <p className="text-white/40 text-sm max-w-xl">
            Double-click or interact with high-performance automated synthesis containers.
          </p>
        </div>

        {/* Retro Window Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Tabbed Panel 1 */}
          <div className="lg:col-span-8 bg-[#161824] border-3 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_#000] flex flex-col justify-between">
            {/* Window Top bar */}
            <div className="bg-[#1f2235] border-b-3 border-black py-2.5 px-4 flex justify-between items-center font-bold text-xs select-none">
              <span className="text-yellow-300 flex items-center gap-2">📂 WND_01: HYPER_SYNTHESIS_ENG.EXE</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-red-500 border-2 border-black rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 border-2 border-black rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
              </div>
            </div>
            {/* Inner Content */}
            <div className="p-8 space-y-6 flex-1">
              <span className="px-2.5 py-1 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20 rounded text-[9px] font-bold uppercase">SECURE PROXIED RUNTIME</span>
              <h3 className="text-3xl font-black uppercase tracking-tight">AI Diffusion Core</h3>
              <p className="text-white/50 leading-relaxed text-sm font-sans max-w-2xl">
                Leverages pure, server-side `@google/genai` infrastructure. High-fidelity image options with prompt variations, color extraction pipelines, and raw export layouts.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-white/50 tracking-wider">⚡ 4K UNCOMPRESSED</span>
                <span className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-white/50 tracking-wider">📁 ALPHA MAP CHANNELS</span>
                <span className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-white/50 tracking-wider">🔬 RAW SEED TUNING</span>
              </div>
            </div>
          </div>

          {/* Tabbed Panel 2 */}
          <div className="lg:col-span-4 bg-[#161824] border-3 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_#000] flex flex-col justify-between">
            {/* Window Top bar */}
            <div className="bg-[#1f2235] border-b-3 border-black py-2.5 px-4 flex justify-between items-center font-bold text-xs select-none">
              <span className="text-cyan-400">📹 WND_02: MOTION.SYS</span>
              <div className="w-3 h-3 bg-cyan-400 border-2 border-black rounded-full"></div>
            </div>
            {/* Inner Content */}
            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 bg-pink-500/10 text-pink-500 border border-pink-500/20 rounded text-[9px] font-bold uppercase">VEGA SERVER INSTANCE</span>
                <h3 className="text-2xl font-black uppercase mt-4">Kinetic Motion</h3>
                <p className="text-white/40 leading-relaxed text-xs font-sans mt-2">
                  Generate cinematic brand loops with automated fast rendering paths. Seamless frame transformations without manual keyframing.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-white/40 text-[10px]">
                FRAME CACHE: [STABLE-120F]
              </div>
            </div>
          </div>

          {/* Tabbed Panel 3 */}
          <div className="lg:col-span-4 bg-[#161824] border-3 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_#000] flex flex-col justify-between">
            {/* Window Top bar */}
            <div className="bg-[#1f2235] border-b-3 border-black py-2.5 px-4 flex justify-between items-center font-bold text-xs select-none">
              <span className="text-yellow-300">⚖ ACCESSIBILITY.O</span>
              <div className="w-3 h-3 bg-yellow-300 border-2 border-black rounded-full"></div>
            </div>
            {/* Inner Content */}
            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 bg-yellow-300/10 text-yellow-300 border border-yellow-300/20 rounded text-[9px] font-bold uppercase">WCAG standards</span>
                <h3 className="text-2xl font-black uppercase mt-4">Contrast Audit</h3>
                <p className="text-white/40 leading-relaxed text-xs font-sans mt-2">
                  Ensure all brand accent colors satisfy WCAG 2.1 AAA minimum contrast requirements dynamically during palette updates.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-white/40 text-[10px]">
                RATING CONFIRMATION: LIVE
              </div>
            </div>
          </div>

          {/* Tabbed Panel 4 */}
          <div className="lg:col-span-8 bg-[#161824] border-3 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_#000] flex flex-col justify-between">
            {/* Window Top bar */}
            <div className="bg-[#1f2235] border-b-3 border-black py-2.5 px-4 flex justify-between items-center font-bold text-xs select-none">
              <span className="text-[#00ff7f]">📂 WND_04: BRANDKIT_EXPORTER.SH</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
              </div>
            </div>
            {/* Inner Content */}
            <div className="p-8 space-y-4 flex-1">
              <span className="px-2.5 py-1 bg-[#00ff7f]/10 text-[#00ff7f] border border-[#00ff7f]/20 rounded text-[9px] font-bold uppercase">Single File Zip Package</span>
              <h3 className="text-3xl font-black uppercase">Automated Vault Bundler</h3>
              <p className="text-white/50 leading-relaxed text-sm font-sans max-w-2xl">
                Package logo SVG vector structures, tailored font-scaling coordinates, accessibility profile blueprints, and dynamic high-resolution icon graphics automatically in a single executable zip.
              </p>
              <div className="pt-4 flex gap-8 border-t border-white/5 font-mono text-[10px]">
                <div>
                  <div className="text-[#00ff7f] font-bold">ACCELERATED BUNDLE</div>
                  <div className="text-white/40">COMPRESSION LEVEL 9</div>
                </div>
                <div>
                  <div className="text-yellow-300 font-bold">EXPORT PROTOTYPE</div>
                  <div className="text-white/40">SVG, PNG, CSS & JSON</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Retro Archive Gallery */}
      <section className="relative z-10 py-24 bg-black/30 border-t-3 border-b-3 border-black">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="px-2.5 py-0.5 bg-yellow-300 text-black border border-black font-bold text-[8px] uppercase tracking-widest">STATION_INVENTORY</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mt-1">
                Visual Artifact Logs
              </h2>
            </div>
            <div className="text-xs text-[#00f2fe] font-bold tracking-widest animate-pulse font-mono">
              ★ LIVE PIPELINE INFERENCE MONITOR
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#161824] border-3 border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_#000] hover:-translate-y-1 transition-transform">
                <div className="bg-[#1f2235] border-b-3 border-black px-4 py-2 font-bold text-[10px] text-white/50 flex justify-between items-center font-mono">
                   <span>IMAGE_LOG_2042_0{i}.BIN</span>
                   <span className="text-[#00ff7f]">PASS</span>
                </div>
                <div className="h-64 bg-zinc-950 relative overflow-hidden group">
                  <img 
                    src={`https://picsum.photos/seed/solodesign-${i}/600/400`} 
                    className="w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-[0.16, 1, 0.3, 1]" 
                    alt="Synthesis logs" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-5">
                    <span className="text-[9px] font-bold text-[#00f2fe] uppercase tracking-wider font-mono">// SESSION_023{i}</span>
                    <h4 className="text-lg font-black uppercase text-white mt-1">Synthesized Asset Array</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extreme CTA Panel */}
      <section className="relative z-10 py-32 px-6 text-center max-w-5xl mx-auto">
        <div className="bg-[#161824] border-3 border-black p-12 rounded-2xl shadow-[10px_10px_0px_#000] space-y-8 relative overflow-hidden">
          <div className="absolute top-[-20px] left-[-20px] w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl"></div>
          
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight leading-none text-white font-mono">
            ARCHITECT YOUR<br />
            <span className="text-[#00f2fe]/90">LEGACY SYSTEM</span>
          </h2>
          <p className="text-white/40 text-xs md:text-sm font-sans max-w-lg mx-auto leading-relaxed">
            Begin synthesis right now. Secure full-stack billing systems, premium multi-level API endpoints, and raw 4K custom graphic matrices.
          </p>
          
          <div className="pt-4">
            <button 
              onClick={onStart}
              className="px-16 py-6 bg-yellow-300 hover:bg-yellow-400 text-black font-black border-3 border-black rounded-lg transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_#000] shadow-[6px_6px_0px_#000] text-xl uppercase tracking-widest cursor-pointer"
            >
              ACCESS LABS 01_STATION
            </button>
          </div>
        </div>
      </section>

      {/* Retro Footer */}
      <footer className="relative z-10 bg-[#0d0e13] border-t-3 border-black py-16 px-6 lg:px-20 font-mono">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#00f2fe] rotate-45 border-2 border-black"></div>
              <span className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2fe]">SOLODESIGN // LABS</span>
            </div>
            <p className="text-white/30 text-xs leading-relaxed max-w-sm">
              The ultimate uncompromised server-side synthesis framework built for real production developers.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#00f2fe]">RESOURCES . BIN</h4>
            <ul className="space-y-2.5 text-xs text-white/40 uppercase font-bold tracking-wider">
              <li><button onClick={onStart} className="hover:text-white transition-colors text-left">LAB_BLUEPRINTS.MD</button></li>
              <li><button onClick={onStart} className="hover:text-white transition-colors text-left">API_CONTROL_SYSTEM.C</button></li>
              <li><span className="text-emerald-400">UPTIME_MONITOR: [OK]</span></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-pink-500">LEGAL . LOG</h4>
            <ul className="space-y-2.5 text-xs text-white/40 uppercase font-bold tracking-wider">
              <li><a href="#" className="hover:text-white transition-colors">PRIVACY_ENVELOPE.TXT</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TERMS_OF_SERVICE.BAK</a></li>
              <li><span>&copy; {new Date().getFullYear()} LABS Inc.</span></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5 text-[10px] text-white/20">
          <span>// DESIGNED & DEPLOYED AUTOMATICALLY IN CLOUDCONTAINER_INGRESS.</span>
          <div className="flex gap-6">
            <span>PING: OK</span>
            <span>TLS: 1.3</span>
            <span>EDGE: ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

