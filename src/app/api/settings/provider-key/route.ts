import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';
import type { SaveProviderKeyRequest } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body: SaveProviderKeyRequest = await request.json();
    const { provider, api_key } = body;

    if (!provider || !api_key) {
      return NextResponse.json({ error: 'providerとapi_keyは必須です' }, { status: 400 });
    }

    const secret = process.env.USER_KEY_ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error('Encryption secret not configured');
    }

    const encryptedKey = encrypt(api_key, secret);

    const { error } = await supabase
      .from('user_provider_keys')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_key: encryptedKey,
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) {
      return NextResponse.json({ error: 'キーの保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラー' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json({ error: 'providerは必須です' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_provider_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      return NextResponse.json({ error: 'キーの削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラー' },
      { status: 500 }
    );
  }
}
