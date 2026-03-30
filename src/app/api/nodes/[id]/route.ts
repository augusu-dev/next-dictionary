import { createClient } from '@/lib/supabase/server';
import type { UpdateNodeRequest } from '@/types';
import { NextResponse } from 'next/server';

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

    const body: UpdateNodeRequest = await request.json();
    const updates: Record<string, string | number> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.content !== undefined) updates.content = body.content;
    if (body.order_index !== undefined) updates.order_index = body.order_index;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '更新内容がありません' }, { status: 400 });
    }

    // Verify ownership via project
    const { data: node } = await supabase
      .from('nd_nodes')
      .select('project_id')
      .eq('id', id)
      .single();

    if (!node) {
      return NextResponse.json({ error: 'ノードが見つかりません' }, { status: 404 });
    }

    const { data: project } = await supabase
      .from('nd_projects')
      .select('user_id')
      .eq('id', node.project_id)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('nd_nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ node: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラー' },
      { status: 500 }
    );
  }
}
