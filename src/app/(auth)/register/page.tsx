'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/axios';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', { email, password, userName });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header items-center">
        <UserPlus className="w-10 h-10 text-primary mb-2" />
        <h2 className="card-title">Create an Account</h2>
        <p className="card-description">Get started with ExpenseManager</p>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">UserName</label>
            <input 
              className="input" 
              type="text" 
              placeholder="johndoe" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required 
            />
          </div>
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
          
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
      </div>
      <div className="card-footer justify-center border-t border-border mt-2 pt-4">
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
