import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { pwaManager } from './pwa';
import { AuthProvider } from './context/AuthContext';

// Register Service Worker for Mobile PWA offline support
pwaManager.registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
