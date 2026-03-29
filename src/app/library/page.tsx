'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, ExternalLink } from 'lucide-react';
import type { ProjectListItem, ProjectMode } from '@/types';

const modeLabels: Record<ProjectMode, string> = {
  dictionary: '用語集',
  tree: '階層',
  flow: 'フロー',
};

interface PublicProject extends ProjectListItem {
  profiles: { display_name: string | null } | null;
}

export default function LibraryPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        // Use Supabase client to query public projects
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        let query = supabase
          .from('projects')
          .select('id, title, topic, mode, visibility, updated_at, profiles(display_name)')
          .eq('visibility', 'public')
          .order('updated_at', { ascending: false });

        if (search.trim()) {
          query = query.or(`title.ilike.%${search.trim()}%,topic.ilike.%${search.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProjects((data as unknown as PublicProject[]) || []);
      } catch {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchPublicProjects, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">公開ライブラリ</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="公開プロジェクトを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">読み込み中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {search ? '検索結果がありません' : '公開プロジェクトはまだありません'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{project.topic}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{modeLabels[project.mode]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {project.profiles?.display_name || '匿名'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(project.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                >
                  <ExternalLink className="h-3 w-3" />
                  閲覧する
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
