# 家計入力アプリ 実装計画

## 概要

日々の支出をiPhone・Android・ウェブ対応で手軽に入力し、既存のGoogle Sheetsデータと統合する家計管理アプリ。

---

## 技術スタック

| レイヤー | 採用技術 | 理由 |
|---|---|---|
| フロントエンド | Expo (React Native) | iOS・Android・Web を単一コードベースで対応 |
| スタイル | NativeWind (Tailwind CSS for RN) | Tailwind構文でネイティブUIを記述できる |
| DB | Supabase (Free tier) | 認証・REST API・リアルタイム込み、無料 |
| 言語 | TypeScript | 既存GASコードと統一感 |
| ビルド・配布 | EAS Build (Expo Application Services) | iOSシミュレータ・実機配布が無料枠で可能 |

---

## リポジトリ構成

モノリポ（既存の `my-finance` リポジトリに追加）。

```
my-finance/
├── app/                            # ← 新規追加
│   ├── src/
│   │   ├── app/                   # Expo Router（ファイルベースルーティング）
│   │   │   ├── (auth)/
│   │   │   │   └── login.tsx      # ログイン画面
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx      # 入力フォーム（トップ）
│   │   │   │   └── history.tsx    # 入力履歴一覧
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── supabase.ts        # Supabaseクライアント
│   │   └── types/
│   ├── assets/
│   ├── app.json                   # Expoアプリ設定
│   ├── eas.json                   # EASビルド設定
│   └── package.json
├── gmail-discord/                  # 既存
├── rakuten/                        # 既存
├── tax/                            # 既存
├── ufj/                            # 既存
└── ...
```

---

## 画面仕様

### 画面1: 支出登録

4項目を入力して登録するシンプルなフォーム。

| 項目 | 入力UI | 備考 |
|---|---|---|
| 日付 | DatePicker | デフォルトは当日 |
| 店名 | テキスト入力 | 例: Amazon |
| カテゴリ | セレクトボックス | 食費・日用品・交通費・外食・娯楽・その他 |
| 金額 | 数値入力（円） | 例: 1,305 |

登録ボタンを押すとSupabaseに保存して入力欄をリセット。

**将来対応（OCR）:**
- レシート写真を添付するボタンを追加
- Supabase StorageにアップロードしてOCR APIに投げ、日付・店名・金額を自動入力

### 画面2: 全履歴

登録済みの支出を最新順に表示。

| 仕様 | 詳細 |
|---|---|
| 並び順 | 登録日時の降順（最新が最上部） |
| 表示形式 | テーブル（日付・店名・カテゴリ・金額） |
| ローディング | 無限スクロール（20件ずつ追加取得） |
| 実装 | Supabase `.range()` でページネーション |

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
- [ ] 画面1: 支出登録（日付・店名・カテゴリ・金額の4項目）
- [ ] 画面2: 全履歴（最新順、無限スクロール）
- [ ] iOS・Android・Webで動作（Expo Go / EAS Build）

### 将来対応（MVP後）

- [ ] レシート写真の添付
- [ ] OCRによる日付・店名・金額の自動入力
- [ ] 月次集計・グラフ表示
- [ ] Google Sheetsへのエクスポート（既存パイプラインとの統合）
- [ ] 楽天・UFJ・SMFCの取込データと突合

---

## インフラ費用

| サービス | プラン | 費用 |
|---|---|---|
| Supabase | Free | $0 |
| EAS Build | Free (月30ビルドまで) | $0 |
| 合計 | | **$0/月** |

**注意点:**
- Supabase無料プランはDB直接接続（psql等）時にIPv4アドオン（$4/月、有料プランのみ）が必要。`@supabase/supabase-js` SDK経由（HTTPS）で使う限り不要。
- Supabase無料プロジェクトは7日間アクセスなしで一時停止。毎日使う家計アプリなら実質停止しない。
- App Store / Google Play公開はそれぞれApple Developer Program（$99/年）・Google Play（$25/初回）が必要。個人利用のみならExpo GoまたはEAS内部配布で無料。

---

## 実装ステップ

1. `app/` ディレクトリにExpoプロジェクト作成（`npx create-expo-app`）
2. Expo Router・NativeWindセットアップ
3. Supabaseプロジェクト作成・スキーマ適用
4. Supabase Auth（Google OAuth）+ Expo設定
5. 画面1: 支出登録フォーム実装
6. 画面2: 全履歴（無限スクロール）実装
7. EAS Buildで iOS・Android 実機確認
