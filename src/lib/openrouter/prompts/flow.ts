import type { GenerateFlowRequest } from '@/types';

export function buildFlowPrompt(params: GenerateFlowRequest & { topic: string }): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  const difficultyGuide = params.difficulty
    ? `難易度は「${params.difficulty === 'beginner' ? '初心者向け' : params.difficulty === 'intermediate' ? '中級者向け' : '上級者向け'}」とする。`
    : '';

  return [
    {
      role: 'system',
      content: `あなたは学習用の知識構造を生成する専門家です。ユーザーが指定したトピックについて、if-then型のハンドブック（フロー）を作成してください。
ステップごとに分岐条件を含め、学習者が状況に応じて適切な手順を選べるように構成してください。
日本語で回答してください。`,
    },
    {
      role: 'user',
      content: `トピック「${params.topic}」について、if-then型のハンドブックを生成してください。
${difficultyGuide}

以下のJSON形式で出力してください。他の説明文は不要です。

{
  "title": "トピックのハンドブックタイトル",
  "nodes": [
    {
      "title": "ステップ名",
      "summary": "このステップの概要",
      "content": "詳細な手順と説明",
      "order_index": 0
    }
  ],
  "edges": [
    {
      "from_title": "遷移元ステップ名",
      "to_title": "遷移先ステップ名",
      "label": "条件や説明（例：エラーが発生した場合）"
    }
  ]
}`,
    },
  ];
}
