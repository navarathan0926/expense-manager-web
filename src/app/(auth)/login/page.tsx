'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/axios';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!login(data.token, data.user)) {
        setError('Login failed. Invalid response from server.');
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header items-center">
        <LogIn className="w-10 h-10 text-primary mb-2" />
        <h2 className="card-title">Welcome back</h2>
        <p className="card-description">Sign in to your account to continue</p>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Email Address</label>
            <input 
              className="input" 
              type="email" 
              placeholder="user@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input 
              className="input" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          {error && <div className="error-msg">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
      <div className="card-footer justify-center border-t border-border mt-2 pt-4">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}