import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '@api/auth';
import toast from 'react-hot-toast';

// Configurable session timings
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes

export const SessionManager: React.FC = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  
  const handleLogout = useCallback(async (message: string) => {
    await logout();
    toast.error(message, { duration: 5000, id: 'session-toast' });
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  // Handle global 401 responses
  useEffect(() => {
    const onSessionExpired = () => {
      handleLogout("Your session has expired. Please log in again.");
    };
    window.addEventListener('session-expired', onSessionExpired);
    return () => window.removeEventListener('session-expired', onSessionExpired);
  }, [handleLogout]);

  // Handle inactivity tracking
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let warningId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (showWarning) return; // Prevent resetting if warning is already visible
      clearTimeout(timeoutId);
      clearTimeout(warningId);

      warningId = setTimeout(() => {
        setShowWarning(true);
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

      timeoutId = setTimeout(() => {
        handleLogout("Your session expired due to inactivity. Please log in again.");
      }, INACTIVITY_TIMEOUT);
    };

    // Events that denote user activity
    const events = ['mousemove', 'mousedown', 'click', 'keypress', 'scroll', 'DOMMouseScroll', 'mousewheel', 'touchmove', 'MSPointerMove'];
    
    // Throttle the event listeners a bit to not overwhelm the main thread
    let isThrottled = false;
    const handleActivity = () => {
      if (showWarning) return;
      if (!isThrottled) {
        resetTimer();
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 1000); // 1s throttle
      }
    };

    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      clearTimeout(timeoutId);
      clearTimeout(warningId);
    };
  }, [handleLogout, showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Session Expiring</h3>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Your session will expire in 5 minutes due to inactivity. Do you want to continue your session?
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={() => handleLogout("You have been logged out.")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Logout Now
          </button>
          <button 
            onClick={() => setShowWarning(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-saffron hover:bg-saffron/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-saffron/50 shadow-sm"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
};
