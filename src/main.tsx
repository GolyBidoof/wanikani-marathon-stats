import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/600.css';
import '@fontsource/noto-sans-jp/700.css';
import './index.css';

function loadGifler(): Promise<void> {
  if (window.gifler) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}vendor/gifler.min.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load gifler'));
    document.head.appendChild(script);
  });
}

async function bootstrap() {
  try {
    await loadGifler();
  } catch (error) {
    console.warn(error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

bootstrap();
