'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/axios';
import { ReportSummary, CategoryBreakdown } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowDownRight, ArrowUpRight, DollarSign, Activity, Tags } from 'lucide-react';

export default function DashboardPage() {
  const { loading: authLoading, user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if still hydrating auth or no user exists
      if (authLoading || !user) return;

      setLoading(true);
      setError(null);
      try {
        const [sumRes, breakRes] = await Promise.all([
          api.get(`/Report/monthly-summary?year=${year}&month=${month}`),
          api.get(`/Report/category-breakdown?year=${year}&month=${month}`)
        ]);
        setSummary(sumRes.data);
        setBreakdown(breakRes.data);
      } catch (err: any) {
        if (err.response?.status === 401) return; // Interceptor handles this
        console.error('Failed to fetch dashboard data', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, authLoading, user]);

  if (authLoading || (loading && !error)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Activity className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-outline btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Your spending summary for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card overflow-hidden">
          <div className="card-header pb-4 flex flex-row justify-between items-center space-y-0">
            <h3 className="card-title text-sm font-medium text-muted-foreground">Total Spent</h3>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="card-content">
            <div className="text-3xl font-bold tracking-tight">${summary?.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header pb-4 flex flex-row justify-between items-center space-y-0">
            <h3 className="card-title text-sm font-medium text-muted-foreground">Transactions</h3>
            <div className="p-2 bg-secondary/50 rounded-full">
              <Activity className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
          <div className="card-content">
            <div className="text-3xl font-bold tracking-tight">{summary?.transactionCount || 0}</div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header pb-4 flex flex-row justify-between items-center space-y-0">
            <h3 className="card-title text-sm font-medium text-muted-foreground">Average Expense</h3>
            <div className="p-2 bg-accent rounded-full">
              <ArrowDownRight className="w-4 h-4 text-accent-foreground" />
            </div>
          </div>
          <div className="card-content">
            <div className="text-3xl font-bold tracking-tight">${summary?.averageTransactionAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="card flex flex-col lg:col-span-3">
          <div className="card-header border-b border-border/50 pb-4">
            <h3 className="card-title text-lg font-semibold">Spending by Category</h3>
            <p className="card-description">Monthly distribution across categories</p>
          </div>
          <div className="card-content pt-6 flex-1 min-h-[350px]">
            {breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="categoryName" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: 'var(--radius)', 
                      color: 'hsl(var(--card-foreground))',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="totalAmount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <div className="p-4 bg-muted/20 rounded-full">
                  <Activity className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No data available for this month.</p>
              </div>
            )}
          </div>
        </div>

        {/* List representation */}
        <div className="card lg:col-span-2">
          <div className="card-header border-b border-border/50 pb-4">
            <h3 className="card-title text-lg font-semibold">Category Breakdown</h3>
            <p className="card-description">Top spending categories this month</p>
          </div>
          <div className="card-content p-0">
            <div className="flex flex-col">
              {breakdown.length > 0 ? breakdown.map((cat, idx) => (
                <div key={cat.categoryId} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{cat.categoryName}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Category</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">${cat.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-muted-foreground font-medium">Total</div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                   <div className="p-3 bg-muted/20 rounded-full">
                    <Tags className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium text-center">No categories observed<br/>in this period.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
