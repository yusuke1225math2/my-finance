# 家計入力アプリ 実装計画

## 概要

日々の支出をiPhone・ウェブ両対応で手軽に入力し、既存のGoogle Sheetsデータと統合する家計管理アプリ。

---

## 技術スタック

| レイヤー | 採用技術 | 理由 |
|---|---|---|
| フロントエンド | Next.js 14 (App Router) | Web + PWAでiPhone対応を一本化 |
| スタイル | Tailwind CSS + shadcn/ui | モバイルファーストのUI構築が速い |
| DB | Supabase (Free tier) | 認証・REST API・リアルタイム込み、無料 |
| 言語 | TypeScript | 既存GASコードと統一感 |
| ホスティング | Vercel (Free tier) | Next.jsとの親和性、自動デプロイ |

---

## リポジトリ構成

モノリポ（既存の `my-finance` リポジトリに追加）。

```
my-finance/
├── app/                        # ← 新規追加
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── (auth)/        # ログイン画面
│   │   │   ├── (app)/         # メインアプリ
│   │   │   │   ├── page.tsx   # 入力フォーム（トップ）
│   │   │   │   └── history/   # 入力履歴一覧
│   │   │   ├── api/           # API Routes
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── supabase.ts    # Supabaseクライアント
│   │   └── types/
│   ├── public/
│   │   └── manifest.json      # PWA設定
│   ├── package.json
│   └── next.config.ts
├── gmail-discord/              # 既存
├── rakuten/                    # 既存
├── tax/                        # 既存
├── ufj/                        # 既存
└── ...
```

---

## Supabase設計

### DBスキーマ

```sql
-- 支出テーブル
create table expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  date        date not null,
  amount      integer not null,          -- 円（整数）
  store       text not null,
  category    text,
  memo        text,
  created_at  timestamptz default now()
);

-- Row Level Security（自分のデータのみ読み書き可）
alter table expenses enable row level security;
create policy "own data only" on expenses
  using (auth.uid() = user_id);
```

### カテゴリ

既存Google Sheetsのカテゴリと統一する（食費・日用品・交通費・外食・娯楽・その他）。

---

## 機能スコープ

### MVP（まず作る）

- [ ] Supabase Authでログイン（Googleアカウント）
- [ ] 支出入力フォーム（日付・金額・店名・カテゴリ）
- [ ] 入力履歴一覧（直近30件）
- [ ] PWA対応（iPhoneのホーム画面に追加）

### 将来対応（MVP後）

- [ ] 月次集計・グラフ表示
- [ ] Google Sheetsへのエクスポート（既存パイプラインとの統合）
- [ ] レシート写真からのOCR自動入力
- [ ] 楽天・UFJ・SMFCの取込データと突合

---

## インフラ費用

| サービス | プラン | 費用 |
|---|---|---|
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| 合計 | | **$0/月** |

**注意点:**
- Supabase無料プランはDB直接接続（psql等）時にIPv4アドオン（$4/月、有料プランのみ）が必要。`supabase-js` SDK経由（HTTPS）で使う限り不要。
- Supabase無料プロジェクトは7日間アクセスなしで一時停止。毎日使う家計アプリなら実質停止しない。

---

## 実装ステップ

1. `app/` ディレクトリにNext.jsプロジェクト作成
2. Supabaseプロジェクト作成・スキーマ適用
3. Supabase Auth（Google OAuth）設定
4. 入力フォームUI実装
5. 履歴一覧実装
6. PWA設定（manifest.json + Service Worker）
7. Vercelデプロイ
