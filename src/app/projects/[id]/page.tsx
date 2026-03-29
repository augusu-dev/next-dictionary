'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { DictionaryView } from '@/components/dictionary/dictionary-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Globe, Lock, Pencil, Check, X, Trash2 } from 'lucide-react';
import type { ProjectDetail, ProjectMode, Visibility } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const modeLabels: Record<ProjectMode, string> = {
  dictionary: '用語集',
  tree: '階層',
  flow: 'フロー',
};

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      } else if (res.status === 404) {
        toast.error('プロジェクトが見つかりません');
        router.push('/dashboard');
      } else {
        toast.error('読み込みに失敗しました');
      }
    } catch {
      toast.error('通信エラー');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const toggleVisibility = async () => {
    if (!project) return;
    const newVisibility: Visibility = project.visibility === 'private' ? 'public' : 'private';

    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: newVisibility }),
    });

    if (res.ok) {
      setProject((prev) => prev ? { ...prev, visibility: newVisibility } : prev);
      toast.success(newVisibility === 'public' ? '公開しました' : '非公開にしました');
    } else {
      toast.error('変更に失敗しました');
    }
  };

  const saveTitle = async () => {
    if (!project || !titleValue.trim()) return;

    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleValue.trim() }),
    });

    if (res.ok) {
      setProject((prev) => prev ? { ...prev, title: titleValue.trim() } : prev);
      setEditingTitle(false);
      toast.success('タイトルを更新しました');
    } else {
      toast.error('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!confirm('このプロジェクトを削除しますか？')) return;

    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('削除しました');
      router.push('/dashboard');
    } else {
      toast.error('削除に失敗しました');
    }
  };

  const isOwner = user && project?.user_id === user.id;

  if (loading || authLoading) {
    return <div className="container mx-auto px-4 py-8">読み込み中...</div>;
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">プロジェクトが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href={isOwner ? '/dashboard' : '/library'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        {isOwner ? 'ダッシュボードに戻る' : 'ライブラリに戻る'}
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="text-2xl font-bold h-auto"
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              />
              <Button size="icon" onClick={saveTitle}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{project.title}</h1>
          )}
        </div>
        {isOwner && (
          <div className="flex items-center gap-2 ml-4">
            {editingTitle ? null : (
              <Button variant="ghost" size="icon" onClick={() => { setTitleValue(project.title); setEditingTitle(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVisibility}
            >
              {project.visibility === 'private' ? (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  非公開
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-1" />
                  公開中
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Badge variant="outline">{modeLabels[project.mode]}</Badge>
        <span>トピック: {project.topic}</span>
        <span>・</span>
        <span>{project.nodes.length}項目</span>
      </div>

      <Separator className="mb-6" />

      {project.mode === 'dictionary' && (
        <DictionaryView nodes={project.nodes} onNodeUpdate={async () => { await fetchProject(); }} />
      )}

      {project.mode === 'tree' && (
        <div className="text-muted-foreground text-center py-8">
          Tree表示はPhase 2で実装予定です
        </div>
      )}

      {project.mode === 'flow' && (
        <div className="text-muted-foreground text-center py-8">
          Flow表示はPhase 2で実装予定です
        </div>
      )}
    </div>
  );
}
