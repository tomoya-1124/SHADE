# SHADE

SHADE は、美容・外見・生活習慣・行動変化を記録し、自分の **Presence（存在感）** を静かに高めるための自己管理アプリ MVP です。

黒基調の都市的なダーク UI で、一般的な健康管理では拾いにくい「見た目」「雰囲気」「自信」「社会での反応」を記録します。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hooks (`useState`, `useEffect`, `useMemo`)
- localStorage 永続化
- Supabase PostgreSQL (`daily_logs`) へのDaily Log保存・取得

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

Supabaseを使う場合は、先に `.env.local` を作成してください。未設定の場合はlocalStorageのみで動作します。

## ビルド / 型チェック

```bash
npm run typecheck
npm run build
```

## MVP 機能

### Dashboard

- 今日相当の最新ログの総合 Presence Score を表示
- Face / Body / Mind / Food / Presence の簡易スコアを表示
- 直近ログ一覧を表示
- Quest の達成数を表示

### Daily Log 作成

以下のカテゴリを 1〜5 スコア、真偽値、任意数値、写真、メモで記録できます。

- Face: 肌、髪、眉、疲労感、むくみ
- Body: 筋トレ、体重、姿勢
- Food: お菓子、ジュース、炭水化物控えめ、野菜、水分量
- Mind: メンタル、自信、ストレス
- Presence: 黒服が似合っていた感覚、堂々感、人目が気にならなかった度、店に入りやすかった度
- Photo: 顔コンディション、髪型、コーデ、全体の雰囲気
- Memo: 今日のメモ、良かった点、明日の修正点

### Quest

指定された Presence Quest の達成状態、達成日、達成メモを記録できます。難易度は星数に応じて控えめに強調され、★3以上は高難度として表示されます。

- ひとりでスタバに入る
- 古着屋に入る
- 黒T / 黒パーカーが似合う
- まつ毛サロンに通う
- 少し高めのレストラン・ホテルに入る
- 女の子とデートする
- 高級ショップで買い物する
- 逆ナンされる
- 芸能人スカウトに声をかけられる
- スナップ依頼される

### Log 一覧

- Daily Log を日付順で表示
- 各ログの写真サムネイル、総合スコア、カテゴリ別スコアを表示
- クリックで写真、各入力値、メモ、良かった点、明日の修正点を含む詳細パネルを展開
- 2つのログを選択して Before / After 比較を表示
- 写真、日付、総合スコア、カテゴリ別スコア、スコア差分を横並びで確認

### Presence Trend / 状態コメント

- Dashboard と Logs に直近7件程度の Presence 推移をCSSバーで表示
- Dashboard にスコアに応じた固定ロジックの状態コメントを表示
- 自己否定ではなく、原因分析と次の修正点に寄せた文言にしています

## データ保存

Daily Log は Supabase PostgreSQL への保存・取得に対応しています。Supabase保存に失敗した場合でも、localStorageバックアップは維持されます。

localStorage には以下のキーで保存します。

- `shade.dailyLogs`: Daily Log、写真Data URL、メモ、各スコア入力
- `shade.quests`: Quest達成状態、達成日時、達成メモ

アプリ起動時は、Supabase接続が成功した場合は `daily_logs` テーブルのデータを優先して表示します。Supabaseが未設定、または取得に失敗した場合はlocalStorageデータを使用します。初回localStorageモードではサンプルログとデフォルトクエストが読み込まれます。

## Supabase 接続手順

### 1. パッケージ

`@supabase/supabase-js` を利用します。

```bash
npm install
```

### 2. `.env.local`

プロジェクトルートに `.env.local` を作成し、Supabase Project Settings の URL と anon key を設定してください。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Auth は今回未実装のため、`user_id` は `null` で保存します。画像Storageも未実装で、写真は既存MVP同様に `raw_data` 内のData URLとして保存されます。

### 3. SQL Editor

Supabase SQL Editor で以下を実行してください。

```sql
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date date not null,
  face_score int not null,
  body_score int not null,
  mind_score int not null,
  food_score int not null,
  presence_score int not null,
  total_score int not null,
  memo text,
  good_point text,
  improvement text,
  raw_data jsonb not null,
  created_at timestamp with time zone default now()
);
```

Row Level Security を有効にする場合は、匿名キーで `select` / `insert` できるポリシーを別途追加してください。MVP検証では、プロジェクトのセキュリティ方針に合わせてRLS設定を調整してください。

## 注意

写真はフロントエンドMVPとしてData URL形式でlocalStorageへ保存します。大きすぎる画像を多数保存するとブラウザの保存容量に達する可能性があるため、実運用では画像圧縮または外部ストレージ化を検討してください。
