import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Loader2, LogOut } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { SessionManager } from '../../components/admin/SessionManager';
import { logout, verifySession } from '../../api/auth';

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
      <AdminSidebar 
        isMobileOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10">
          
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
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
                className="pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm w-64 focus:bg-white focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button 
              onClick={handleLogout}
              className="sm:hidden p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-saffron" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>

      </div>
    </div>
  );
};
