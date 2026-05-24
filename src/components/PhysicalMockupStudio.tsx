import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Move, 
  Paintbrush, 
  Grid, 
  Layers, 
  Info,
  Check,
  Maximize2
} from 'lucide-react';

interface PhysicalMockupStudioProps {
  logoUrl: string;
  palette: string[];
  slogan?: string;
}

export function PhysicalMockupStudio({ logoUrl, palette, slogan }: PhysicalMockupStudioProps) {
  // Available Product templates
  const [activeProduct, setActiveProduct] = useState<'shirt' | 'mug' | 'billboard'>('shirt');
  
  // Custom fabric / material color
  const defaultColor = palette && palette.length > 0 ? palette[0] : '#0e1726';
  const [productColor, setProductColor] = useState<string>(defaultColor);
  
  // Interactive CSS Transform States
  const [logoScale, setLogoScale] = useState<number>(0.35);
  const [logoX, setLogoX] = useState<number>(0);
  const [logoY, setLogoY] = useState<number>(-20);
  const [logoRotate, setLogoRotate] = useState<number>(0);
  const [logoSkewX, setLogoSkewX] = useState<number>(0);
  const [logoSkewY, setLogoSkewY] = useState<number>(0);
  const [logoOpacity, setLogoOpacity] = useState<number>(1);
  const [blendMode, setBlendMode] = useState<string>('normal');
  const [shadingIntensity, setShadingIntensity] = useState<number>(0.65);
  
  // Show / Hide guides
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [showBlueprintGrid, setShowBlueprintGrid] = useState<boolean>(false);
  
  // Drag states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startLogoPos = useRef({ x: 0, y: 0 });
  const viewAreaRef = useRef<HTMLDivElement>(null);

  // Sync picked color with palette changes
  useEffect(() => {
    if (palette && palette.length > 0) {
      setProductColor(palette[0]);
    }
  }, [palette]);

  // Handle resets
  const resetTransforms = () => {
    setLogoScale(0.35);
    setLogoX(0);
    setLogoY(activeProduct === 'shirt' ? -20 : activeProduct === 'mug' ? 0 : 0);
    setLogoRotate(0);
    setLogoSkewX(0);
    setLogoSkewY(0);
    setLogoOpacity(1);
    setBlendMode(activeProduct === 'shirt' ? 'multiply' : activeProduct === 'mug' ? 'multiply' : 'normal');
  };

  // Adjust default offsets on product switch
  useEffect(() => {
    if (activeProduct === 'shirt') {
      setLogoScale(0.32);
      setLogoX(0);
      setLogoY(-40);
      setBlendMode('multiply');
    } else if (activeProduct === 'mug') {
      setLogoScale(0.24);
      setLogoX(0);
      setLogoY(10);
      setBlendMode('multiply');
    } else if (activeProduct === 'billboard') {
      setLogoScale(0.4);
      setLogoX(0);
      setLogoY(-20);
      setBlendMode('normal');
    }
  }, [activeProduct]);

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startLogoPos.current = { x: logoX, y: logoY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    // Scale tracking speed depending on actual physical pixel size
    const speedFactor = 1.0; 
    setLogoX(startLogoPos.current.x + deltaX * speedFactor);
    setLogoY(startLogoPos.current.y + deltaY * speedFactor);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch handlers for mobile/preview gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startLogoPos.current = { x: logoX, y: logoY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartPos.current.x;
    const deltaY = e.touches[0].clientY - dragStartPos.current.y;
    setLogoX(startLogoPos.current.x + deltaX);
    setLogoY(startLogoPos.current.y + deltaY);
  };

  // Helper styles for transformations
  const appliedTransform = `translate(${logoX}px, ${logoY}px) scale(${logoScale}) rotate(${logoRotate}deg) skewX(${logoSkewX}deg) skewY(${logoSkewY}deg)`;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-8 text-left text-white overflow-hidden p-[2px]">
      
      {/* 1. Main Interactive Viewport Canvas */}
      <div className="flex-1 flex flex-col bg-[#0b0c13] border border-white/5 rounded-3xl overflow-hidden relative min-h-[480px]">
        
        {/* Absolute Background Accent lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,172,254,0.06)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Blueprint Grid system overlay style */}
        {showBlueprintGrid && (
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-15 pointer-events-none z-0 border border-white/5">
            {[...Array(144)].map((_, idx) => (
              <div key={idx} className="border-[0.5px] border-dashed border-white/20" />
            ))}
          </div>
        )}

        {/* Viewport Top Information HUD */}
        <div className="absolute top-4 left-6 z-20 flex flex-col gap-1 font-mono pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest text-[#4facfe] font-black">
            Physical Mockup Pipeline // V.24
          </span>
          <span className="text-[10px] text-white/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff7f] animate-pulse" />
            Interactive CSS Warp rendering is ACTIVE
          </span>
        </div>

        {/* Viewport Top Right Mode Actions */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setShowBlueprintGrid(!showBlueprintGrid)}
            className={`p-2 rounded-xl border transition-all ${showBlueprintGrid ? 'bg-[#4facfe]/20 border-[#4facfe] text-[#4facfe]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            title="Toggle Blueprint Matrix Overlay"
          >
            <Grid size={15} />
          </button>
          <button 
            type="button"
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={`p-2 rounded-xl border transition-all ${showSafeZone ? 'bg-[#4facfe]/20 border-[#4facfe] text-[#4facfe]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            title="Toggle Safe Alignment Boundaries"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Viewport Canvas container */}
        <div 
          ref={viewAreaRef}
          className="flex-1 w-full flex items-center justify-center relative p-8 select-none"
        >
          <AnimatePresence mode="wait">
            
            {/* PRODUCT A: PREMIER COMBED FABRIC T-SHIRT */}
            {activeProduct === 'shirt' && (
              <motion.div
                key="shirt-product"
                initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.95, rotate: 2 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-[380px] aspect-[4/5] flex items-center justify-center"
              >
                {/* 1. Underlying Base T-Shirt using detailed SVG Vector mask */}
                <svg className="absolute inset-0 w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.65)]" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    {/* SVG Mask strictly applied to keep the logo restricted to raw clothing surface */}
                    <mask id="shirt-mask">
                      <path d="M70 110 C90 95, 140 85, 200 85 C260 85, 310 95, 330 110 L370 170 C380 185, 360 215, 330 200 L315 192 L320 440 C320 460, 290 470, 200 470 C110 470, 80 460, 80 440 L85 192 L70 200 C40 215, 20 185, 30 170 Z" fill="white" />
                    </mask>
                    {/* Fabric shading crease overlay utilizing custom SVG multi-stop dynamic filter */}
                    <linearGradient id="shading-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                      <stop offset="35%" stopColor="#000000" stopOpacity="0.30" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
                      <stop offset="68%" stopColor="#000000" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.60" />
                    </linearGradient>
                  </defs>

                  {/* Colored T-shirt shape base */}
                  <path 
                    d="M70 110 C90 95, 140 85, 200 85 C260 85, 310 95, 330 110 L370 170 C380 185, 360 215, 330 200 L315 192 L320 440 C320 460, 290 470, 200 470 C110 470, 80 460, 80 440 L85 192 L70 200 C40 215, 20 185, 30 170 Z" 
                    fill={productColor} 
                    className="transition-colors duration-300" 
                  />
                  
                  {/* Neckline Collar definition */}
                  <path d="M140 86 C160 110, 240 110, 260 86" stroke="rgba(255,255,255,0.18)" strokeWidth="4" fill="none" />
                  <path d="M140 86 C160 106, 240 106, 260 86" stroke="rgba(0,0,0,0.25)" strokeWidth="3" fill="none" />
                </svg>

                {/* 2. Scaled / Positioned / Weighted Interactive Logo Layer inside SVG Clipping Frame */}
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing z-10"
                  style={{ clipPath: 'polygon(17% 22%, 83% 22%, 80% 88%, 20% 88%)' }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {/* Safe Boundaries Line Overlay */}
                  {showSafeZone && (
                     <div className="absolute inset-0 border-[1.5px] border-dashed border-red-500/25 rounded-2xl flex items-center justify-center m-12 pointer-events-none">
                        <span className="absolute top-1 text-[7px] font-mono tracking-widest text-red-500/50 uppercase">
                          Safe Graphics Box: 350x450mm
                        </span>
                     </div>
                  )}

                  <div 
                    className="w-full h-full flex items-center justify-center transition-transform duration-75 select-none"
                    style={{ 
                      transform: appliedTransform,
                      mixBlendMode: blendMode as any,
                      opacity: logoOpacity
                    }}
                  >
                    <img 
                      src={logoUrl} 
                      className="w-44 h-44 object-contain pointer-events-none drop-shadow-md select-none" 
                      alt="Logo Mocking preview" 
                    />
                  </div>
                </div>

                {/* 3. High-Fidelity SVG Fabric creasing, wrinkling & shadow layer positioned strictly above the logo logo */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay z-15" viewBox="0 0 400 500" fill="none">
                  {/* Crease overlay representation */}
                  <path 
                    d="M70 110 C90 95, 140 85, 200 85 C260 85, 310 95, 330 110 L370 170 C380 185, 360 215, 330 200 L315 192 L320 440 C320 460, 290 470, 200 470 C110 470, 80 460, 80 440 L85 192 L70 200 C40 215, 20 185, 30 170 Z" 
                    fill="url(#shading-grad)" 
                    style={{ opacity: shadingIntensity }} 
                  />
                  {/* Fine shadow/wrinkle lines */}
                  <path d="M120 160 C140 180, 180 185, 190 220" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" className="filter blur-[1px]" />
                  <path d="M290 190 C260 200, 250 230, 240 270" stroke="rgba(0,0,0,0.25)" strokeWidth="3" fill="none" className="filter blur-[1.5px]" />
                  <path d="M105 310 C140 290, 150 330, 170 380" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" className="filter blur-[1px]" />
                </svg>
              </motion.div>
            )}

            {/* PRODUCT B: STUDIO CERAMIC COFFEE MUG */}
            {activeProduct === 'mug' && (
              <motion.div
                key="mug-product"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-[340px] aspect-square flex items-center justify-center"
              >
                {/* 1. Underlying Base Mug using vector SVG coordinates */}
                <svg className="absolute inset-0 w-full h-full drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    {/* Linear gradient to replicate clean cylindrical shadows around mug left/right borders */}
                    <linearGradient id="mug-shading" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
                      <stop offset="4%" stopColor="#000000" stopOpacity="0.25" />
                      <stop offset="15%" stopColor="#ffffff" stopOpacity="0.2" />
                      <stop offset="35%" stopColor="#ffffff" stopOpacity="0.0" />
                      <stop offset="75%" stopColor="#000000" stopOpacity="0.0" />
                      <stop offset="96%" stopColor="#000000" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
                    </linearGradient>
                    {/* Highlights for metallic or glossy ceramic finish */}
                    <linearGradient id="mug-glare" x1="0%" y1="0%" x2="120%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                      <stop offset="15%" stopColor="#ffffff" stopOpacity="0.0" />
                      <stop offset="50%" stopColor="#000000" stopOpacity="0.2" />
                      <stop offset="85%" stopColor="#ffffff" stopOpacity="0.0" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Mug Handle */}
                  <path 
                    d="M270 120 C325 120, 360 170, 340 230 C325 270, 270 270, 270 270" 
                    stroke={productColor} 
                    strokeWidth="34" 
                    strokeLinecap="round" 
                    fill="none" 
                    className="transition-colors duration-300 filter drop-shadow-md"
                  />
                  {/* Handle outline highlight for depth */}
                  <path 
                    d="M270 127 C315 127, 342 170, 327 220 C315 255, 270 255, 270 255" 
                    stroke="rgba(255,255,255,0.15)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    fill="none" 
                  />

                  {/* Mug Body Cylinder */}
                  <rect 
                    x="90" 
                    y="80" 
                    width="190" 
                    height="240" 
                    rx="28" 
                    fill={productColor} 
                    className="transition-colors duration-300"
                  />
                  {/* Inner Mug Mouth shadow */}
                  <ellipse cx="185" cy="80" rx="95" ry="14" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </svg>

                {/* 2. Scaled / Configured Logo overlay inside cylindrical bounding box mask */}
                <div 
                  className="absolute p-4 overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing z-10"
                  style={{ 
                    top: '86px', 
                    left: '94px', 
                    width: '182px', 
                    height: '228px',
                    clipPath: 'inset(4px 4px 10px 4px rounded 14px)'
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {/* Safe Boundaries Line Overlay */}
                  {showSafeZone && (
                     <div className="absolute inset-x-2 inset-y-8 border-[1.2px] border-dashed border-red-500/35 rounded-xl flex items-center justify-center pointer-events-none">
                        <span className="absolute bottom-2 text-[6.5px] font-mono tracking-wider text-red-500/60 uppercase">
                          Safe Wrapping Area
                        </span>
                     </div>
                  )}

                  <div 
                    className="w-full h-full flex items-center justify-center transition-transform duration-75"
                    style={{ 
                      transform: appliedTransform,
                      mixBlendMode: blendMode as any,
                      opacity: logoOpacity
                    }}
                  >
                    <img 
                      src={logoUrl} 
                      className="w-32 h-32 object-contain pointer-events-none select-none" 
                      style={{
                        // Real-time cylindrical perspective emulation styling
                        filter: `blur(0.25px) drop-shadow(0 4px 8px rgba(0,0,0,0.15))`
                      }}
                      alt="Logo on Ceramic" 
                    />
                  </div>
                </div>

                {/* 3. Surface cylinder Shading Glare and gradient values overlaid */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-15" viewBox="0 0 400 400" fill="none">
                  {/* Mug Body shading overlay with matching curvature */}
                  <rect 
                    x="90" 
                    y="80" 
                    width="190" 
                    height="240" 
                    rx="28" 
                    fill="url(#mug-shading)" 
                    style={{ opacity: shadingIntensity + 0.15 }}
                  />
                  <rect 
                    x="90" 
                    y="80" 
                    width="190" 
                    height="240" 
                    rx="28" 
                    fill="url(#mug-glare)" 
                    style={{ opacity: shadingIntensity }}
                  />
                  {/* Shiny top light indicator */}
                  <ellipse cx="185" cy="81" rx="93" ry="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
                </svg>
              </motion.div>
            )}

            {/* PRODUCT C: HIGH-PERSPECTIVE HIGHWAY BILLBOARD */}
            {activeProduct === 'billboard' && (
              <motion.div
                key="billboard-product"
                initial={{ opacity: 0, scale: 0.98, rotateX: -10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.98, rotateX: 10 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-[460px] h-[320px] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10"
              >
                {/* Real physical architectural background from unsplash for ultimate high-fashion brutalist realism */}
                <img 
                  src="https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=1000" 
                  className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]" 
                  alt="City Backdrop"
                />
                
                {/* SVG Scaffold for steel frame / border shadow overlay for billboard perspective */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

                {/* The Poster canvas bounded by dynamic structural columns */}
                <div 
                  className="absolute bg-neutral-900 border-[1.5px] border-neutral-700 shadow-inner overflow-hidden shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing z-10 font-mono"
                  style={{
                    // Hardcoded perspective transformation simulating isometric highway view angles
                    top: '12%',
                    left: '12%',
                    width: '76%',
                    height: '58%',
                    transform: 'perspective(600px) rotateY(-8deg) rotateX(4deg) skewY(-2deg)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9), 0 15px 35px rgba(0,0,0,0.5)'
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {/* Subtle paper grain / ambient pattern on poster background */}
                  <div className="absolute inset-0 bg-neutral-900 opacity-95 transition-colors duration-300" style={{ backgroundColor: productColor }} />
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-[0.06] pointer-events-none" />

                  {/* Slogan details on poster */}
                  {slogan && (
                    <span className="absolute bottom-4 left-6 text-[8px] uppercase tracking-[0.25em] text-white/40 block font-bold max-w-[70%]">
                      {slogan}
                    </span>
                  )}

                  <span className="absolute top-4 right-6 text-[7px] font-mono tracking-widest text-[#4facfe] block font-black uppercase">
                    Outdoor Space 04
                  </span>

                  {/* Safe Boundaries Line Overlay */}
                  {showSafeZone && (
                     <div className="absolute inset-4 border-[1px] border-dashed border-red-500/30 flex items-center justify-center pointer-events-none">
                        <span className="absolute top-1 right-2 text-[6px] font-mono tracking-widest text-red-500/50 uppercase">
                          Safe Area
                        </span>
                     </div>
                  )}

                  {/* The interactive Logo element inside poster */}
                  <div 
                    className="w-full h-full flex items-center justify-center transition-transform duration-75"
                    style={{ 
                      transform: appliedTransform,
                      mixBlendMode: blendMode as any,
                      opacity: logoOpacity
                    }}
                  >
                    <img 
                      src={logoUrl} 
                      className="w-36 h-36 object-contain pointer-events-none drop-shadow-lg select-none" 
                      alt="Logo billboard poster display" 
                    />
                  </div>

                  {/* Billboard lighting/glare layer overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.12] to-white/5" 
                    style={{ opacity: shadingIntensity }}
                  />
                  
                  {/* Soft paper creases or shadows on poster */}
                  <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/45 filter blur-[1px]" />
                  <div className="absolute inset-y-0 left-2/3 w-[1px] bg-white/[0.05] filter blur-[0.5px]" />
                </div>

                {/* Industrial Billboard Scaffold poles underneath */}
                <div className="absolute bottom-0 left-[48%] w-[4%] h-[35%] bg-gradient-to-r from-neutral-800 to-neutral-700 border-t border-neutral-600 shadow" />
                <div className="absolute bottom-10 left-[43%] w-[14%] h-[2px] bg-neutral-800" />
              </motion.div>
            )}

          </AnimatePresence>

          {/* Prompt Drag to Position action floating banner */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/75 backdrop-blur-md rounded-full border border-white/5 flex items-center gap-2 text-[9px] font-mono text-white/50 shadow-lg select-none z-20">
            <Move size={11} className="text-[#4facfe] animate-bounce" />
            <span>Click and drag the logo on mockups directly to reposition</span>
          </div>
        </div>

      </div>

      {/* 2. Interactive Calibration Dashboard Controls */}
      <div className="w-full lg:w-[320px] flex flex-col gap-6 select-none shrink-0">
        
        {/* Product selector buttons */}
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-3">
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#4facfe]">
            Select Mockup Product
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['shirt', 'mug', 'billboard'] as const).map((product) => (
              <button
                key={product}
                type="button"
                onClick={() => setActiveProduct(product)}
                className={`py-2 px-1 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all border ${activeProduct === product ? 'bg-[#4facfe] text-white border-[#4facfe] shadow-lg shadow-[#4facfe]/20' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                {product === 'shirt' ? 'T-Shirt' : product === 'mug' ? 'Mug' : 'Billboard'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic product colorizer */}
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-[#4facfe]">
            <Paintbrush size={14} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Material Colorizer</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-b border-white/5 pb-3">
            {/* Sync option directly using generated palette */}
            {palette && palette.map((color, index) => (
              <button
                key={`${color}-${index}`}
                type="button"
                onClick={() => setProductColor(color)}
                className={`w-7 h-7 rounded-lg border relative transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${productColor === color ? 'border-white scale-105 shadow-inner' : 'border-white/10'}`}
                style={{ backgroundColor: color }}
                title={`Apply Brand Accent Color: ${color}`}
              >
                {productColor === color && <Check size={11} className="text-white filter drop-shadow mix-blend-difference" />}
              </button>
            ))}
            
            {/* Standard White option */}
            <button
              type="button"
              onClick={() => setProductColor('#ffffff')}
              className={`w-7 h-7 rounded-lg border border-white/10 relative bg-white transition-all flex items-center justify-center hover:scale-110 ${productColor === '#ffffff' ? 'border-[#4facfe] ring-2 ring-[#4facfe]/40' : ''}`}
              title="Apply Studio White"
            >
              {productColor === '#ffffff' && <Check size={11} className="text-black" />}
            </button>

            {/* Default Studio Black option */}
            <button
              type="button"
              onClick={() => setProductColor('#0f1016')}
              className={`w-7 h-7 rounded-lg border border-white/10 relative bg-[#0f1016] transition-all flex items-center justify-center hover:scale-110 ${productColor === '#0f1016' ? 'border-[#4facfe] ring-2 ring-[#4facfe]/40' : ''}`}
              title="Apply Deep Charcoal"
            >
              {productColor === '#0f1016' && <Check size={11} className="text-white" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
            <span>Hex Color Code:</span>
            <input 
              type="text" 
              value={productColor} 
              onChange={(e) => setProductColor(e.target.value)}
              className="w-20 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-[#4facfe] font-mono text-center outline-none focus:border-[#4facfe]"
            />
          </div>
        </div>

        {/* Precision CSS Transforms Adjustment sliders */}
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex-1 flex flex-col justify-between gap-4 max-h-[480px] overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 text-white/70">
              <Sliders size={14} className="text-[#4facfe]" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Calibration Hub</span>
            </div>
            <button 
              type="button"
              onClick={resetTransforms}
              className="text-[9px] tracking-wide uppercase font-mono text-white/40 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Logo Dimension / Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>LOGO DIMENSION (SCALE):</span>
                <span className="text-[#4facfe] font-bold">{Math.round(logoScale * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0.1" 
                max="0.9" 
                step="0.01"
                value={logoScale}
                onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                className="w-full accent-[#4facfe] cursor-pointer"
              />
            </div>

            {/* Horizontal Position X */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>HORIZONTAL POS (X-AXIS):</span>
                <span className="text-[#4facfe] font-bold">{logoX}px</span>
              </div>
              <input 
                type="range"
                min="-150" 
                max="150" 
                step="1"
                value={logoX}
                onChange={(e) => setLogoX(parseInt(e.target.value))}
                className="w-full accent-[#4facfe] cursor-pointer"
              />
            </div>

            {/* Vertical Position Y */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>VERTICAL POS (Y-AXIS):</span>
                <span className="text-[#4facfe] font-bold">{logoY}px</span>
              </div>
              <input 
                type="range"
                min="-150" 
                max="150" 
                step="1"
                value={logoY}
                onChange={(e) => setLogoY(parseInt(e.target.value))}
                className="w-full accent-[#4facfe] cursor-pointer"
              />
            </div>

            {/* Rotation slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>ROTATION THETA:</span>
                <span className="text-[#4facfe] font-bold">{logoRotate}°</span>
              </div>
              <input 
                type="range"
                min="-180" 
                max="180" 
                step="1"
                value={logoRotate}
                onChange={(e) => setLogoRotate(parseInt(e.target.value))}
                className="w-full accent-[#4facfe] cursor-pointer"
              />
            </div>

            {/* Perspective Skew parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] font-mono text-white/40 block">SKEW HORIZ:</span>
                <input 
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={logoSkewX}
                  onChange={(e) => setLogoSkewX(parseInt(e.target.value))}
                  className="w-full accent-[#4facfe] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[9px] font-mono text-white/40 block">SKEW VERT:</span>
                <input 
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={logoSkewY}
                  onChange={(e) => setLogoSkewY(parseInt(e.target.value))}
                  className="w-full accent-[#4facfe] cursor-pointer"
                />
              </div>
            </div>

            {/* Logo Opacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>GRAPHIC SOLIDITY (OPACITY):</span>
                <span className="text-[#4facfe] font-bold">{Math.round(logoOpacity * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={logoOpacity}
                onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                className="w-full accent-[#4facfe] cursor-pointer"
              />
            </div>

            {/* Overlaid highlight shading Intensity */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>SHADING OVERLAY GAIN:</span>
                <span className="text-[#4facfe] font-bold">{Math.round(shadingIntensity * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0" 
                max="1.0" 
                step="0.05"
                value={shadingIntensity}
                onChange={(e) => setShadingIntensity(parseFloat(e.target.value))}
                className="w-full accent-[#4facfe] cursor-pointer"
              />
            </div>

            {/* Mix blend modes selector dropdown */}
            <div className="space-y-1.5 text-left border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 text-white/40 font-mono text-[9px] mb-1">
                <Layers size={10} />
                <span>BLEND MODE MATRIX</span>
              </div>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4facfe] font-sans"
              >
                <option value="normal">Normal (Opaque layer)</option>
                <option value="multiply">Multiply (Ink on fabric/ceramic)</option>
                <option value="overlay">Overlay (High contrast blend)</option>
                <option value="screen">Screen (Light emissions)</option>
                <option value="soft-light">Soft Light (Natural mapping)</option>
                <option value="hard-light">Hard Light (Sharp definitions)</option>
                <option value="difference">Difference (Inverted vectors)</option>
              </select>
            </div>

          </div>

          <div className="border-t border-white/5 pt-3 flex items-center gap-2 text-white/40 bg-white/[0.01] p-2.5 rounded-xl border border-dashed border-white/10">
            <Info size={14} className="text-[#4facfe] shrink-0" />
            <p className="text-[8.5px] font-mono leading-relaxed">
              Use standard Blend mode Multiply to simulate organic link texture across mockups.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
