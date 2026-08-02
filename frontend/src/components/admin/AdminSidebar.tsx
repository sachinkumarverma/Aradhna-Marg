import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Music2, PlaySquare, BrainCircuit, Settings, FolderTree, Sparkles, FileText, BookOpen, CalendarDays, Users, Tags, Search, Activity
} from 'lucide-react';
import { cn } from '@utils/cn';

const DASHBOARD_NAV = [
  { name: 'DASHBOARD', path: '/admin', icon: LayoutDashboard },
];

const CONTENT_NAV = [
  { name: 'BHAJANS', path: '/admin/bhajans', icon: Music2 },
  { name: 'ARTICLES', path: '/admin/articles', icon: FileText },
  { name: 'PURANAS', path: '/admin/puranas', icon: BookOpen },
  { name: 'FESTIVALS', path: '/admin/festivals', icon: CalendarDays },
];

const ORGANIZE_NAV = [
  { name: 'CATEGORIES', path: '/admin/categories', icon: FolderTree },
  { name: 'DEITIES', path: '/admin/deities', icon: Sparkles },
  { name: 'AUTHORS', path: '/admin/authors', icon: Users },
  { name: 'TAGS', path: '/admin/tags', icon: Tags },
];

const AUTOMATION_NAV = [
  { name: 'YOUTUBE SYNC', path: '/admin/youtube', icon: PlaySquare },
  { name: 'AI PROCESSING', path: '/admin/ai', icon: BrainCircuit },
  { name: 'SEO ENGINE', path: '/admin/seo', icon: Search },
];

const SYSTEM_NAV = [
  { name: 'SETTINGS', path: '/admin/settings', icon: Settings },
  { name: 'SYSTEM HEALTH', path: '/admin/system-health', icon: Activity },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobileOpen, onClose }) => {

  const renderLinks = (links: typeof DASHBOARD_NAV) => (
    <ul className="space-y-0.5">
      {links.map((link) => (
        <li key={link.name}>
          <NavLink
            to={link.path}
            end={link.path === '/admin'}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-bold transition-all duration-200",
              isActive
                ? "bg-[#ff3b00] text-white shadow-md shadow-red-500/20"
                : "text-[#00274c] hover:bg-gray-100 hover:text-[#d9480f]"
            )}
          >
            <link.icon className="w-5 h-5 stroke-[2]" />
            {link.name}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
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
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 h-16 border-b border-[#e63500] flex-shrink-0 flex items-center bg-[#ff3b00] shadow-sm relative z-20 -mr-[1px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 shadow-sm border border-white/20">
                <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-xl font-bold tracking-wide whitespace-nowrap">
                <span className="text-white">ARADHNA </span>
                <span className="text-black">MARG</span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 flex-1 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <div>
              {renderLinks(DASHBOARD_NAV)}
            </div>

            <div>
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Content</h3>
              {renderLinks(CONTENT_NAV)}
            </div>

            <div>
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Organize</h3>
              {renderLinks(ORGANIZE_NAV)}
            </div>

            <div>
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Automation</h3>
              {renderLinks(AUTOMATION_NAV)}
            </div>

            <div>
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">System</h3>
              {renderLinks(SYSTEM_NAV)}
            </div>
          </div>

          {/* Bottom user profile mock */}
          <div className="border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <img
                src="https://api.dicebear.com/7.x/micah/svg?seed=AdminUser&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4&backgroundType=gradientLinear"
                alt="Admin Avatar"
                className="w-10 h-10 rounded-full shadow-sm border-2 border-white bg-saffron/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#00274c] truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@aradhnamarg.com</p>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
