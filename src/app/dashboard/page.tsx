'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, Trash2, ExternalLink } from 'lucide-react';
import type { ProjectListItem, ProjectMode, Visibility } from '@/types';
import { toast } from 'sonner';

const modeLabels: Record<ProjectMode, string> = {
  dictionary: '用語集',
  tree: '階層',
  flow: 'フロー',
};

const visibilityVariant: Record<Visibility, 'default' | 'secondary'> = {
  private: 'secondary',
  public: 'default',
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const params = search ? `?q=${encodeURIComponent(search)}` : '';
        const res = await fetch(`/api/projects${params}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects);
        }
      } catch {
        toast.error('プロジェクトの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('このプロジェクトを削除しますか？')) return;

    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('削除しました');
    } else {
      toast.error('削除に失敗しました');
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link href="/">
          <Button>新規生成</Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="プロジェクトを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">読み込み中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {search ? '検索結果がありません' : 'プロジェクトがまだありません。トピックを入力して生成を始めましょう。'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-1">{project.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{project.topic}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{modeLabels[project.mode]}</Badge>
                  <Badge variant={visibilityVariant[project.visibility]}>
                    {project.visibility === 'private' ? '非公開' : '公開'}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(project.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                >
                  <ExternalLink className="h-3 w-3" />
                  開く
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
