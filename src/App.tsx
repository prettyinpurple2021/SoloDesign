import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Image as ImageIcon, Loader2, Film, Sparkles, Download, Settings2, KeyRound } from 'lucide-react';

export default function App() {
  const [hasKey, setHasKey] = useState(true);
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationAction, setGenerationAction] = useState<string>('');

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

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
      setImageData(null);
      setImageUrl(null);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A professional company logo. Clean, distinctive, modern. Description: ${description}. White background or transparent-like clean studio setup.` }],
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
        setImageData({ base64: data, mimeType });
        setImageUrl(`data:${mimeType};base64,${data}`);
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

  const animateLogo = async () => {
    if (!imageData) return;
    
    try {
      setIsGeneratingVideo(true);
      setGenerationAction('Initializing video synthesis...');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Animate this logo smoothly and professionally. Add a subtle, dynamic reveal or continuous slow cinematic movement. Ensure it looks high-end. Description context: ${description}`,
        image: {
          imageBytes: imageData.base64,
          mimeType: imageData.mimeType
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      let dotCount = 0;
      while (!operation.done) {
        setGenerationAction(`Rendering animation${'.'.repeat((dotCount % 3) + 1)}`);
        dotCount++;
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        setGenerationAction('Fetching final video file...');
        const response = await fetch(uri, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY as string,
          },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        throw new Error('No video URI returned.');
      }
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

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center relative font-['Helvetica_Neue',Arial,sans-serif]" 
         style={{ 
            backgroundColor: '#0f111a', 
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(100, 149, 237, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(138, 43, 226, 0.3) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(0, 255, 127, 0.2) 0%, transparent 50%)' 
         }}>
      
      <div className="w-full max-w-[1240px] h-full md:h-[800px] max-h-[calc(100vh-2rem)] backdrop-blur-[20px] bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl text-white">
        
        {/* Left Panel: Controls */}
        <div className="w-full md:w-[360px] lg:w-[400px] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col shrink-0 overflow-y-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-3 h-3 rounded-[3px] bg-gradient-to-br from-[#00f2fe] to-[#4facfe]"></div>
            <h1 className="text-[20px] font-extrabold tracking-tight uppercase">LOGOSONIC</h1>
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
                Export Settings
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Format</span>
                  <select
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#4facfe] transition-all appearance-none text-white [&>option]:text-black"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Quality</span>
                  <select
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#4facfe] transition-all appearance-none text-white [&>option]:text-black"
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

            {/* Action Section */}
            <section className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[16px] p-5 flex flex-col mt-auto gap-3">
              <button
                onClick={generateLogo}
                disabled={!description.trim() || isGeneratingImage || isGeneratingVideo}
                className="w-full py-[16px] px-6 bg-white text-black font-semibold rounded-[12px] hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
              >
                {isGeneratingImage ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                {isGeneratingImage ? 'Drafting Render...' : 'Draft Design'}
              </button>

              <button
                onClick={animateLogo}
                disabled={!imageData || isGeneratingVideo || isGeneratingImage}
                className="w-full py-[14px] px-6 bg-[#4facfe]/15 border border-[#4facfe]/50 text-white font-medium rounded-[12px] hover:bg-[#4facfe]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 flex items-center justify-center gap-2 text-[14px]"
              >
                {isGeneratingVideo ? <Loader2 className="animate-spin" size={18} /> : <Film size={18} />}
                {isGeneratingVideo ? 'Rendering...' : 'Generate Motion'}
              </button>
            </section>
          </div>
        </div>

        {/* Right Panel: Output & Preview */}
        <div className="flex-1 p-6 relative flex flex-col min-h-0 bg-black/10">
          <div className="w-full h-full bg-black/20 rounded-[20px] border border-white/5 flex flex-col relative overflow-hidden">
            
            <div className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-[14px] uppercase tracking-[2px] text-white/50">{videoUrl ? 'Final_Render.mp4' : imageUrl ? 'Draft_04_Render.png' : 'Awaiting_Prompt...'}</h2>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-md"></div>
                <div className="w-8 h-8 bg-white/10 rounded-md"></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {(isGeneratingImage || isGeneratingVideo) ? (
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
                    <div className="px-5 py-2.5 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-full text-[12px] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#00ff7f] shadow-[0_0_10px_#00ff7f] animate-pulse"></div>
                      {generationAction}
                    </div>
                  </motion.div>
                ) : videoUrl ? (
                  <motion.div 
                    key="video-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center z-10 relative"
                  >
                    <div className="relative flex items-center justify-center w-full h-full overflow-hidden rounded-[20px] p-2">
                      <video 
                        src={videoUrl} 
                        autoPlay 
                        loop 
                        controls
                        className={`max-w-full max-h-full rounded-[12px] drop-shadow-2xl ${aspectRatio === '16:9' ? 'w-full object-contain' : 'h-full object-contain'}`}
                      />
                    </div>
                    <a 
                      href={videoUrl}
                      download="animated-logo.mp4"
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-[10px] border border-white/20 hover:bg-white/20 rounded-full text-sm font-semibold transition-colors shadow-xl"
                    >
                      <Download size={16} /> Download Delivery
                    </a>
                  </motion.div>
                ) : imageUrl ? (
                   <motion.div 
                    key="image-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex items-center justify-center z-10 p-6 relative"
                  >
                    <img 
                      src={imageUrl} 
                      alt="Generated Logo" 
                      className="object-contain max-h-full max-w-full rounded-[24px] shadow-2xl"
                    />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-full text-[12px] flex items-center gap-2 text-white/90 shadow-xl">
                        Standby for Motion Processing...
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
              {(isGeneratingImage || isGeneratingVideo) && (
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

