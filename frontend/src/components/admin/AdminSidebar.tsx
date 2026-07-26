import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Music2, PlaySquare, BrainCircuit, 
  Settings, FolderTree, Sparkles, Image, Settings2, FileText
} from 'lucide-react';
import { cn } from '../../utils/cn';

const MAIN_NAV = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Bhajans', path: '/admin/bhajans', icon: Music2 },
  { name: 'YouTube Sync', path: '/admin/youtube', icon: PlaySquare },
  { name: 'AI Processing', path: '/admin/ai', icon: BrainCircuit },
];

const TAXONOMY_NAV = [
  { name: 'Categories', path: '/admin/categories', icon: FolderTree },
  { name: 'Deities', path: '/admin/gods', icon: Sparkles },
  { name: 'Festivals', path: '/admin/festivals', icon: Sparkles },
];

const SYSTEM_NAV = [
  { name: 'SEO Engine', path: '/admin/seo', icon: FileText },
  { name: 'Media Library', path: '/admin/media', icon: Image },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobileOpen, onClose }) => {
  
  const renderLinks = (links: typeof MAIN_NAV) => (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link.name}>
          <NavLink
            to={link.path}
            end={link.path === '/admin'}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-saffron text-white shadow-md shadow-saffron/20" 
                : "text-gray-600 hover:bg-gray-100 hover:text-darkBrown"
            )}
          >
            <link.icon className="w-5 h-5" />
            {link.name}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
    isMobileOpen ? "translate-x-0" : "-translate-x-full"
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg text-darkBrown tracking-tight">Admin Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-4 py-6 flex-1 space-y-8">
            <div>
              <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Core</h3>
              {renderLinks(MAIN_NAV)}
            </div>

            <div>
              <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Taxonomy</h3>
              {renderLinks(TAXONOMY_NAV)}
            </div>

            <div>
              <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System</h3>
              {renderLinks(SYSTEM_NAV)}
            </div>
          </div>
          
          {/* Bottom user profile mock */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-darkBrown truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@aradhnamarg.com</p>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
