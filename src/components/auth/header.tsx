'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { BookOpen, Settings, Library, LayoutDashboard } from 'lucide-react';

export function Header() {
  const { user, loading } = useAuth();

  const handleLogin = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            Next Dictionary
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/library" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Library className="h-4 w-4" />
              ライブラリ
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  ダッシュボード
                </Link>
                <Link href="/settings" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Settings className="h-4 w-4" />
                  設定
                </Link>
              </>
            )}
          </nav>
        </div>
        <div>
          {loading ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                ログアウト
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleLogin}>
              Googleでログイン
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
