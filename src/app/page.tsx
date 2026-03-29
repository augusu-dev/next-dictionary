import { GenerateForm } from '@/components/generate/generate-form';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Next Dictionary
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          学習のための知識構造を生成・管理するサービス。
          トピックを入力するだけで、用語集・階層構造・フローなどの形式で知識を整理できます。
        </p>
      </div>
      <GenerateForm />
    </div>
  );
}
