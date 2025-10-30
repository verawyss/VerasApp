import { useEffect } from 'react';
import { AppProps } from 'next/app';
import { useAuthStore } from '@/lib/store';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('SW registered:', registration))
        .catch((error) => console.log('SW registration failed:', error));
    }

    // Load user on app start
    loadUser();
  }, [loadUser]);

  return <Component {...pageProps} />;
}
