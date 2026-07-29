import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../api/supabase';
import { apiClient } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Loader2, Lock } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If already logged in, strictly redirect to the admin dashboard
        navigate('/admin', { replace: true });
      } else {
        setCheckingAuth(false);
      }
    });
  }, [navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Verify backend is reachable before considering login successful
        try {
          await apiClient.get('/admin/dashboard/stats');
          // Strictly navigate to dashboard to prevent landing on 404s from typos
          navigate('/admin', { replace: true });
        } catch (backendErr: any) {
          // If the backend is down, log out from supabase so we don't leave a ghost session
          await supabase.auth.signOut();
          throw new Error('Server is unreachable. Please ensure the backend is running.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-saffron" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-center text-darkBrown tracking-tight mb-2">
            Admin <span className="text-saffron">Access</span>
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Please login to access the dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                placeholder="admin@aradhnamarg.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-saffron hover:bg-[#d96a1a] text-white font-bold rounded-lg shadow-md flex justify-center items-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
