# SHADE

SHADE は、美容・外見・生活習慣・行動変化を記録し、自分の **Presence（存在感）** を静かに高めるための自己管理アプリ MVP です。

黒基調の都市的なダーク UI で、一般的な健康管理では拾いにくい「見た目」「雰囲気」「自信」「社会での反応」を記録します。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hooks (`useState`, `useEffect`, `useMemo`)
- localStorage 永続化

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

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

以下のカテゴリを 1〜5 スコア、真偽値、任意数値、メモで記録できます。

- Face: 肌、髪、眉、疲労感、むくみ
- Body: 筋トレ、体重、姿勢
- Food: お菓子、ジュース、炭水化物控えめ、野菜、水分量
- Mind: メンタル、自信、ストレス
- Presence: 黒服が似合っていた感覚、堂々感、人目が気にならなかった度、店に入りやすかった度
- Memo: 今日のメモ、良かった点、明日の修正点

### Quest

指定された Presence Quest の達成状態を記録できます。

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
- 各ログの総合スコアとカテゴリ別スコアを表示
- クリックでメモ詳細を展開

## データ保存

フロントエンドのみの MVP として、以下の localStorage キーに保存します。

- `shade.dailyLogs`
- `shade.quests`

初回起動時はサンプルログとデフォルトクエストが読み込まれます。
