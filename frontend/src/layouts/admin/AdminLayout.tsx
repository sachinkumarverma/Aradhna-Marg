import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Loader2, LogOut } from 'lucide-react';
import { AdminSidebar } from '@components/admin/AdminSidebar';
import { SessionManager } from '@components/admin/SessionManager';
import { logout, verifySession } from '@api/auth';

export const AdminLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await verifySession();
      if (!valid) {
        navigate('/admin/login', { state: { from: location }, replace: true });
        return;
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate, location]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <SessionManager />

      {/* Sidebar */}
      <AdminSidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#ff3b00] flex items-center justify-between px-4 sm:px-6 z-10 shadow-md">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Global Search (Cmd+K)"
                className="pl-9 pr-4 py-2 bg-white/90 hover:bg-white focus:bg-white border-transparent rounded-md text-sm w-64 text-gray-700 placeholder:text-gray-400 focus:text-gray-900 focus:ring-2 focus:ring-white/50 transition-all outline-none shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full border-2 border-[#ff3b00]"></span>
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button
              onClick={handleLogout}
              className="sm:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-4 lg:px-8 lg:py-6 lg:border-l lg:border-gray-200">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-saffron" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
