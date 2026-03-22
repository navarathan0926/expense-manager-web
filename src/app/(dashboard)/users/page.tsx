'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { User } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role?.toLowerCase() !== 'admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser || currentUser.role?.toLowerCase() !== 'admin') return;
    
    const fetchUsers = async () => {
      try {
        const res = await api.get('/user');
        setUsers(res.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  if (!currentUser || currentUser.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access Denied</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-muted-foreground p-4">Loading users...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground text-sm">View all users in the system.</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-[150px]">Username</th>
                <th>Email</th>
                <th className="w-[120px]">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.id}>
                  <td className="text-sm font-medium">{u.userName}</td>
                  <td className="text-sm">{u.email}</td>
                  <td className="text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      u.role?.toLowerCase() === 'admin' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-secondary/10 text-secondary-foreground'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="text-center text-sm text-muted-foreground h-24">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
