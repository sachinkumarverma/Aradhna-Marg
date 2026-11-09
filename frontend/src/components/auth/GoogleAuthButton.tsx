import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (err: any) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  label?: string;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  text = 'signin_with',
  label,
  className = '',
  disabled = false
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Stable callback references to prevent GSI re-initialization on state updates
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const initGsi = useCallback(() => {
    if (!window.google?.accounts?.id || !buttonRef.current || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            setLoading(true);
            onSuccessRef.current(response.credential);
          } else if (onErrorRef.current) {
            onErrorRef.current(new Error('No Google credential returned'));
          }
        }
      });

      // Clear existing children before rendering
      buttonRef.current.innerHTML = '';

      // Render with maximum permitted width (400) so scaled iframe covers entire button
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'pill',
        width: 400,
        logo_alignment: 'left'
      });
    } catch (e) {
      if (onErrorRef.current) onErrorRef.current(e);
    }
  }, [clientId, text]);

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const checkGsi = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGsi);
          initGsi();
        }
      }, 50);

      const timeout = setTimeout(() => clearInterval(checkGsi), 5000);
      return () => {
        clearInterval(checkGsi);
        clearTimeout(timeout);
      };
    }
  }, [clientId, text, initGsi]);

  const handleFallbackClick = () => {
    if (disabled || loading) return;

    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google OAuth is currently unavailable. Please sign in with email and password.');
    }
  };

  const buttonText = label || (text === 'signup_with' ? 'Sign up with Google' : 'Sign in with Google');

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <div className="relative w-full h-11 sm:h-12 overflow-hidden rounded-full">
        {/* Custom Visual Layer: Google icon and text tightly grouped in center with semi-bold typography */}
        <div className="w-full h-full flex items-center justify-center gap-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full shadow-2xs text-sm font-semibold leading-none text-slate-800 transition-all font-sans select-none pointer-events-none">
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
          <span className="translate-y-px">{buttonText}</span>
        </div>

        {/* Active GIS Interactive Overlay: Scaled to guarantee 100% full button coverage with zero dead zones */}
        {clientId ? (
          <div
            ref={buttonRef}
            className="absolute inset-0 z-20 overflow-hidden rounded-full cursor-pointer opacity-[0.001] flex items-center justify-center [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!scale-[1.4] [&_iframe]:!origin-center"
            title={buttonText}
          />
        ) : (
          <button
            type="button"
            onClick={handleFallbackClick}
            disabled={disabled || loading}
            className="absolute inset-0 z-20 w-full h-full cursor-pointer opacity-0 rounded-full"
            aria-label={buttonText}
          />
        )}
      </div>
    </div>
  );
};
