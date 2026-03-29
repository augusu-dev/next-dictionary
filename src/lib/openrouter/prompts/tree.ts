import type { GenerateTreeRequest } from '@/types';

export function buildTreePrompt(params: GenerateTreeRequest & { topic: string }): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  const depthGuide = params.depth
    ? `階層の深さは最大${params.depth}レベルとする。`
    : '階層の深さは最大3レベルとする。';

  const difficultyGuide = params.difficulty
    ? `難易度は「${params.difficulty === 'beginner' ? '初心者向け' : params.difficulty === 'intermediate' ? '中級者向け' : '上級者向け'}」とする。`
    : '';

  return [
    {
      role: 'system',
      content: `あなたは学習用の知識構造を生成する専門家です。ユーザーが指定したトピックについて、概念の階層構造を作成してください。
上位概念から下位概念へと整理し、学習の順序が自然になるように構成してください。
日本語で回答してください。`,
    },
    {
      role: 'user',
      content: `トピック「${params.topic}」について、概念の階層構造を生成してください。
${depthGuide}
${difficultyGuide}

以下のJSON形式で出力してください。他の説明文は不要です。

{
  "title": "トピックの階層構造タイトル",
  "nodes": [
    {
      "title": "概念名",
      "summary": "1〜2文の簡潔な説明",
      "content": "詳しい説明",
      "level": 0,
      "order_index": 0
    }
  ],
  "edges": [
    {
      "from_title": "親概念名",
      "to_title": "子概念名"
    }
  ]
}

ルートノードはlevel 0とし、子ノードは親よりlevelを1増やしてください。
order_indexは同じレベル内での順序です。`,
    },
  ];
}
