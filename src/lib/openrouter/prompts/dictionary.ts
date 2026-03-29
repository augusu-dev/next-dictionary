import type { DictionaryPromptParams } from '@/types';

export function buildDictionaryPrompt(params: DictionaryPromptParams): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  const difficultyGuide = params.difficulty
    ? `難易度は「${params.difficulty === 'beginner' ? '初心者向け：専門用語を避け、日常的な言葉で説明する' : params.difficulty === 'intermediate' ? '中級者向け：基本的な専門用語を使い、関連概念への言及を含む' : '上級者向け：高度な専門用語を使用し、深い理解を前提とした説明'}」とする。`
    : '';

  return [
    {
      role: 'system',
      content: `あなたは学習用の知識構造を生成する専門家です。ユーザーが指定したトピックについて、学習に適した用語集を作成してください。
各用語について、学習者の理解を助けるように正確かつ明確に説明してください。
日本語で回答してください。`,
    },
    {
      role: 'user',
      content: `トピック「${params.topic}」について、主要な用語を${params.count}件生成してください。
${difficultyGuide}

以下のJSON形式で出力してください。他の説明文は不要です。

{
  "title": "トピックの用語集タイトル",
  "nodes": [
    {
      "title": "用語名",
      "summary": "1〜2文の簡潔な説明",
      "content": "3〜5文程度の詳しい説明。定義、重要性、関連概念、具体例などを含める"
    }
  ]
}`,
    },
  ];
}
