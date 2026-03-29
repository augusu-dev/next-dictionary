# Next Dictionary - セットアップ手順

## 前提

- Node.js 18+
- npm
- GitHubアカウント
- Googleアカウント（OAuth用）

---

## 1. Supabase プロジェクト作成

### 1-1. プロジェクト作成
1. https://supabase.com/dashboard にアクセス
2. **New Project** をクリック
3. プロジェクト名: `next-dictionary`
4. データベースパスワード: 強力なパスワードを設定（メモしておく）
5. Region: 東京（Northeast Asia）推奨
6. **Create new project** をクリック
7. プロジェクトが出来るまで待つ（1〜2分）

### 1-2. APIキーの取得
1. プロジェクトダッシュボードの左メニューから **Settings**（歯車アイコン）→ **API**
2. 以下をコピーしておく：
   - **Project URL** → これが `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** キー → これが `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** キー（Secretを表示） → これが `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ このキーは絶対に公開しないこと

### 1-3. データベースマイグレーション実行
1. 左メニューから **SQL Editor**
2. **New query** をクリック
3. `supabase/migrations/001_initial.sql` の内容を全部貼り付ける
4. **Run** をクリック
5. エラーが出ずに完了すればOK

### 1-4. Google OAuth 設定
1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択（なければ新規作成）
3. **APIとサービス** → **認証情報** → **認証情報を作成** → **OAuth クライアント ID**
   - アプリケーションの種類: **ウェブ アプリケーション**
   - 名前: `Next Dictionary`
   - 承認済みのリダイレクト URI:
     - `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
     （SupabaseのURLはSettings → APIのProject URLと同じ）
   - **作成** をクリック
   - **クライアント ID** と **クライアント シークレット** をコピー

4. Supabaseダッシュボードに戻る
5. **Authentication** → **Providers** → **Google**
6. 以下を入力：
   - Client ID: Google Consoleで取得したもの
   - Client Secret: Google Consoleで取得したもの
7. **Save** をクリック

### 1-5. Site URL設定（重要）
1. Supabaseダッシュボード → **Authentication** → **URL Configuration**
2. **Site URL** を `http://localhost:3000` に設定（開発時）
3. **Redirect URLs** に `http://localhost:3000/auth/callback` を追加
4. **Save**

---

## 2. OpenRouter APIキー取得（無料枠用）

1. https://openrouter.ai/ にアクセスしてアカウント作成
2. https://openrouter.ai/settings/keys にアクセス
3. **Create Key** をクリック
4. 名前: `next-dictionary-free`
5. 生成されたキー（`sk-or-...`）をコピー
   ⚠️ このキーは環境変数 `OPENROUTER_API_KEY_FREE` に設定する

---

## 3. 暗号化キー生成

ユーザーのAPIキーを暗号化するためのシークレットキーが必要。

ターミナルで以下を実行：
```bash
openssl rand -hex 32
```

出力された64文字の文字列が `USER_KEY_ENCRYPTION_SECRET` になる。

---

## 4. 環境変数設定

プロジェクトのルートディレクトリで `.env.local` ファイルを作成：

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# OpenRouter（無料枠用）
OPENROUTER_API_KEY_FREE=sk-or-v1-...

# 暗号化キー（上記3で生成したもの）
USER_KEY_ENCRYPTION_SECRET=abc123...
```

⚠️ `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

---

## 5. ローカル開発サーバー起動

```bash
npm install
npm run dev
```

http://localhost:3000 にアクセスして動作確認。

---

## 6. 動作確認チェックリスト

1. **Googleログイン**: ヘッダーの「Googleでログイン」ボタン → 認証画面 → リダイレクト
2. **Dictionary生成**: トピック入力（例：「機械学習」）→ 件数10 → 「生成する」
3. **結果閲覧**: 生成完了後、Project詳細ページに遷移 → 展開/折りたたみ動作
4. **編集**: summary や content の鉛筆アイコン → 編集 → 保存
5. **公開設定**: 「非公開」ボタン → 「公開中」に切替
6. **ダッシュボード**: 生成したProject一覧表示
7. **公開ライブラリ**: http://localhost:3000/library → 公開したProjectが表示される
8. **設定画面**: http://localhost:3000/settings → APIキー登録/削除

---

## 7. Vercel デプロイ（任意）

### 7-1. Vercelプロジェクト作成
1. https://vercel.com にアクセス → GitHubでログイン
2. **Add New** → **Project**
3. `augusu-dev/next-dictionary` をインポート
4. **Environment Variables** に `.env.local` と同じ値を設定
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY_FREE`
   - `USER_KEY_ENCRYPTION_SECRET`
5. **Deploy**

### 7-2. Supabase 本番URL設定
デプロイ後、SupabaseのURL設定を更新：
1. **Authentication** → **URL Configuration**
2. **Site URL** → `https://your-app.vercel.app`
3. **Redirect URLs** → `https://your-app.vercel.app/auth/callback` を追加
4. Google Console → リダイレクトURIに `https://<supabase-ref>.supabase.co/auth/v1/callback` が含まれていることを確認

---

## トラブルシューティング

### Googleログインが失敗する
- SupabaseのRedirect URLとGoogle ConsoleのリダイレクトURIが一致しているか確認
- Site URLが正しいか確認

### 生成が失敗する
- OpenRouter APIキーが有効か確認
- Supabaseのテーブルが正しく作成されているか（SQL Editorで `\dt`）
- ブラウザのコンソールとサーバーのログを確認

### 環境変数が読み込まれない
- `.env.local` がプロジェクトルートにあるか
- `NEXT_PUBLIC_` プレフィックスが必要な変数についているか
- サーバーを再起動（`npm run dev` をやり直す）
