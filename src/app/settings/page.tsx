'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Check, Key, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    if (!user) {
      setCheckingKey(false);
      return;
    }

    const checkKey = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('nd_user_provider_keys')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'openrouter')
          .single();
        setHasKey(!!data);
      } catch {
        // No key found
      } finally {
        setCheckingKey(false);
      }
    };

    checkKey();
  }, [user]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/settings/provider-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openrouter', api_key: apiKey.trim() }),
      });

      if (res.ok) {
        setHasKey(true);
        setApiKey('');
        toast.success('APIキーを保存しました');
      } else {
        const data = await res.json();
        toast.error(data.error || '保存に失敗しました');
      }
    } catch {
      toast.error('通信エラー');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm('登録済みのAPIキーを削除しますか？')) return;
    setLoading(true);

    try {
      const res = await fetch('/api/settings/provider-key?provider=openrouter', {
        method: 'DELETE',
      });

      if (res.ok) {
        setHasKey(false);
        toast.success('APIキーを削除しました');
      } else {
        toast.error('削除に失敗しました');
      }
    } catch {
      toast.error('通信エラー');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="container mx-auto px-4 py-8">読み込み中...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">ログインが必要です</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenRouter APIキー
          </CardTitle>
          <CardDescription>
            自分のOpenRouter APIキーを登録すると、無料枠の制限なく生成を利用できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-2">
            <p><strong>利用モード：</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>持参キー利用</strong>：自分のAPIキーを登録して使用。制限なし。</li>
              <li><strong>無料枠利用</strong>：運営のAPIキーを使用。1日あたりの生成回数に制限あり。</li>
            </ul>
          </div>

          {checkingKey ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              確認中...
            </div>
          ) : hasKey ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 rounded-lg border bg-green-50 p-3 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-800">APIキーが登録済みです（持参キーモード）</span>
              </div>
              <Button variant="outline" size="icon" onClick={handleDeleteKey} disabled={loading}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                APIキー未登録（無料枠モードで利用中）
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">APIキーを入力</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-or-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  />
                  <Button onClick={handleSaveKey} disabled={loading || !apiKey.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            APIキーは暗号化して安全に保存されます。サーバー経由でのみ使用され、ブラウザには送信されません。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
