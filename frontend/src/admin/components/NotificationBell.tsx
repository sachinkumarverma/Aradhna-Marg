import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, RotateCcw, RefreshCw, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { DonationsApi, type FinancialNotificationItem } from '@admin/features/donations/DonationsApi';
import { getAdminPath } from '@utils/host';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_dismissed_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    data: notifications = [],
    refetch,
    isFetching
  } = useQuery<FinancialNotificationItem[]>({
    queryKey: ['admin-financial-notifications'],
    queryFn: () => DonationsApi.getNotifications(),
    refetchInterval: 60000 // poll every 60 seconds
  });

  // Filter out locally dismissed notifications
  const activeNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));
  const hasErrors = activeNotifications.some((n) => n.type === 'ERROR');

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleDismissAll = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    try {
      localStorage.setItem('admin_dismissed_notifications', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleItemClick = (item: FinancialNotificationItem) => {
    setIsOpen(false);
    if (item.link) {
      navigate(getAdminPath(item.link));
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md relative transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {activeNotifications.length > 0 && (
          <span
            className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#ff3b00] ${
              hasErrors ? 'bg-amber-300 animate-pulse' : 'bg-white'
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Notifications</span>
              {activeNotifications.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-[#ff3b00] text-white">
                  {activeNotifications.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              {activeNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100">
            {activeNotifications.length > 0 ? (
              activeNotifications.map((n) => {
                const isError = n.type === 'ERROR';
                const isSuccess = n.type === 'SUCCESS';
                const isRefund = n.type === 'REFUND';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 text-xs"
                  >
                    <div className="shrink-0 mt-0.5">
                      {isSuccess && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {isError && (
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {isRefund && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                      )}
                      {!isSuccess && !isError && !isRefund && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {formatTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">All Caught Up!</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  No unread financial alerts or reconciliation issues detected.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(getAdminPath('/donations?tab=reports'));
              }}
              className="text-[11px] font-bold text-[#ff3b00] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Financial Reports & Audits</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
