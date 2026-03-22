import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-center p-6 border border-border bg-card rounded-lg shadow-lg max-w-lg w-full relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 p-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

        <h1 className="text-4xl font-bold tracking-tight z-10">
          Expense<span className="text-primary">Manager</span>
        </h1>
        <p className="text-card-foreground text-sm z-10">
          A sleek, modern application to track your personal finances intelligently mapping every expense dynamically to powerful analytics.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 z-10">
          <Link href="/login" className="btn btn-primary">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-outline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
