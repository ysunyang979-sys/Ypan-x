
import React, { useState, useCallback, useRef } from 'react';
import FileList from './FileList';
import { UploadIcon } from './icons/UploadIcon';

interface FileDrivePageProps {
  onLogout: () => void;
}

const FileDrivePage: React.FC<FileDrivePageProps> = ({ onLogout }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
  };

  const handleDeleteFile = useCallback((fileToDelete: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToDelete));
  }, []);

  const handleDownloadFile = useCallback((fileToDownload: File) => {
    const url = URL.createObjectURL(fileToDownload);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileToDownload.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.dataTransfer.files)]);
      e.dataTransfer.clearData();
    }
  };


  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Cloud Drive</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div 
            className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors ${isDragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={triggerFileSelect}
              className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Upload Files
            </button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">or drag and drop files here</p>
            <p className="mt-1 text-xs text-center text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-100 dark:bg-gray-700 rounded-md">
              Note: Files are stored in browser memory and will be lost on page refresh.
            </p>
          </div>
          
          <div className="mt-8">
            <FileList 
              files={files} 
              onDelete={handleDeleteFile} 
              onDownload={handleDownloadFile} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FileDrivePage;
