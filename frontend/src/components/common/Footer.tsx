import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a] text-gray-400 pt-16 pb-8 border-t-4 border-saffron relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
                <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Aradhna Marg
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Your digital sanctuary for spiritual awakening. Discover, read, and listen to the most divine collection of Bhajans.
            </p>

          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="font-bold text-saffron mb-6 text-lg flex items-center gap-2">
              <span className="text-xl">❖</span> Explore
            </h3>
            <ul className="space-y-3 font-medium">
              <li><Link to="/videos" className="hover:text-white transition-colors">All Videos</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link to="/gods" className="hover:text-white transition-colors">Deities</Link></li>
              <li><Link to="/festivals" className="hover:text-white transition-colors">Festivals</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-bold text-saffron mb-6 text-lg flex items-center gap-2">
              <span className="text-xl">❖</span> Popular
            </h3>
            <ul className="space-y-3 font-medium">
              <li><Link to="#" className="hover:text-white transition-colors">Morning Bhajans</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Aarti Sangrah</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Shiv Bhajans</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Krishna Bhajans</Link></li>
            </ul>
          </div>

          {/* Legal Col */}
          <div>
            <h3 className="font-bold text-saffron mb-6 text-lg flex items-center gap-2">
              <span className="text-xl">❖</span> Legal
            </h3>
            <ul className="space-y-3 font-medium">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} Aradhna Marg. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-600 fill-red-600" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};
