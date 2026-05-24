import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookMarked, ShieldCheck, Wand2, Monitor, Brush, Sparkles, FolderHeart, Target, LayoutGrid, Type, Palette, Copy, Plus, X, FileCode, Download, Loader2, Zap } from 'lucide-react';
import { BrandKit } from '../lib/db';

interface BrandKitWorkspaceProps {
  brandKit: BrandKit | null;
  setBrandKit: (bk: BrandKit | null) => void;
  palette: string[];
  handlePaletteChange: (colors: string[]) => void;
  imageOptions: Array<{ url: string; base64: string }>;
  selectedImageIndex: number | null;
  isGeneratingBrandKit: boolean;
  generateBrandKit: () => void;
  isEditingBrandKit: boolean;
  setIsEditingBrandKit: (b: boolean) => void;
  saveCurrent: (updates?: any) => void;
  CURATED_FONTS: Array<{ name: string; importName: string; type: string }>;
  description: string;
  isExporting: boolean;
  downloadFullBundle: () => void;
}

export function BrandKitWorkspace({
  brandKit,
  setBrandKit,
  palette,
  handlePaletteChange,
  imageOptions,
  selectedImageIndex,
  isGeneratingBrandKit,
  generateBrandKit,
  isEditingBrandKit,
  setIsEditingBrandKit,
  saveCurrent,
  CURATED_FONTS,
  description,
  isExporting,
  downloadFullBundle
}: BrandKitWorkspaceProps) {
  // Advanced Interactive States
  const [activeBrandMode, setActiveBrandMode] = useState<'guidelines' | 'presentation'>('guidelines');
  const [presentationSlideIndex, setPresentationSlideIndex] = useState<number>(0);
  const [logoPadding, setLogoPadding] = useState<number>(40);
  const [rotatedLogo, setRotatedLogo] = useState<number>(0);
  const [constructionGrid, setConstructionGrid] = useState<'none' | 'blueprint' | 'golden' | 'optical'>('none');
  const [grayscaleLogo, setGrayscaleLogo] = useState<boolean>(false);
  const [typographySize, setTypographySize] = useState<number>(55);
  const [typographyWeight, setTypographyWeight] = useState<'300' | '400' | '500' | '700' | '800'>('400');
  const [typographyTestText, setTypographyTestText] = useState<string>('');
  const [contrastLevel, setContrastLevel] = useState<'AA' | 'AAA'>('AA');
  const [codeTargetType, setCodeTargetType] = useState<'tailwind' | 'css' | 'swift' | 'kotlin' | 'json'>('tailwind');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  // Helper for WCAG Accessibility
  const getContrastRatio = (hex1: string, hex2: string) => {
    const getLuminance = (hex: string) => {
      let r = 0, g = 0, b = 0;
      let clean = hex.replace('#', '');
      if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
      } else if (clean.length === 6) {
        r = parseInt(clean.slice(0, 2), 16);
        g = parseInt(clean.slice(2, 4), 16);
        b = parseInt(clean.slice(4, 6), 16);
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

  const defaultBrandKit: BrandKit = {
    slogan: 'Evolve The Core Identity',
    mission: 'To synthesize mathematical design strategies that inspire continuous creative focus.',
    voice: 'Professional, technical, avant-garde and highly focused',
    manifesto: 'We believe design is an honest system of geometric and visual parameters that frame human interactions. Truth lies in clean execution, structural rhythm, and accessible design systems.',
    vision: 'To build the standard modular identity blueprint used by next-generation creative founders globally.',
    targetAudience: 'Product design leaders, avant-garde web developers, and modern minimalist creative builders.',
    typography: ['Space Grotesk', 'Inter'],
    secondaryColors: ['#334155', '#64748b'],
    usageRules: {
      do: ['Maintain optical safe exclusion margins', 'Ensure contrast rules meet standard compliance targets', 'Apply matching display typography for headings'],
      dont: ['Stretch or squash primary visual symbols', 'Combine non-compliant values across block banners', 'Exceed maximum torsional angle markers']
    },
    features: [
      { title: 'Interactive Core Sandbox', description: 'Enable creative customers to customize variables and templates directly within the main layout.' },
      { title: 'Omnisearch Navigation', description: 'Instantly retrieve documentation parameters, design blueprints, and hex codes through hotkeys.' },
      { title: 'High-Res Compiling Pipeline', description: 'Process dual-channel rasterization formats up to true 4K resolution synchronously.' }
    ]
  };

  if (!brandKit) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <motion.div
          key="brand-kit-onboarding"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="w-full max-w-2xl px-10 py-12 bg-[#0c0d15] border border-white/5 rounded-[32px] relative text-center space-y-8 z-10 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#4facfe]/5 rounded-full blur-[80px] pointer-events-none -ml-32 -mt-32" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#4facfe]/5 rounded-full blur-[80px] pointer-events-none -mr-32 -mb-32" />

          <div className="mx-auto w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative">
            <BookMarked size={32} className="text-[#4facfe]" />
            <div className="absolute inset-0 bg-[#4facfe]/10 rounded-2xl filter blur-xl scale-75 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">Corporate Brand guidelines</h2>
            <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#4facfe] block font-bold">System Identification Engine</span>
            <p className="text-white/50 text-xs max-w-sm mx-auto leading-relaxed">
              Guidelines require a compiled brand strategy to establish dynamic typography pairings, active chromatic DNA rules, logo optical zone coordinates, and synced coder tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={generateBrandKit}
              disabled={isGeneratingBrandKit || !description.trim()}
              className="px-6 py-4 bg-gradient-to-br from-[#00f2fe]/10 to-[#4facfe]/20 hover:from-[#00f2fe]/20 hover:to-[#4facfe]/30 border border-[#4facfe]/30 rounded-2xl text-[12px] uppercase font-bold tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-3 disabled:opacity-40"
            >
              <Sparkles size={20} className="text-[#00f2fe]" />
              <span>AI Guidelines Synthesis</span>
            </button>

            <button
              onClick={() => {
                setBrandKit(defaultBrandKit);
                saveCurrent({ brandKit: defaultBrandKit });
              }}
              className="px-6 py-4 bg-white/5 hover:bg-white/15 border border-white/10 rounded-2xl text-[12px] uppercase font-bold tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-3"
            >
              <Brush size={20} className="text-white/60" />
              <span>Initialize Manually</span>
            </button>
          </div>

          {!description.trim() && (
            <p className="text-[10px] text-white/30 font-mono">
              * Provide a short project description in the left sidebar to enable AI synthesis *
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto px-10 py-12 z-10 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Upper Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-8 text-left">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/5 rounded-2xl border border-white/10 text-[#4facfe]"><Zap size={24} /></span>
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-white">Brand Book Builder</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Studio Version 02.B</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveBrandMode('guidelines')}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 ${activeBrandMode === 'guidelines' ? 'bg-[#4facfe] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                <BookMarked size={12} />
                Document Mode
              </button>
              <button 
                onClick={() => {
                  setActiveBrandMode('presentation');
                  setPresentationSlideIndex(0);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 ${activeBrandMode === 'presentation' ? 'bg-[#4facfe] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                <Monitor size={12} />
                Presentation Play
              </button>
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
                  <ShieldCheck size={16} className="text-[#00ff7f]" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white">Lock Changes</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white">Refine Strategy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {activeBrandMode === 'presentation' ? (
          /* Presentation slide decks */
          <div className="p-1 bg-gradient-to-b from-white/10 to-transparent rounded-[32px] overflow-hidden shadow-2xl text-left">
            <div className="bg-[#0f111a]/95 rounded-[30px] p-12 min-h-[500px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#4facfe]/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <span className="text-[11px] uppercase font-mono tracking-widest text-[#4facfe]/80 font-bold">
                  Slide 0{presentationSlideIndex + 1} of 07 — {
                    presentationSlideIndex === 0 ? "Cover Slide" :
                    presentationSlideIndex === 1 ? "Brand Manifesto" :
                    presentationSlideIndex === 2 ? "Features Offered to Users" :
                    presentationSlideIndex === 3 ? "Chromatic DNA" :
                    presentationSlideIndex === 4 ? "Typography Hierarchy" :
                    presentationSlideIndex === 5 ? "Logo Geometry Details" : "Compliance Rules"
                  }
                </span>
                <div className="flex gap-1.5">
                  {[...Array(7)].map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setPresentationSlideIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${presentationSlideIndex === idx ? 'bg-[#4facfe] w-5' : 'bg-white/15'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`slide-${presentationSlideIndex}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {presentationSlideIndex === 0 && (
                      <div className="text-center space-y-8 py-8">
                        {imageOptions.length > 0 && (
                          <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-3">
                            <img src={imageOptions[selectedImageIndex || 0]?.url} className="w-full h-full object-contain filter drop-shadow-lg" />
                          </div>
                        )}
                        <div className="space-y-3">
                          <h1 className="text-5xl font-extrabold tracking-tight text-white uppercase block leading-none" style={{ fontFamily: brandKit.typography[0] }}>
                            {brandKit.slogan || "Brand Book"}
                          </h1>
                          <p className="text-white/60 text-lg max-w-lg mx-auto italic font-light font-sans">
                            {brandKit.mission}
                          </p>
                        </div>
                        <div className="pt-8">
                          <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono tracking-widest text-white/40 uppercase">
                            Strategic Identity Showcase • v1.0
                          </span>
                        </div>
                      </div>
                    )}

                    {presentationSlideIndex === 1 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                          <span className="text-[10px] bg-[#4facfe]/10 text-[#4facfe] border border-[#4facfe]/20 uppercase font-bold tracking-widest px-2.5 py-1 rounded-full font-mono font-bold">Manifesto</span>
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">The Soul of the Brand</h2>
                          <p className="text-[14px] text-white/70 leading-relaxed font-sans whitespace-pre-wrap max-h-[220px] overflow-y-auto custom-scrollbar pr-3">
                            {brandKit.manifesto || "No manifesto created. Refine strategy or toggle manual details."}
                          </p>
                        </div>
                        <div className="lg:col-span-12 xl:col-span-5 p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                          <div>
                            <span className="text-[10px] text-[#00ff7f] uppercase font-mono font-bold tracking-widest block mb-1">Brand Resonance Voice</span>
                            <p className="text-sm italic text-white/80 leading-relaxed">"{brandKit.voice}"</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-pink-500 uppercase font-mono font-bold tracking-widest block mb-1">Target Persona Summary</span>
                            <p className="text-xs text-white/60 leading-relaxed font-sans">{brandKit.targetAudience}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {presentationSlideIndex === 2 && (
                      <div className="space-y-6 text-left">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-[#4facfe]/10 text-[#4facfe] border border-[#4facfe]/20 uppercase font-bold tracking-widest px-2.5 py-1 rounded-full font-mono font-bold">Offerings</span>
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Features Offered for the Users</h2>
                          <p className="text-xs text-white/50">Core interactive capabilities provided to our active audience segment</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          {(brandKit.features || [
                            { title: 'Interactive Core Sandbox', description: 'Enable creative customers to customize variables and templates directly within the main layout.' },
                            { title: 'Omnisearch Navigation', description: 'Instantly retrieve documentation parameters, design blueprints, and hex codes through hotkeys.' },
                            { title: 'High-Res Compiling Pipeline', description: 'Process dual-channel rasterization formats up to true 4K resolution synchronously.' }
                          ]).slice(0, 3).map((f, i) => (
                            <div key={i} className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                              <span className="text-xs font-mono font-black text-[#4facfe]/60">0{i+1}</span>
                              <h4 className="text-sm font-bold uppercase tracking-tight text-white font-mono">{f.title}</h4>
                              <p className="text-xs text-white/60 leading-relaxed font-sans">{f.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {presentationSlideIndex === 3 && (
                      <div className="space-y-6 text-left">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Chromatic DNA Map</h2>
                          <p className="text-xs text-white/50">Core visual spectrum showing accessibility compliance scores (WCAG AA/AAA)</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                          {[...palette, ...(brandKit.secondaryColors || [])].slice(0, 4).map((c, i) => {
                            const ratioLight = getContrastRatio(c, '#ffffff');
                            const ratioDark = getContrastRatio(c, '#0a0a0a');
                            return (
                              <div key={i} className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-3">
                                <div className="h-16 rounded-xl border border-white/5 shadow-inner" style={{ backgroundColor: c }} />
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-40">{i === 0 ? 'Primary' : `Accent 0${i}`}</div>
                                  <div className="text-xs font-mono font-bold">{c}</div>
                                </div>
                                <div className="flex gap-2 border-t border-white/5 pt-2 text-[8px] font-mono">
                                  <span className={ratioLight >= 4.5 ? 'text-[#00ff7f]' : 'text-red-400'}>W {ratioLight.toFixed(1)}:1</span>
                                  <span className={ratioDark >= 4.5 ? 'text-[#00ff7f]' : 'text-red-400'}>B {ratioDark.toFixed(1)}:1</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {presentationSlideIndex === 4 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                        <div className="space-y-4">
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-semibold tracking-widest px-2.5 py-1 rounded-full font-mono font-bold">Typography</span>
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Font Architecture</h2>
                          <div className="space-y-2 font-mono text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40 font-bold">PRIMARY DISPLAY FONT:</span>
                              <span className="text-[#4facfe] font-bold">{brandKit.typography[0]}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40 font-bold">SECONDARY BODY FONT:</span>
                              <span className="text-[#4facfe] font-bold">{brandKit.typography[1]}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-center space-y-4">
                          <div className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Live Display Specimen</div>
                          <span className="text-4xl block truncate" style={{ fontFamily: brandKit.typography[0] }}>
                            Aa Bb Cc 123
                          </span>
                          <p className="text-xs text-white/60 leading-relaxed font-sans" style={{ fontFamily: brandKit.typography[1] }}>
                            Pack my box with five dozen liquor jugs. The quick brown fox jumps over the lazy dog.
                          </p>
                        </div>
                      </div>
                    )}

                    {presentationSlideIndex === 5 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                        <div className="space-y-4">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-semibold tracking-widest px-2.5 py-1 rounded-full font-mono font-bold">Geometry</span>
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Logo Grid Specification</h2>
                          <p className="text-xs text-white/60 leading-relaxed font-sans">
                            Calculated mathematical system with vertical and horizontal balance grids. Aspect boundaries specify a unified proportional exclusion space surrounding the symbol library.
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <div className="relative aspect-square w-48 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center p-6 overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10 pointer-events-none font-mono">
                              {[...Array(36)].map((_, idx) => <div key={idx} className="border border-white" />)}
                            </div>
                            <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20">W: 512px H: 512px</div>
                            {imageOptions.length > 0 && (
                              <img src={imageOptions[selectedImageIndex || 0]?.url} className="w-24 h-24 object-contain filter drop-shadow-xl z-10" />
                            )}
                            <div className="absolute inset-6 border border-[#4facfe]/40 rounded pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {presentationSlideIndex === 6 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="p-6 bg-[#00ff7f]/5 border border-[#00ff7f]/10 rounded-2xl space-y-3">
                          <h4 className="text-[10px] uppercase font-mono font-black tracking-widest text-[#00ff7f]">Mandatory Executions</h4>
                          <ul className="text-xs text-white/70 space-y-2 list-disc pl-4 font-sans leading-relaxed">
                            {brandKit.usageRules?.do.map((r, i) => <li key={i}>{r}</li>) || <li>Maintain aspect values</li>}
                          </ul>
                        </div>
                        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3">
                          <h4 className="text-[10px] uppercase font-mono font-black tracking-widest text-red-400">Restricted Executions</h4>
                          <ul className="text-xs text-white/70 space-y-2 list-disc pl-4 font-sans leading-relaxed">
                            {brandKit.usageRules?.dont.map((r, i) => <li key={i}>{r}</li>) || <li>Stretch or scale independently</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-white/5">
                <button
                  onClick={() => setPresentationSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={presentationSlideIndex === 0}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm uppercase font-mono text-white tracking-widest disabled:opacity-30"
                >
                  ← Back
                </button>
                <span className="text-[10px] font-mono text-white/30 tracking-widest font-bold">
                  Use Slides Tracker for Navigation
                </span>
                <button
                  onClick={() => setPresentationSlideIndex(prev => Math.min(6, prev + 1))}
                  disabled={presentationSlideIndex === 6}
                  className="px-4 py-2 bg-[#4facfe] hover:bg-opacity-90 rounded-xl text-sm uppercase font-mono text-white font-bold tracking-widest disabled:opacity-30"
                >
                  Next →
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* Document guidelines lists */
          <div className="space-y-16 text-left">
            
            {/* Brand Blueprint Section */}
            <section className="space-y-8 bg-white/[0.01] border-t border-b border-white/5 py-12 -mx-10 px-10">
              <div className="flex items-center gap-3">
                <BookMarked className="text-[#4facfe]" size={20} />
                <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono">Core Identity Slogan & Creed</h3>
              </div>

              {isEditingBrandKit ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 font-mono">Identity Slogan</label>
                    <input 
                      type="text" 
                      value={brandKit.slogan || ''} 
                      onChange={(e) => setBrandKit({...brandKit, slogan: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-3xl font-bold focus:border-[#4facfe] outline-none text-white font-sans"
                      placeholder="Brand Slogan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 font-mono">Mission Statement</label>
                    <textarea 
                      value={brandKit.mission || ''} 
                      onChange={(e) => setBrandKit({...brandKit, mission: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/75 focus:border-[#4facfe] outline-none h-28 resize-none font-sans"
                      placeholder="Mission Statement"
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-[#4facfe]/60 font-mono">Brand Voice & Tone Parameters</label>
                     <input 
                       type="text" 
                       value={brandKit.voice || ''} 
                       onChange={(e) => setBrandKit({...brandKit, voice: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 focus:border-[#4facfe] outline-none font-sans"
                       placeholder="e.g. Professional, Innovative, Precise"
                     />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase" style={{ fontFamily: brandKit.typography[0] }}>
                    {brandKit.slogan || 'Evolving Identity'}
                  </h1>
                  <p className="text-lg text-white/60 max-w-2xl leading-relaxed italic border-l-4 border-[#4facfe]/30 pl-8 font-light font-sans">
                    {brandKit.mission || brandKit.voice}
                  </p>
                </div>
              )}
            </section>

            {/* Narrative Blueprint Grid */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <FolderHeart className="text-[#4facfe]" size={20} />
                <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono">Identity Blueprint</h3>
              </div>

              {isEditingBrandKit ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#4facfe] flex items-center gap-2 font-mono">
                      <BookMarked size={14} /> Brand Manifesto
                    </label>
                    <textarea 
                      value={brandKit.manifesto || ''} 
                      onChange={(e) => setBrandKit({...brandKit, manifesto: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white/80 focus:border-[#4facfe] outline-none h-60 custom-scrollbar resize-none font-sans"
                      placeholder="Cohesive long-form emotional manifesto..."
                    />
                  </div>

                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-pink-500 flex items-center gap-2 font-mono">
                      <Sparkles size={14} /> 10-Year Strategic Vision
                    </label>
                    <textarea 
                      value={brandKit.vision || ''} 
                      onChange={(e) => setBrandKit({...brandKit, vision: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white/80 focus:border-[#4facfe] outline-none h-60 custom-scrollbar resize-none font-sans"
                      placeholder="Inspiring strategic future outlook..."
                    />
                  </div>

                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#00ff7f] flex items-center gap-2 font-mono">
                      <Target size={14} /> Target Audience Profile
                    </label>
                    <textarea 
                      value={brandKit.targetAudience || ''} 
                      onChange={(e) => setBrandKit({...brandKit, targetAudience: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white/80 focus:border-[#4facfe] outline-none h-60 custom-scrollbar resize-none font-sans"
                      placeholder="Target customer demographic and psychological traits..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  <div className="lg:col-span-12 p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-[24px] space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4facfe]/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-[#4facfe]/10 z-0" />
                    <span className="px-3 py-1 bg-[#4facfe]/10 text-[#4facfe] border border-[#4facfe]/20 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono relative z-10 block w-max">
                      Brand Manifesto
                    </span>
                    <p className="text-[13px] font-sans text-white/70 leading-relaxed max-w-4xl whitespace-pre-wrap relative z-10">
                      {brandKit.manifesto}
                    </p>
                  </div>

                  <div className="lg:col-span-12 xl:col-span-6 p-8 bg-white/[0.02] border border-white/10 rounded-[24px] space-y-4 relative overflow-hidden group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-pink-500/10 text-pink-500 border border-pink-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono">
                          Strategic Vision
                        </span>
                        <Sparkles size={16} className="text-pink-500 opacity-60" />
                      </div>
                      <h4 className="text-lg font-bold uppercase tracking-tight text-white font-mono">
                        Ten-Year North Star
                      </h4>
                      <p className="text-[13px] font-sans text-white/60 leading-relaxed whitespace-pre-wrap">
                        {brandKit.vision}
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-12 xl:col-span-6 p-8 bg-white/[0.02] border border-white/10 rounded-[24px] space-y-4 relative overflow-hidden group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-[#00ff7f]/10 text-[#00ff7f] border border-[#00ff7f]/20 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono">
                          Audience Profile
                        </span>
                        <Target size={16} className="text-[#00ff7f] opacity-60" />
                      </div>
                      <h4 className="text-lg font-bold uppercase tracking-tight text-white font-mono">
                        Core Demographic Focus
                      </h4>
                      <p className="text-[13px] font-sans text-white/60 leading-relaxed whitespace-pre-wrap">
                        {brandKit.targetAudience}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Value Platform & Core Features Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <Sparkles className="text-[#4facfe]" size={20} />
                <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono">Platform Value & Features Offered</h3>
              </div>

              {isEditingBrandKit ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {[...Array(3)].map((_, fIdx) => {
                    const feat = (brandKit.features || [])[fIdx] || { title: '', description: '' };
                    return (
                      <div key={fIdx} className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 font-mono">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#4facfe]">Feature 0{fIdx + 1}</span>
                          <span className="text-[9px] text-white/30">Functional Spec</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-mono">Feature Title</label>
                          <input 
                            type="text" 
                            value={feat.title || ''} 
                            onChange={(e) => {
                              const updatedFeats = [...(brandKit.features || [])];
                              while (updatedFeats.length <= fIdx) {
                                updatedFeats.push({ title: '', description: '' });
                              }
                              updatedFeats[fIdx].title = e.target.value;
                              setBrandKit({...brandKit, features: updatedFeats});
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-[#4facfe] outline-none font-sans"
                            placeholder={`e.g. Core Interactive Sandbox`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-mono block">Feature Description</label>
                          <textarea 
                            value={feat.description || ''} 
                            onChange={(e) => {
                              const updatedFeats = [...(brandKit.features || [])];
                              while (updatedFeats.length <= fIdx) {
                                updatedFeats.push({ title: '', description: '' });
                              }
                              updatedFeats[fIdx].description = e.target.value;
                              setBrandKit({...brandKit, features: updatedFeats});
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/80 focus:border-[#4facfe] outline-none h-24 resize-none font-sans"
                            placeholder={`Brief summary of value provided to the users...`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {(brandKit.features && brandKit.features.length > 0 ? brandKit.features : [
                    { title: 'Interactive Core Sandbox', description: 'Enable creative customers to customize variables and templates directly within the main layout.' },
                    { title: 'Omnisearch Navigation', description: 'Instantly retrieve documentation parameters, design blueprints, and hex codes through hotkeys.' },
                    { title: 'High-Res Compiling Pipeline', description: 'Process dual-channel rasterization formats up to true 4K resolution synchronously.' }
                  ]).slice(0, 3).map((feat, fIdx) => (
                    <div key={fIdx} className="p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-[24px] space-y-3 relative overflow-hidden group hover:border-[#4facfe]/30 hover:bg-white/[0.03] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4facfe]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[#4facfe]/10" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-[#4facfe]/60">0{fIdx + 1}</span>
                        <Zap size={14} className="text-[#4facfe] opacity-30 group-hover:opacity-80 transition-opacity" />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-tight text-white font-mono group-hover:text-[#4facfe] transition-colors">
                        {feat.title || `Interactive Solution 0${fIdx + 1}`}
                      </h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans group-hover:text-white/70 transition-colors">
                        {feat.description || `Core capability suggested to detail specific services provided to active targets.`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Grid Construction Workshops */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 border-t border-b border-white/5 bg-white/[0.01]">
              <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="text-[#4facfe]" size={20} />
                  <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono">Symbol Geometry Workshop</h3>
                </div>

                <div className="aspect-video bg-[#0c0d15] rounded-[32px] border border-white/5 relative flex items-center justify-center overflow-hidden">
                  
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-10 pointer-events-none">
                    {[...Array(48)].map((_, i) => <div key={i} className="border border-white/40" />)}
                  </div>
                  <div className="absolute inset-0 border border-white/5 rounded-[32px] pointer-events-none z-0" />

                  {constructionGrid === 'blueprint' && (
                    <>
                      <div className="absolute w-full h-[1px] bg-sky-500/25 top-1/2 left-0 pointer-events-none z-10" />
                      <div className="absolute h-full w-[1px] bg-sky-500/25 left-1/2 top-0 pointer-events-none z-10" />
                      <div className="absolute border font-mono text-[7px] text-sky-400 border-sky-400/40 rounded-full px-2 py-0.5 pointer-events-none transform -translate-x-12 -translate-y-8 bg-black/60 z-20">
                        ALIGN_CENTER: X[0] Y[0]
                      </div>
                    </>
                  )}

                  {constructionGrid === 'golden' && (
                    <div className="absolute aspect-square w-4/5 border border-purple-500/20 rounded-full pointer-events-none flex items-center justify-center animate-spin-slow z-10">
                      <div className="aspect-square w-3/5 border border-purple-500/20 rounded-full flex items-center justify-center">
                        <div className="aspect-square w-2/5 border border-purple-500/20 rounded-full" />
                      </div>
                    </div>
                  )}

                  {constructionGrid === 'optical' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      <div className="w-[30%] aspect-square border-[1.5px] border-dashed border-[#00ff7f]/45 rounded-full" />
                      <div className="w-[50%] aspect-square border border-dashed border-[#00ff7f]/25 rounded-full" />
                      <div className="absolute h-2/3 w-[1px] border-l border-dashed border-[#00ff7f]/40" />
                      <div className="absolute w-2/3 h-[1px] border-t border-dashed border-[#00ff7f]/40" />
                    </div>
                  )}

                  <div 
                    className="absolute border border-dashed border-red-500/40 flex items-center justify-center rounded-xl pointer-events-none bg-red-500/[0.01] z-20 font-mono"
                    style={{
                      padding: `${logoPadding}px`,
                      width: 'calc(100% - 40px)',
                      height: 'calc(100% - 40px)'
                    }}
                  >
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-wider font-mono font-bold text-red-400 block w-max">
                      Exclusion Boundary: {logoPadding}px
                    </div>
                  </div>

                  <div className="absolute top-4 left-6 text-[8px] uppercase font-mono text-white/30 tracking-widest z-10">
                    Canvas Matrix: 1:1 Safe Block
                  </div>

                  {imageOptions.length > 0 && (
                    <div className="relative p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md z-10">
                      <motion.img 
                        src={imageOptions[selectedImageIndex || 0]?.url} 
                        style={{
                          filter: grayscaleLogo ? 'grayscale(100%) contrast(150%)' : 'drop-shadow(0 0 20px rgba(79,172,254,0.3))',
                          transform: `rotate(${rotatedLogo}deg)`
                        }}
                        className="w-32 h-32 object-contain transition-all" 
                        alt="Corporate Grid Identification Symbol" 
                      />
                      <div className="absolute -inset-2 border border-[#4facfe]/30 rounded pointer-events-none animate-pulse" />
                      <div className="absolute -inset-4 border border-[#4facfe]/10 rounded-md pointer-events-none" />
                    </div>
                  )}

                  <div className="absolute bottom-4 left-6 flex items-center gap-2 font-mono text-[8px] text-[#4facfe] uppercase tracking-wider font-bold bg-black/60 rounded p-1 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe]" />
                    GRID_MODULE_RATIO: 8pt (Mathematical Grid)
                  </div>
                </div>
              </div>

              <div className="lg:col-span-12 xl:col-span-5 space-y-6 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-[#4facfe]/15 text-[#4facfe] border border-[#4facfe]/30 rounded-full text-[9px] font-mono font-black uppercase tracking-widest block w-max">
                    Modular Adjustments
                  </span>
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight font-mono">Grid Tuning Dashboard</h4>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    Calibrate exclusion safe spaces, monochrome contrast rules, and alignment grids to ensure optimal readability.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                      <span className="text-white/40">Safe Margin Exclusion Zone:</span>
                      <span className="text-red-400 font-bold">{logoPadding}px</span>
                    </div>
                    <input 
                      type="range"
                      min="16"
                      max="80"
                      value={logoPadding}
                      onChange={(e) => setLogoPadding(Number(e.target.value))}
                      className="w-full accent-red-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                      <span className="text-white/40">Torsional Logo Alignment:</span>
                      <span className="text-[#4facfe] font-bold">{rotatedLogo}°</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="360"
                      value={rotatedLogo}
                      onChange={(e) => setRotatedLogo(Number(e.target.value))}
                      className="w-full accent-[#4facfe] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] uppercase font-mono text-white/30 font-bold block">Grid Guides</label>
                      <select 
                        value={constructionGrid}
                        onChange={(e) => setConstructionGrid(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#4facfe]"
                      >
                        <option value="none">Disabled</option>
                        <option value="blueprint">Metric Axes</option>
                        <option value="golden">Golden Mean</option>
                        <option value="optical">Optical Rings</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[8px] uppercase font-mono text-white/30 font-bold block">Monochrome Test</label>
                      <button 
                        onClick={() => setGrayscaleLogo(!grayscaleLogo)}
                        className={`w-full text-xs py-1 px-3 border rounded-lg transition-colors font-bold ${grayscaleLogo ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10 hover:bg-white/5'}`}
                      >
                        {grayscaleLogo ? 'TEST: ON' : 'TEST: OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* System Typography layout specimens */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 font-sans">
              <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <Type className="text-[#4facfe]" size={20} />
                  <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono">System Typography Layout</h3>
                </div>

                <div className="p-8 bg-[#0c0d15] rounded-[32px] border border-white/5 space-y-8 text-left">
                  {brandKit.typography.map((font, i) => (
                    <div key={i} className={`space-y-2 ${i === 0 ? 'border-b border-white/5 pb-6' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-white/30 font-bold">{i === 0 ? 'Display Font' : 'Body Paragraph Font'}</span>
                        <span className="text-[9px] font-mono text-[#4facfe] font-bold">{font}</span>
                      </div>
                      
                      <div className="relative overflow-hidden pt-2">
                        <span 
                          style={{ 
                            fontFamily: font,
                            fontSize: i === 0 ? `${typographySize}px` : '14px',
                            fontWeight: i === 0 ? typographyWeight : 'normal'
                          }} 
                          className="text-white block leading-tight truncate px-1"
                        >
                          {typographyTestText || font}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3 text-left">
                  <h4 className="text-[9px] uppercase font-bold tracking-widest text-[#4facfe] font-mono">Interactive Specimen Playground</h4>
                  <input 
                    type="text" 
                    value={typographyTestText}
                    onChange={(e) => setTypographyTestText(e.target.value)}
                    placeholder="Test your custom brand layout specimen here..."
                    className="w-full bg-transparent border-b border-white/10 py-1.5 text-xs outline-none focus:border-[#4facfe] text-white transition-colors"
                  />
                </div>
              </div>

              <div className="lg:col-span-12 xl:col-span-5 space-y-6 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-[#4facfe]/15 text-[#4facfe] border border-[#4facfe]/30 rounded-full text-[9px] font-mono font-black uppercase tracking-widest block w-max">
                    Type Curation
                  </span>
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight font-mono">Typography Pairings Customizer</h4>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    Live edit primary Display fonts and body fonts. The playground will automatically download and inject the fonts from the Google Fonts CDN live!
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 font-bold">1. Heading display font</label>
                    <select 
                      value={brandKit.typography[0] || 'Space Grotesk'}
                      onChange={(e) => {
                        const head = e.target.value;
                        const newFonts = [head, brandKit.typography[1] || 'Inter'];
                        setBrandKit({ ...brandKit, typography: newFonts });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#4facfe]"
                    >
                      {CURATED_FONTS.map(f => (<option key={f.name} value={f.name}>{f.name}</option>))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 font-bold">2. Body text paragraph font</label>
                    <select 
                      value={brandKit.typography[1] || 'Inter'}
                      onChange={(e) => {
                        const body = e.target.value;
                        const newFonts = [brandKit.typography[0] || 'Space Grotesk', body];
                        setBrandKit({ ...brandKit, typography: newFonts });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#4facfe]"
                    >
                      {CURATED_FONTS.map(f => (<option key={f.name} value={f.name}>{f.name}</option>))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase font-mono text-white/40 font-bold">
                      <span>Specimen Heading Size:</span>
                      <span className="text-[#4facfe] font-bold">{typographySize}px</span>
                    </div>
                    <input 
                      type="range"
                      min="32"
                      max="96"
                      value={typographySize}
                      onChange={(e) => setTypographySize(Number(e.target.value))}
                      className="w-full accent-[#4facfe] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-white/40 font-bold">Heading Weight</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['300', '400', '500', '700'].map(w => (
                        <button 
                          key={w} 
                          onClick={() => setTypographyWeight(w as any)}
                          className={`py-1 rounded text-[10px] font-bold ${typographyWeight === w ? 'bg-[#4facfe] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                        >
                          {w === '300' ? 'Light' : w === '400' ? 'Book' : w === '500' ? 'Medium' : 'Bold'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Chromatic Matrix & Accessibility Healer */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-b border-white/5 py-12 bg-white/[0.01]">
              <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <Palette className="text-[#4facfe]" size={20} />
                  <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono">Chromatic DNA Matrix</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...palette, ...(brandKit.secondaryColors || [])].slice(0, 4).map((c, i) => {
                    const scoreLight = getContrastRatio(c, '#ffffff');
                    const isAA_Light = scoreLight >= (contrastLevel === 'AAA' ? 7.0 : 4.5);
                    const scoreDark = getContrastRatio(c, '#090a0f');
                    const isAA_Dark = scoreDark >= (contrastLevel === 'AAA' ? 7.0 : 4.5);

                    return (
                      <div key={i} className="bg-[#0c0d15] border border-white/5 rounded-2xl p-4 space-y-4 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase font-mono text-white/30">{i === 0 ? 'Primary shade' : `Auxiliary Accent 0${i}`}</span>
                          <button 
                            onClick={() => copyToClipboard(c)} 
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </div>

                        <div className="h-10 rounded-xl border border-white/10" style={{ backgroundColor: c }} />

                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-white/40 font-bold">Contrast (on white):</span>
                            <span className={isAA_Light ? 'text-[#00ff7f]' : 'text-red-400'}>
                              {scoreLight.toFixed(1)}:1 ({isAA_Light ? 'Pass' : 'Fail'})
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-white/40 font-bold">Contrast (on dark):</span>
                            <span className={isAA_Dark ? 'text-[#00ff7f]' : 'text-red-400'}>
                              {scoreDark.toFixed(1)}:1 ({isAA_Dark ? 'Pass' : 'Fail'})
                            </span>
                          </div>

                          {(!isAA_Light && !isAA_Dark) && (
                            <button 
                              onClick={() => {
                                const healed = autoHealContrast(c, '#090a0f', contrastLevel);
                                const updatedPalette = [...palette];
                                if (i < updatedPalette.length) {
                                  updatedPalette[i] = healed;
                                  handlePaletteChange(updatedPalette);
                                }
                              }}
                              className="w-full mt-2 py-1 bg-[#4facfe]/10 hover:bg-[#4facfe]/20 border border-[#4facfe]/20 text-[9px] font-bold rounded text-[#4facfe] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Sparkles size={11} /> Auto-heal Accent {i}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-[#ffffff]/10 rounded-2xl flex-col sm:flex-row gap-4">
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-white uppercase font-mono">WCAG Compliance Audit Policy</div>
                    <p className="text-[9px] text-white/40 leading-normal max-w-sm">
                      Compliance enforces minimum text ratios (AA 4.5:1, AAA 7:1) over active layout banners.
                    </p>
                  </div>
                  <div className="flex gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
                    {['AA', 'AAA'].map(lvl => (
                      <button 
                        key={lvl}
                        onClick={() => setContrastLevel(lvl as any)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${contrastLevel === lvl ? 'bg-[#4facfe] text-white' : 'text-white/40 hover:text-white'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-12 xl:col-span-5 space-y-6 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-[#4facfe]/15 text-[#4facfe] border border-[#4facfe]/30 rounded-full text-[9px] font-mono font-black uppercase tracking-widest block w-max">
                    Chromatic Audit
                  </span>
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight font-mono">Contrast & Shade Healer</h4>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    Evaluates hex values mathematically to ensure complete web readability. Click "Heal" to automatically optimize out-of-spec colors instantly!
                  </p>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-mono text-white/40 block">Interactive Color Shuffler</span>
                    <p className="text-xs text-white/60 font-sans">
                      Shuffle or rotate active swatches to sample alternative brand aesthetics instantly.
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      const shuffled = [...palette].sort(() => Math.random() - 0.5);
                      handlePaletteChange(shuffled);
                    }}
                    className="w-full py-2.5 bg-[#4facfe]/10 hover:bg-[#4facfe]/20 border border-[#4facfe]/30 text-[#4facfe] text-[10px] uppercase font-mono font-bold rounded-xl tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} /> Shuffle Spectrum Palette
                  </button>
                </div>
              </div>
            </section>

            {/* Logic Rules Always/Never */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-[#4facfe]" size={20} />
                 <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono font-bold">System Logic & Compliance Voice</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="p-6 bg-[#00ff7f]/5 border border-[#00ff7f]/10 rounded-[24px] space-y-4 text-left">
                  <h4 className="text-[10px] uppercase font-mono font-black tracking-widest text-[#00ff7f]">Mandatory Executions (Always Do)</h4>
                  {isEditingBrandKit ? (
                    <div className="space-y-2">
                      {(brandKit.usageRules?.do || []).map((rule, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            value={rule}
                            onChange={(e) => {
                              const newDo = [...(brandKit.usageRules?.do || [])];
                              newDo[idx] = e.target.value;
                              setBrandKit({
                                ...brandKit,
                                usageRules: {
                                  ...(brandKit.usageRules || { dont: [] }),
                                  do: newDo
                                }
                              });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#00ff7f]/50"
                          />
                          <button 
                            onClick={() => {
                              const newDo = (brandKit.usageRules?.do || []).filter((_, i) => i !== idx);
                              setBrandKit({
                                ...brandKit,
                                usageRules: {
                                  ...(brandKit.usageRules || { dont: [] }),
                                  do: newDo
                                }
                              });
                            }}
                            className="text-white/20 hover:text-red-400 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          setBrandKit({
                            ...brandKit,
                            usageRules: {
                              ...(brandKit.usageRules || { dont: [] }),
                              do: [...(brandKit.usageRules?.do || []), '']
                            }
                          });
                        }}
                        className="text-[10px] uppercase font-bold text-[#00ff7f]/60 hover:text-[#00ff7f] flex items-center gap-1 mt-2 font-mono font-bold"
                      >
                        <Plus size={12} /> Add Rule
                      </button>
                    </div>
                  ) : (
                    <ul className="text-[13px] text-white/50 space-y-2.5 list-disc pl-4 leading-relaxed font-sans">
                      {(brandKit.usageRules?.do || []).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>

                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[24px] space-y-4 text-left">
                  <h4 className="text-[10px] uppercase font-mono font-black tracking-widest text-red-400">Restricted Executions (Never Do)</h4>
                  {isEditingBrandKit ? (
                    <div className="space-y-2">
                      {(brandKit.usageRules?.dont || []).map((rule, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            value={rule}
                            onChange={(e) => {
                              const newDont = [...(brandKit.usageRules?.dont || [])];
                              newDont[idx] = e.target.value;
                              setBrandKit({
                                ...brandKit,
                                usageRules: {
                                  ...(brandKit.usageRules || { do: [] }),
                                  dont: newDont
                                }
                              });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-400/50"
                          />
                          <button 
                            onClick={() => {
                              const newDont = (brandKit.usageRules?.dont || []).filter((_, i) => i !== idx);
                              setBrandKit({
                                ...brandKit,
                                usageRules: {
                                  ...(brandKit.usageRules || { do: [] }),
                                  dont: newDont
                                }
                              });
                            }}
                            className="text-white/20 hover:text-red-400 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          setBrandKit({
                            ...brandKit,
                            usageRules: {
                              ...(brandKit.usageRules || { do: [] }),
                              dont: [...(brandKit.usageRules?.dont || []), '']
                            }
                          });
                        }}
                        className="text-[10px] uppercase font-bold text-red-400/60 hover:text-red-400 flex items-center gap-1 mt-2 font-mono font-bold"
                      >
                        <Plus size={12} /> Add Restriction
                      </button>
                    </div>
                  ) : (
                    <ul className="text-[13px] text-white/50 space-y-2.5 list-disc pl-4 leading-relaxed font-sans">
                      {(brandKit.usageRules?.dont || []).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* Unified Multi-Environment Code Export */}
            <section className="space-y-8 text-left">
              <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div className="flex items-center gap-3">
                  <FileCode className="text-[#4facfe]" size={20} />
                  <h3 className="text-[11px] uppercase font-bold tracking-widest opacity-40 font-mono font-bold">Unified Developer Token Integration</h3>
                </div>
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                  {['tailwind', 'css', 'swift', 'kotlin', 'json'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setCodeTargetType(type as any)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono ${codeTargetType === type ? 'bg-[#4facfe] text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0c0d15] border border-white/5 rounded-2xl p-6 font-mono relative group text-left">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        const code = codeTargetType === 'tailwind' ? 
`{
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "${palette[0] || '#4facfe'}",
          accent: "${palette[1] || '#ffffff'}",
          secondary: "${brandKit.secondaryColors?.[0] || '#334155'}",
        }
      },
      fontFamily: {
        display: ["${brandKit.typography[0]}"],
        body: ["${brandKit.typography[1]}"],
      }
    }
  }
}` : codeTargetType === 'css' ?
`:root {
  --brand-primary: ${palette[0] || '#4facfe'};
  --brand-accent: ${palette[1] || '#ffffff'};
  --brand-font-display: "${brandKit.typography[0]}";
  --brand-font-body: "${brandKit.typography[1]}";
  --brand-radius: 16px;
  --brand-shadow: 0 10px 40px rgba(0,0,0,0.4);
}` : codeTargetType === 'swift' ?
`struct BrandTheme {
    static let primary = Color(hex: "${palette[0] || "#4facfe"}")
    static let accent = Color(hex: "${palette[1] || "#ffffff"}")
    static let displayFont = "${brandKit.typography[0]}"
    static let bodyFont = "${brandKit.typography[1]}"
}` : codeTargetType === 'kotlin' ?
`object BrandTheme {
    val Primary = Color(0xFF${(palette[0] || "#4facfe").replace('#', '')})
    val Accent = Color(0xFF${(palette[1] || "#ffffff").replace('#', '')})
    val DisplayFontName = "${brandKit.typography[0]}"
    val BodyFontName = "${brandKit.typography[1]}"
}` : 
`{
  "name": "${description.trim().substring(0,25) || 'Identity'}",
  "tokens": {
    "primary": "${palette[0] || '#4facfe'}",
    "accent": "${palette[1] || '#ffffff'}",
    "typography": {
      "display": "${brandKit.typography[0]}",
      "body": "${brandKit.typography[1]}"
    }
  }
}`;
                        copyToClipboard(code);
                      }}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white"
                      title="Copy Tokens"
                    >
                      {copyStatus === 'copied' ? "Copied!" : <Copy size={14} />}
                    </button>
                  </div>
                  
                  <pre className="text-[11px] text-[#4facfe]/80 leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar">
{codeTargetType === 'tailwind' && 
`{
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "${palette[0] || '#4facfe'}",
          accent: "${palette[1] || '#ffffff'}",
          secondary: "${brandKit.secondaryColors?.[0] || '#334155'}",
        }
      },
      fontFamily: {
        display: ["${brandKit.typography[0]}"],
        body: ["${brandKit.typography[1]}"],
      }
    }
  }
}`
}
{codeTargetType === 'css' && 
`:root {
  --brand-primary: ${palette[0] || '#4facfe'};
  --brand-accent: ${palette[1] || '#ffffff'};
  --brand-font-display: "${brandKit.typography[0]}";
  --brand-font-body: "${brandKit.typography[1]}";
  --brand-radius: 16px;
  --brand-shadow: 0 10px 40px rgba(0,0,0,0.4);
}`
}
{codeTargetType === 'swift' &&
`struct BrandTheme {
    static let primary = Color(hex: "${palette[0] || "#4facfe"}")
    static let accent = Color(hex: "${palette[1] || "#ffffff"}")
    static let displayFont = "${brandKit.typography[0]}"
    static let bodyFont = "${brandKit.typography[1]}"
}`
}
{codeTargetType === 'kotlin' &&
`object BrandTheme {
    val Primary = Color(0xFF${(palette[0] || "#4facfe").replace('#', '')})
    val Accent = Color(0xFF${(palette[1] || "#ffffff").replace('#', '')})
    val DisplayFontName = "${brandKit.typography[0]}"
    val BodyFontName = "${brandKit.typography[1]}"
}`
}
{codeTargetType === 'json' &&
`{
  "name": "${description.trim().substring(0,25) || 'Identity'}",
  "tokens": {
    "primary": "${palette[0] || '#4facfe'}",
    "accent": "${palette[1] || '#ffffff'}",
    "typography": {
      "display": "${brandKit.typography[0]}",
      "body": "${brandKit.typography[1]}"
    }
  }
}`
}
                  </pre>
                </div>

                <button 
                  onClick={downloadFullBundle}
                  disabled={isExporting}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider font-bold shadow-lg"
                >
                  {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  {isExporting ? 'Packaging Brand Bundle...' : 'Download Full Brand Identity (.zip)'}
                </button>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
