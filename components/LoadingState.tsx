import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Gemini is decoding your image..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        {/* Rotating square instead of smooth circle */}
        <div className="w-20 h-20 border-4 border-black bg-[#4D96FF] animate-[spin_3s_linear_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black bg-[#FFD93D] animate-[spin_2s_linear_infinite_reverse]"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-black bg-[#FF6B6B] animate-pulse"></div>
        </div>
      </div>
      <h3 className="text-2xl font-black text-black uppercase mb-2 bg-white border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_#000]">
        Processing
      </h3>
      <p className="text-black font-bold mt-4 max-w-sm border-2 border-black bg-[#6BCB77] p-2 shadow-[4px_4px_0px_0px_#000]">
        {message}
      </p>
    </div>
  );
};

export default LoadingState;