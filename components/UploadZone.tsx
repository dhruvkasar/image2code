import React, { useCallback, useState } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      } else {
        alert("Please upload an image file.");
      }
    }
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  }, [onFileSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        flex flex-col items-center justify-center 
        w-full h-full min-h-[300px]
        transition-all duration-300 ease-out
        border-4 border-dashed border-black
        ${isDragging 
          ? 'bg-[#4D96FF] scale-[0.98]' 
          : 'bg-[#F0F8FF] hover:bg-[#FFE5B4]'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="flex flex-col items-center space-y-6 text-center p-6 transition-transform duration-300 group-hover:-translate-y-2">
        <div className={`p-6 border-4 border-black shadow-[4px_4px_0px_0px_#000] transition-colors duration-300 ${isDragging ? 'bg-white text-black' : 'bg-[#FFD93D] text-black group-hover:bg-white'}`}>
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase text-black mb-2">
            {isDragging ? 'Drop it like it\'s hot!' : 'Upload Image'}
          </h3>
          <p className="text-black font-medium text-sm max-w-xs mx-auto border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
            Drag & drop or click to browse
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;