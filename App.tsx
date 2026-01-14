
import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import FileDrivePage from './components/FileDrivePage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // 初始化时检查登录状态
  useEffect(() => {
    const savedStatus = localStorage.getItem('isLoggedIn');
    if (savedStatus === 'true') {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
  }, []);

  // 加载状态，防止首屏闪烁
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {isLoggedIn ? (
        <FileDrivePage onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
