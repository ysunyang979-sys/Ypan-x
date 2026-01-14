
import React, { useState, useCallback, useRef, useEffect } from 'react';
import FileList from './FileList';
import { UploadIcon } from './icons/UploadIcon';

interface FileDrivePageProps {
  onLogout: () => void;
}

interface StoredFile {
  id: string;
  file: File;
}

const DB_NAME = 'PersonalDriveDB';
const STORE_NAME = 'files';

const FileDrivePage: React.FC<FileDrivePageProps> = ({ onLogout }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize DB and load files
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const storedItems: StoredFile[] = getAllRequest.result;
        setFiles(storedItems.map(item => item.file));
        setIsLoading(false);
      };
    };

    request.onerror = () => {
      console.error("IndexedDB error");
      setIsLoading(false);
    };
  }, []);

  const saveFileToDB = (file: File) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      // Use a unique ID based on file metadata since real IDs aren't provided by the OS
      const id = `${file.name}-${file.lastModified}-${file.size}`;
      store.put({ id, file });
    };
  };

  const removeFileFromDB = (file: File) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const id = `${file.name}-${file.lastModified}-${file.size}`;
      store.delete(id);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      newFiles.forEach(saveFileToDB);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleDeleteFile = useCallback((fileToDelete: File) => {
    removeFileFromDB(fileToDelete);
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
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach(saveFileToDB);
      setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
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
            <p className="mt-1 text-xs text-center text-green-600 dark:text-green-400 p-2 bg-green-100 dark:bg-gray-700 rounded-md">
              Files are saved locally in your browser's IndexedDB and will persist after refresh.
            </p>
          </div>
          
          <div className="mt-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading your files...</span>
              </div>
            ) : (
              <FileList 
                files={files} 
                onDelete={handleDeleteFile} 
                onDownload={handleDownloadFile} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FileDrivePage;
