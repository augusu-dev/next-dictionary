import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Tree生成はPhase 2で実装予定です' },
    { status: 501 }
  );
}
