'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import type { ProjectMode, Difficulty } from '@/types';

export function GenerateForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ProjectMode>('dictionary');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showCountWarning = count > 30;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      return;
    }

    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { topic: topic.trim(), count };
      if (difficulty) body.difficulty = difficulty;

      const res = await fetch(`/api/generate/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '生成に失敗しました');
        return;
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          知識構造を生成
        </CardTitle>
        <CardDescription>
          トピックを入力して、学習に適した知識構造を生成します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">トピック</Label>
            <Input
              id="topic"
              placeholder="例：量子力学、機械学習、デザインパターン..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">生成形式</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as ProjectMode)}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dictionary">Dictionary（用語集）</SelectItem>
                <SelectItem value="tree" disabled>Tree（階層構造）— Phase 2</SelectItem>
                <SelectItem value="flow" disabled>Flow（フロー）— Phase 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'dictionary' && (
            <div className="space-y-2">
              <Label htmlFor="count">件数（1〜100）</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 100))}
              />
              {showCountWarning && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  30件を超えると生成に時間がかかる場合があります
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="difficulty">難易度（任意）</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty | '')}>
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="指定しない" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">初心者向け</SelectItem>
                <SelectItem value="intermediate">中級者向け</SelectItem>
                <SelectItem value="advanced">上級者向け</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !topic.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {user ? '生成する' : 'ログインして生成する'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
