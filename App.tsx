import React, { useState, useEffect } from 'react';
import { AppStatus, GenerationResult } from './types';
import { generateCodeFromImage, refineCode } from './services/geminiService';
import { downloadProject, openInStackBlitz } from './utils/projectGenerator';
import UploadZone from './components/UploadZone';
import PreviewWindow from './components/PreviewWindow';
import LoadingState from './components/LoadingState';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleFileSelect = async (file: File) => {
    // Create preview for the uploaded image
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);

    setStatus(AppStatus.ANALYZING);

    try {
      const result: GenerationResult = await generateCodeFromImage(file);
      setGeneratedCode(result.code);
      setStatus(AppStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) return;
    
    // We keep the image preview but switch status to show loading
    const previousStatus = status;
    setStatus(AppStatus.GENERATING); // Re-using generating state for refinement loading

    try {
      const result: GenerationResult = await refineCode(generatedCode, refinementPrompt);
      setGeneratedCode(result.code);
      setRefinementPrompt(''); // Clear input on success
      setStatus(AppStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      // Revert to completed state but maybe show an error toast (simplifying here by just reverting)
      setStatus(AppStatus.COMPLETED); 
      alert("Failed to update code. Please try again.");
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setGeneratedCode('');
    setUploadedImage(null);
    setRefinementPrompt('');
  };

  const handleDownloadZip = async () => {
    try {
      await downloadProject(generatedCode);
    } catch (error) {
      console.error("Failed to generate zip", error);
      alert("Could not generate the zip file.");
    }
  };

  const handleOpenStackBlitz = () => {
    try {
      openInStackBlitz(generatedCode);
    } catch (error) {
      console.error("Failed to open StackBlitz", error);
      alert("Could not open StackBlitz.");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD93D] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter">
              Image<span className="text-[#4D96FF]">2</span>Code
            </h1>
          </div>
          
          <div className="hidden sm:block text-xs font-bold font-mono text-black px-4 py-2 bg-[#6BCB77] border-2 border-black shadow-[4px_4px_0px_0px_#000] rotate-2 hover:rotate-0 transition-transform cursor-default">
             GEMINI 3 PRO ENABLED
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[calc(100vh-140px)] min-h-[600px]">
          
          {/* Left Column: Input */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl border-4 border-black p-6 flex-1 flex flex-col shadow-[12px_12px_0px_0px_#000]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-3 uppercase">
                  <span className="w-4 h-8 bg-[#FF6B6B] border-2 border-black skew-x-[-12deg]"></span>
                  Input Source
                </h2>
                {status !== AppStatus.IDLE && (
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-[#FF6B6B] hover:bg-[#ff5252] text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    RESET
                  </button>
                )}
              </div>

              <div className="flex-1 relative flex flex-col justify-center overflow-hidden rounded-lg bg-slate-50 border-2 border-dashed border-slate-300">
                {uploadedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-[#f0f0f0] pattern-grid-lg">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded Image" 
                      className="max-w-full max-h-full object-contain border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]"
                    />
                    {status === AppStatus.ANALYZING && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <LoadingState message="Gemini is decoding your image..." />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full border-none">
                     <UploadZone onFileSelected={handleFileSelect} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl border-4 border-black p-6 flex-1 flex flex-col shadow-[12px_12px_0px_0px_#000]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-3 uppercase">
                  <span className="w-4 h-8 bg-[#4D96FF] border-2 border-black skew-x-[-12deg]"></span>
                  Live Preview
                </h2>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {status === AppStatus.COMPLETED && (
                    <>
                      <button 
                        onClick={() => setIsFullscreen(true)}
                        className="px-3 py-2 bg-[#FFD93D] hover:bg-[#ffe066] text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center gap-2 text-sm"
                        title="View Fullscreen"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>

                      {/* Open in StackBlitz */}
                      <button 
                        onClick={handleOpenStackBlitz}
                        className="px-3 py-2 bg-[#38BDF8] hover:bg-[#0ea5e9] text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center gap-2 text-sm"
                        title="Open in StackBlitz"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="hidden sm:inline">STACKBLITZ</span>
                      </button>
                      
                      {/* Download ZIP Project */}
                      <button 
                        onClick={handleDownloadZip}
                        className="px-3 py-2 bg-[#C084FC] hover:bg-[#a855f7] text-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center gap-2 text-sm"
                        title="Download Project (ZIP)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">PROJECT</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 relative rounded-lg overflow-hidden bg-slate-100 border-2 border-black min-h-[400px]">
                {status === AppStatus.COMPLETED || status === AppStatus.GENERATING ? (
                  <>
                    <PreviewWindow code={generatedCode} />
                    {status === AppStatus.GENERATING && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                         <LoadingState message="Adding functionality..." />
                      </div>
                    )}
                  </>
                ) : status === AppStatus.ERROR ? (
                   <div className="flex flex-col items-center justify-center h-full text-black p-8 text-center bg-[#FF6B6B]/10">
                      <div className="bg-[#FF6B6B] p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 rounded-full">
                        <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-black uppercase mb-2">Generation Failed</h3>
                      <p className="text-black font-medium border-2 border-black p-2 bg-white inline-block">Gemini hit a snag. Try again.</p>
                   </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                    <div className="w-24 h-24 border-4 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4">
                       <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-400 uppercase">Waiting for image...</p>
                  </div>
                )}
              </div>

              {/* Refinement Input Area - Only shows when code is generated */}
              {status === AppStatus.COMPLETED && (
                <div className="mt-4 animate-in slide-in-from-bottom-4 duration-300">
                  <label className="block text-sm font-bold uppercase mb-2">
                     Add Functionality or Tweak Design:
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      placeholder="e.g. 'Make the buttons click to alert hello', 'Change background to blue'..."
                      className="flex-1 border-2 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-[#4D96FF]/30 shadow-[4px_4px_0px_0px_#e5e7eb] focus:shadow-[4px_4px_0px_0px_#4D96FF]"
                    />
                    <button 
                      onClick={handleRefine}
                      disabled={!refinementPrompt.trim()}
                      className="bg-[#000] text-white px-6 font-bold uppercase tracking-wider hover:bg-[#333] border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_#4D96FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#4D96FF] transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Modal Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 md:p-8 flex flex-col animate-in fade-in duration-200">
           <div className="flex-1 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#4D96FF] relative flex flex-col w-full h-full overflow-hidden">
              {/* Fullscreen Header */}
              <div className="bg-[#4D96FF] border-b-4 border-black p-3 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-white border-2 border-black block shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"></span>
                      <h3 className="font-black font-mono text-white text-lg tracking-wider uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">FULLSCREEN PREVIEW</h3>
                  </div>
                  <button 
                     onClick={() => setIsFullscreen(false)}
                     className="bg-[#FF6B6B] hover:bg-[#ff5252] text-black border-2 border-black p-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all group"
                  >
                     <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                  </button>
              </div>
              {/* Content Container */}
              <div className="flex-1 overflow-hidden relative bg-slate-100">
                  <PreviewWindow code={generatedCode} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;