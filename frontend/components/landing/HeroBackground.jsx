'use client';
import { useEffect, useRef } from 'react';

export default function HeroBackground() {
  const ref = useRef(null);

  useEffect(() => {
    function runInit() {
      if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
        window.UnicornStudio.init();
        return;
      }
      // SDK not loaded yet — inject it
      if (document.getElementById('unicorn-studio-sdk')) return;
      const script = document.createElement('script');
      script.id = 'unicorn-studio-sdk';
      script.src =
        'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.3/dist/unicornStudio.umd.js';
      script.onload = () => {
        if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
          window.UnicornStudio.init();
        }
      };
      document.body.appendChild(script);
    }

    runInit();
  }, []);

  return (
    <div
      ref={ref}
      data-us-project="FA91ypkIWKOhjZEGAfQR"
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
