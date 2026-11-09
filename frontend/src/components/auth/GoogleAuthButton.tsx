import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GoogleAuthButtonProps {
  onSuccess?: (credential: string) => void;
  onError?: (err: any) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  label?: string;
  className?: string;
  disabled?: boolean;
  isAdmin?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined' || window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src^="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google Identity Services failed to load')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services failed to load'));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  text = 'signin_with',
  label,
  className = '',
  disabled = false,
  isAdmin = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const lastRenderedWidthRef = useRef<number | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Stable callback references to prevent GSI re-initialization on state updates
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const initGsi = useCallback(() => {
    if (!window.google?.accounts?.id || !buttonRef.current || !clientId) return;

    try {
      const envBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      let base = envBase;
      if (!base.startsWith('http://') && !base.startsWith('https://')) {
        base =
          typeof window !== 'undefined' && window.location.hostname.includes('localhost')
            ? 'http://localhost:5000/api'
            : 'https://api.aradhnamarg.com/api';
      }
      const callbackUri = isAdmin ? `${base}/admin/auth/google/callback` : `${base}/v1/auth/google/callback`;

      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'redirect',
        login_uri: callbackUri,
        callback: (response: any) => {
          if (response?.credential) {
            setLoading(true);
            onSuccessRef.current?.(response.credential);
          } else if (onErrorRef.current) {
            onErrorRef.current(new Error('No Google credential returned'));
          }
        }
      });

      // Measure exact container width so Google renders a button matching the whole container width
      const containerWidth = containerRef.current?.clientWidth || 380;
      // Google Identity Services limits width between 200px and 400px
      const targetWidth = Math.min(400, Math.max(200, Math.floor(containerWidth)));

      // Clear existing children before rendering
      buttonRef.current.innerHTML = '';

      // Render official Google button overlay at 1:1 matching width (NO CSS transforms/scale)
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: 'pill',
        width: targetWidth,
        logo_alignment: 'center'
      });

      lastRenderedWidthRef.current = targetWidth;
    } catch (e) {
      if (onErrorRef.current) onErrorRef.current(e);
    }
  }, [clientId, text, isAdmin]);

  // Initial script load & render
  useEffect(() => {
    if (!clientId) return;

    let active = true;
    loadGoogleIdentityServices()
      .then(() => {
        if (active) initGsi();
      })
      .catch((error) => onErrorRef.current?.(error));

    return () => {
      active = false;
    };
  }, [clientId, initGsi]);

  // Re-render button if container width changes (e.g., orientation change or responsive resize)
  useEffect(() => {
    if (!containerRef.current || !clientId) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.min(400, Math.max(200, Math.floor(entry.contentRect.width)));
        const lastWidth = lastRenderedWidthRef.current;
        if (lastWidth && Math.abs(newWidth - lastWidth) >= 12) {
          initGsi();
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [clientId, initGsi]);

  const handleFallbackClick = () => {
    if (disabled || loading) return;

    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google OAuth is currently unavailable. Please sign in with email and password.');
    }
  };

  const buttonText = label || (text === 'signup_with' ? 'Sign up with Google' : 'Sign in with Google');

  const handleContainerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFallbackClick();
    }
  };

  return (
    <div ref={containerRef} className={`w-full max-w-[400px] mx-auto flex flex-col items-center ${className}`}>
      <div
        className="group relative w-full h-11 sm:h-12 overflow-hidden rounded-full"
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        aria-label={buttonText}
        aria-disabled={disabled || loading}
        onClick={handleFallbackClick}
        onKeyDown={handleContainerKeyDown}
      >
        {/* Custom Visual Layer: Preserves exact semi-bold font weight, crisp G logo, and hover style */}
        <div className="relative z-30 w-full h-full flex items-center justify-center gap-2.5 px-4 bg-white group-hover:bg-slate-50 border border-slate-200/90 group-hover:border-slate-300 rounded-full shadow-2xs text-sm font-semibold leading-none text-slate-800 transition-all font-sans select-none pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-saffron" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="font-semibold tracking-normal translate-y-px">{buttonText}</span>
        </div>

        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 rounded-full backdrop-blur-2xs pointer-events-none">
            <Loader2 className="w-5 h-5 animate-spin text-saffron" />
          </div>
        )}

        {/* Active GIS Interactive Overlay: Unscaled, exact matching width, covering entire container */}
        {clientId ? (
          <div
            ref={buttonRef}
            className={`absolute inset-0 z-20 w-full h-full cursor-pointer opacity-100 rounded-full overflow-hidden flex items-center justify-center ${
              disabled || loading ? 'pointer-events-none' : ''
            }`}
            title={buttonText}
          />
        ) : null}
      </div>
    </div>
  );
};
