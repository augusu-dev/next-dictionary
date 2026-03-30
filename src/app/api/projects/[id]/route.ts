import { createClient } from '@/lib/supabase/server';
import type { UpdateProjectRequest } from '@/types';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch project (RLS handles visibility check)
    const query = supabase
      .from('nd_projects')
      .select(`
        *,
        nd_nodes (*),
        nd_edges (*)
      `)
      .eq('id', id)
      .single();

    const { data: project, error } = await query;

    if (error || !project) {
      return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
    }

    // Check access: public or own
    if (project.visibility !== 'public' && (!user || project.user_id !== user.id)) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // Sort nodes by order_index
    project.nd_nodes.sort((a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
    );

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラー' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body: UpdateProjectRequest = await request.json();
    const updates: Record<string, string> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.visibility !== undefined) updates.visibility = body.visibility;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '更新内容がありません' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('nd_projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !project) {
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラー' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { error } = await supabase
      .from('nd_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラー' },
      { status: 500 }
    );
  }
}
