import { createClient } from '@/lib/supabase/server';
import { callOpenRouter, parseJSONResponse } from '@/lib/openrouter/client';
import { buildDictionaryPrompt } from '@/lib/openrouter/prompts/dictionary';
import { decrypt } from '@/lib/encryption';
import type { GenerateDictionaryRequest, GeneratedNode } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Parse request
    const body: GenerateDictionaryRequest = await request.json();
    const { topic, count = 10, difficulty } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'トピックを入力してください' }, { status: 400 });
    }

    const validatedCount = Math.min(Math.max(Math.round(count), 1), 100);

    // Resolve API key
    let apiKey: string;
    let usedUserKey = false;

    const { data: userKey } = await supabase
      .from('nd_user_provider_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', 'openrouter')
      .single();

    if (userKey?.encrypted_key) {
      const secret = process.env.USER_KEY_ENCRYPTION_SECRET;
      if (!secret) throw new Error('Encryption secret not configured');
      apiKey = decrypt(userKey.encrypted_key, secret);
      usedUserKey = true;
    } else {
      apiKey = process.env.OPENROUTER_API_KEY_FREE || process.env.OPENROUTER_API_KEY_FREE || 'http://localhost:3000';
;
      if (!apiKey) throw new Error('Free API key not configured');
    }

    // Call LLM
    const messages = buildDictionaryPrompt({
      topic: topic.trim(),
      count: validatedCount,
      difficulty,
    });

    const rawResponse = await callOpenRouter(messages, { apiKey });
    const parsed = parseJSONResponse(rawResponse) as {
      title: string;
      nodes: GeneratedNode[];
    };

    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid response structure: missing nodes array');
    }

    // Save project
    const projectTitle = parsed.title || `${topic.trim()} 用語集`;

    const { data: project, error: projectError } = await supabase
      .from('nd_projects')
      .insert({
        user_id: user.id,
        title: projectTitle,
        topic: topic.trim(),
        mode: 'dictionary',
        visibility: 'private',
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to create project: ${projectError?.message}`);
    }

    // Save nodes
    const nodesToInsert = parsed.nodes.map((node, index) => ({
      project_id: project.id,
      title: node.title,
      summary: node.summary || null,
      content: node.content || null,
      level: 0,
      order_index: index,
    }));

    const { data: savedNodes, error: nodesError } = await supabase
      .from('nd_nodes')
      .insert(nodesToInsert)
      .select();

    if (nodesError) {
      throw new Error(`Failed to save nodes: ${nodesError.message}`);
    }

    // Log generation
    await supabase.from('nd_generation_logs').insert({
      user_id: user.id,
      project_id: project.id,
      mode: 'dictionary',
      topic: topic.trim(),
      provider: 'openrouter',
      used_user_key: usedUserKey,
      status: 'success',
    });

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        topic: project.topic,
        mode: 'dictionary' as const,
      },
      nodes: savedNodes,
    });
  } catch (error) {
    console.error('Dictionary generation error:', error);

    // Try to log the failure
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('nd_generation_logs').insert({
          user_id: user.id,
          mode: 'dictionary',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成に失敗しました' },
      { status: 500 }
    );
  }
}
