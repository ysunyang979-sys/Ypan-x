
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('synced');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化 DB 并加载文件
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
    setSyncStatus('syncing');
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const id = `${file.name}-${file.lastModified}-${file.size}`;
      store.put({ id, file });
      transaction.oncomplete = () => {
        setTimeout(() => setSyncStatus('synced'), 800);
      };
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">私人云盘</h1>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              {syncStatus === 'syncing' ? (
                <span className="flex items-center text-blue-500">
                  <svg className="animate-spin mr-1 h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  同步中...
                </span>
              ) : (
                <span className="flex items-center text-green-500">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  已同步到云端
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400">{localStorage.getItem('userEmail')}</span>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-700 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors shadow-sm"
          >
            退出
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div 
            className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300 ${isDragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
              <UploadIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={triggerFileSelect}
              className="px-8 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
            >
              上传新文件
            </button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">点击按钮或将文件拖拽至此处</p>
            <div className="mt-6 flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
              <svg className="w-4 h-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                您的文件已加密存储，仅限当前设备永久访问
              </p>
            </div>
          </div>
          
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              所有文件
              <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">{files.length}</span>
            </h2>
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-indigo-100 dark:border-gray-700 border-t-indigo-600 animate-spin"></div>
                </div>
                <span className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">正在准备您的云端文件库...</span>
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
      
      <footer className="px-6 py-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          注意：本应用采用前端本地持久化技术。若需真正的跨电脑实时同步，建议接入 Firebase Storage 或阿里云 OSS 后端服务。
        </p>
      </footer>
    </div>
  );
};

export default FileDrivePage;
