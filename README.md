# SHADE

SHADE は、美容・外見・生活習慣・行動変化を記録し、自分の **Presence（存在感）** を静かに高めるための自己管理アプリ MVP です。

黒基調の都市的なダーク UI で、一般的な健康管理では拾いにくい「見た目」「雰囲気」「自信」「社会での反応」を記録します。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hooks (`useState`, `useEffect`, `useMemo`)
- localStorage 永続化
- Supabase Auth / PostgreSQL (`daily_logs`) / Storage (`shade-log-images`)

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

起動前に `.env.local` を作成してください。`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定の場合は明示的にエラーになります。

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

Daily Log はログイン済みユーザーの `user_id` に紐づけて Supabase PostgreSQL へ保存・取得します。画像は Supabase Storage の `shade-log-images` bucket にアップロードし、`daily_logs.raw_data.photo.storagePath` にパスを保存します。Supabase保存に失敗した場合でも、localStorageバックアップは維持されます。

localStorage には以下のキーで保存します。

- `shade.dailyLogs.<user_id>`: Daily Log、写真Data URL、Storage path、メモ、各スコア入力
- `shade.quests`: Quest達成状態、達成日時、達成メモ

ログイン後のアプリ起動時は、Supabase接続が成功した場合は自分の `user_id` の `daily_logs` データを優先して表示します。Supabase取得に失敗した場合はユーザー別localStorageデータを使用します。

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

Vercelにdeployする場合も、Project Settings → Environment Variables に同じ2つを登録します。

### 3. Auth

Supabase Dashboard → Authentication → Providers で Email provider を有効にしてください。SHADEはMagic Linkログインを使います。

Vercel deploy後は Authentication → URL Configuration に以下を設定してください。

- Site URL: `https://your-vercel-app.vercel.app`
- Redirect URLs: `https://your-vercel-app.vercel.app/**`

ローカル検証では `http://localhost:3000/**` もRedirect URLsへ追加してください。

### 4. SQL Editor: `daily_logs`

Supabase SQL Editor で以下を実行してください。

```sql
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
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

alter table daily_logs enable row level security;

create policy "Users can read own daily logs"
on daily_logs
for select
using (auth.uid() = user_id);

create policy "Users can insert own daily logs"
on daily_logs
for insert
with check (auth.uid() = user_id);

create policy "Users can update own daily logs"
on daily_logs
for update
using (auth.uid() = user_id);

create policy "Users can delete own daily logs"
on daily_logs
for delete
using (auth.uid() = user_id);
```

### 5. Storage bucket

Supabase Dashboard → Storage で以下のbucketを作成してください。

- bucket名: `shade-log-images`
- 本運用は private bucket 推奨
- 保存path: `user_id/yyyy-mm-dd/timestamp-filename`

SHADEの実装は private bucket でも表示できるよう、取得時に signed URL を生成します。public bucketでも動きますが、本運用ではprivate bucketとRLS/Storage policyでユーザー単位に制限してください。

Storage policy例（`storage.objects` に対して `bucket_id = 'shade-log-images'` かつ path先頭が `auth.uid()` のものだけ操作可能にする方針）:

```sql
create policy "Users can read own log images"
on storage.objects
for select
using (
  bucket_id = 'shade-log-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can upload own log images"
on storage.objects
for insert
with check (
  bucket_id = 'shade-log-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own log images"
on storage.objects
for update
using (
  bucket_id = 'shade-log-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own log images"
on storage.objects
for delete
using (
  bucket_id = 'shade-log-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

### 6. Vercel deploy

1. GitHub repositoryをVercelへImport
2. Framework PresetはNext.js
3. Environment Variablesに以下を追加
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Build Commandは `npm run build`
5. Deploy後、Supabase AuthのSite URL / Redirect URLsをVercel URLへ更新

`next.config.ts` は標準設定のまま動作する構成です。画像はNext Image最適化ではなく通常の`img`で表示しているため、Supabase Storageドメインの追加設定は不要です。

## 注意

写真はSupabase Storageへアップロードし、localStorageにはバックアップとしてData URLも残します。大きすぎる画像を多数保存するとブラウザの保存容量に達する可能性があるため、本運用ではアップロード前の画像圧縮を検討してください。
