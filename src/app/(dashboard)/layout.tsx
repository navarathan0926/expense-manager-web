'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Tags, LogOut, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null; 

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Categories', href: '/categories', icon: Tags },
    ...(user.role?.toLowerCase() === 'admin' ? [{ name: 'Users', href: '/users', icon: Users }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center h-16 px-4 md:px-6">
        <div className="flex items-center gap-2 mr-6">
          <span className="font-bold text-lg tracking-tight">ExpenseManager</span>
        </div>
        
        <nav className="flex items-center gap-6 flex-1 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center justify-end gap-4 ml-auto">
          <div className="hidden md:flex flex-col text-right mr-2">
            <span className="text-sm font-medium leading-none">{user.userName}</span>
            <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center justify-center h-9 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:block">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-4 md:p-8 bg-muted/20">
        <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
