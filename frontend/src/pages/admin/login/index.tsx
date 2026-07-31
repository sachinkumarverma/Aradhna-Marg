import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Loader2, Lock } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      navigate('/admin', { replace: true });
    } else {
      setCheckingAuth(false);
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                placeholder="admin"
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
