
import React from 'react';
import FileItem from './FileItem';

interface FileListProps {
  files: File[];
  onDelete: (file: File) => void;
  onDownload: (file: File) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDelete, onDownload }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No files uploaded yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use the upload button above to add your files.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file, index) => (
              <FileItem 
                key={`${file.name}-${file.lastModified}-${index}`} 
                file={file} 
                onDelete={onDelete} 
                onDownload={onDownload} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;
