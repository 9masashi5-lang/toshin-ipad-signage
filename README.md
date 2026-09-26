# 東進 校舎受付 iPad デジタルサイネージ

校舎PCの `/admin` から表示内容を変更し、受付iPadの `/display` へリロードなしで即時反映する、独立運用のデジタルサイネージWebアプリです。

このリポジトリは既存の生徒管理・スケジュール管理サイトとは完全に別です。既存サイトのコード、Firebase、データは使用しません。

## 1. 今回作ったもの

- `/admin`：校舎スタッフ向け管理画面
- `/display`：iPad横向き・常時表示向けサイネージ画面
- 3つの表示モード：ランキング、重要なお知らせ、カウントダウン
- 通常表示で複数のランキングスライドを5秒ごとに自動切替
- ランキングの表示値は数字だけでなく「1800点」「全国1位」などの文字にも対応
- ランキングスライドごとに6種類の背景デザインを選択
- Firestore `onSnapshot` によるリアルタイム切替
- Firebase Authentication（メールアドレス＋パスワード）
- Firestore Security Rules による書き込み制限
- 通信エラー時に最後の正常表示を維持するキャッシュ
- Firebase未設定でも2タブ同期を確認できる、明示的なローカルデモモード

## 2. 使用技術

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- Firebase公式Web SDK
  - Cloud Firestore
  - Firebase Authentication
- Vercel（公開先）

Firebase SDKはブラウザ用の公式モジュラーSDKを使用しています。サーバーや独自APIを増やさず、Phase 1で必要な構成に絞っています。

## 3. ファイル構成と役割

```text
toshin-ipad-signage/
├─ public/
│  └─ favicon.svg                 サイネージ専用アイコン
├─ src/
│  ├─ app/
│  │  ├─ admin/page.tsx           /admin ルート
│  │  ├─ display/page.tsx         /display ルート
│  │  ├─ globals.css              共通デザイン・サイネージ表示
│  │  ├─ layout.tsx               メタデータ・viewport
│  │  └─ page.tsx                 / から /display へ移動
│  ├─ components/
│  │  ├─ admin/
│  │  │  ├─ admin-dashboard.tsx   ランキング・お知らせ・日付の編集UI
│  │  │  └─ auth-gate.tsx         管理者ログイン
│  │  └─ display/
│  │     ├─ ranking-display.tsx   ランキング表示（後から差し替え可能）
│  │     ├─ ranking-slideshow.tsx 5秒間隔のランキング自動切替
│  │     ├─ notice-display.tsx    タイトル・本文のお知らせ表示
│  │     ├─ countdown-display.tsx 残り日数の自動計算表示
│  │     ├─ signage-canvas.tsx    modeに応じた表示切替
│  │     └─ display-screen.tsx    全画面・接続状態表示
│  ├─ hooks/use-signage.ts        リアルタイム購読用React Hook
│  ├─ lib/
│  │  ├─ firebase.ts              Firebase初期化・永続キャッシュ
│  │  ├─ signage-store.ts         Firestore購読・更新
│  │  └─ countdown.ts             日本時間基準の残日数計算
│  └─ types/signage.ts            データ型・安全な初期値
├─ .env.example                   必要な環境変数の見本
├─ firebase.json                  Firebase CLI設定
├─ firestore.rules               Firestore Security Rules
└─ firestore.indexes.json         Firestore index設定
```

## 4. Firebaseのデータ構造

表示に必要な情報は1つのドキュメントにまとめます。表示切替と内容が1回の更新で揃い、iPadが途中状態を受け取りにくいためです。

```text
signage/current
{
  mode: "ranking" | "notice" | "countdown",
  ranking: {
    title: "今週のランキング",
    entries: [
      { id: "rank-1", name: "山田さん", score: "1800点" }
    ]
  },
  rankingSlides: [
    {
      title: "今週のランキング",
      backgroundTheme: "navy",
      entries: [
        { id: "rank-1", name: "山田さん", score: "1800点" }
      ]
    },
    {
      title: "高速マスターランキング",
      backgroundTheme: "green",
      entries: [
        { id: "slide-2-rank-1", name: "鈴木さん", score: "全国1位" }
      ]
    }
  ],
  notice: {
    title: "重要なお知らせ",
    message: "...",
    messageSize: "medium"
  },
  countdown: {
    title: "共通テストまで",
    targetDate: "2027-01-16",
    message: "今日も一歩ずつ。"
  },
  updatedAt: Timestamp
}
```

`rankingSlides` は最大10枚です。`/display` は上から順に5秒ずつ表示します。`score` は最大40文字の文字列で、「1800」「1800点」「全国1位」などを入力できます。数字だけの場合は表示時に3桁区切りになります。既存の数値データも自動的に文字列へ変換して表示します。各スライドの `backgroundTheme` には `navy`、`blue`、`green`、`red`、`gold`、`light` のいずれかを保存します。既存データとの互換性のため `ranking` には第1スライドも保存し、古いデータに `rankingSlides` や `backgroundTheme` がない場合は既存ランキングとネイビー背景を使用します。重要なお知らせの `messageSize` は `small`、`medium`、`large`、`xlarge` の4段階です。古いデータにこの項目がない場合は `medium` を使用します。重要なお知らせとカウントダウンの操作は必要なフィールドだけを更新するため、一度表示すると「通常表示（ランキング）に戻す」を押すまで固定表示されます。

管理者判定用ドキュメント：

```text
admins/{Firebase Authentication の UID}
{
  role: "admin"
}
```

`admins` はブラウザから読み書きできません。Firebase Consoleで管理します。

## 5. セキュリティ設計

### Firestore Security Rules

`firestore.rules` は次を強制します。

- `signage/current` はiPad表示用に未ログインでも読み取り可能
- 書き込みは「Firebase Authenticationにログイン済み」かつ `admins/{uid}` が存在する利用者だけ
- mode、各フィールド、ランキング件数などの基本構造を検証
- ドキュメント削除は禁止
- それ以外の全コレクションは拒否

`/display` のコードには書き込み操作がなく、Rulesでも未認証書き込みを拒否します。URLを知っているだけでは `/admin` から本番データを書き換えられません。

公開データには生徒の個人情報、成績の詳細、外部公開できない情報を保存しないでください。ランキング名は本名ではなく、校舎で定めた公開可能な表記を推奨します。

## 6. Phase 1の無料運用方針

Phase 1ではFirebase Cloud Storageを使用しません。画像アップロード・画像表示は実装対象外とし、Firebase AuthenticationとCloud Firestoreを中心に、可能な限り無料枠で運用します。重要なお知らせはタイトル、本文、本文の文字サイズで構成します。

## 7. まずローカルだけで確認する方法

現在の `.env.local` は明示的なローカルデモモードです。Firebaseへは接続せず、同じブラウザのタブ間で表示切替を確認できます。

```powershell
cd "C:\Users\msst3\OneDrive\ドキュメント\ChatGPT\計画サイト\toshin-ipad-signage"
npm install
npm run dev
```

ブラウザで次を別タブに開きます。

- 管理画面: `http://localhost:3000/admin`
- サイネージ: `http://localhost:3000/display`

確認手順：

1. `/display` がランキング表示であることを確認
2. `/admin` でランキングスライドを2枚以上登録して保存
3. `/display` が約5秒ごとに自動で切り替わることを確認
4. `/admin` で重要なお知らせを入力
5. 「重要なお知らせを今すぐ表示」を押す
6. `/display` が再読み込みなしで切り替わることを確認
7. 「通常表示（ランキング）に戻す」を押す
8. `/display` がランキングの自動切替へ戻ることを確認

デモモードはUI確認専用です。本番Vercelでは絶対に有効にしないでください。

## 8. ここからはユーザー側で必要：Firebase初期設定

Firebaseのプロジェクト作成、料金プラン同意、管理者パスワードの決定はユーザー本人の操作が必要です。既存Firebaseは選ばず、必ず新規作成してください。

### 8-1. 新しいFirebaseプロジェクトを作る

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. 「プロジェクトを追加」を押す
3. 例として `toshin-ipad-signage` のような、このアプリ専用名を入力
4. Google AnalyticsはPhase 1では不要なので無効でも可
5. 作成完了後、その新しいプロジェクトだけを使用

### 8-2. Webアプリを登録し、環境変数を取得する

1. Firebase Consoleのプロジェクト概要で Web アイコン `</>` を押す
2. アプリのニックネームに `signage-web` などを入力
3. Firebase HostingはVercelを使うため、ここでは設定不要
4. 「アプリを登録」を押す
5. 表示された `firebaseConfig` から次の値をコピー
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `messagingSenderId`
   - `appId`
6. `.env.example` をコピーして `.env.local` を作り、対応する欄へ入力
7. `NEXT_PUBLIC_ENABLE_DEMO_MODE=false` にする

`.env.local` の完成形：

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=コピーしたapiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=コピーしたauthDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=コピーしたprojectId
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=コピーしたmessagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=コピーしたappId
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
```

Firebase Web設定値はクライアント識別用であり、それ自体を秘密鍵として扱う設計ではありません。実際のアクセス制御はAuthenticationとSecurity Rulesで行います。ただし `.env.local` はGitへコミットしません。

### 8-3. Cloud Firestoreを有効にする

1. 左メニュー「構築」→「Firestore Database」
2. 「データベースの作成」
3. **本番環境モード** を選択
4. データベースIDは `(default)`
5. ロケーションは校舎に近い東京系リージョンを選択（作成後に変更しにくいので確認）
6. 「作成」

`signage/current` は、管理者設定後に管理画面で最初の表示操作を行うと自動作成されます。

### 8-4. Authenticationを設定する

1. 左メニュー「構築」→「Authentication」
2. 「始める」
3. 「Sign-in method」→「メール/パスワード」
4. 「メール/パスワード」を有効化して保存
5. 「Users」タブ→「ユーザーを追加」
6. 校舎管理用メールアドレスと十分に強いパスワードを設定
7. 作成されたユーザーの **UID** をコピー
8. Authenticationの設定にある「承認済みドメイン」で `localhost` と、後で発行されるVercelドメインを許可

このアプリには管理者の新規登録画面を置いていません。勝手に管理者アカウントを増やせないようにするためです。

### 8-5. 管理者UIDをFirestoreへ登録する

1. Firestore Database→「データ」タブ
2. 「コレクションを開始」
3. コレクションIDに `admins`
4. ドキュメントIDに、先ほどコピーしたAuthenticationのUIDをそのまま貼る
5. フィールドを追加
   - フィールド: `role`
   - タイプ: string
   - 値: `admin`
6. 保存

### 8-6. Security Rulesを反映する

方法A（初心者向け）：Firebase Consoleで「Firestore Database」→「ルール」を開き、このリポジトリの `firestore.rules` を貼り付けて「公開」を押します。

方法B（Firebase CLI）：

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore
```

`use --add` では今回新しく作成したFirebaseプロジェクトだけを選択してください。CLIからのデプロイはConsole上のRulesを上書きするため、以後はこのリポジトリのRulesを正本にします。

## 9. Firebase接続後のローカル確認

1. `.env.local` の実値と `NEXT_PUBLIC_ENABLE_DEMO_MODE=false` を確認
2. 開発サーバーをいったん停止し、`npm run dev` で再起動
3. `/admin` を開く
4. 作成した管理者メールアドレスとパスワードでログイン
5. `/display` を別タブで開く
6. ランキング、お知らせ、カウントダウンを順に表示
7. 「通常表示（ランキング）に戻す」を確認

エラー確認も行います。

- Wi-Fiを一時的に切ったとき、最後の正常表示が残る
- ログアウト後は管理画面操作ができない

## 10. GitHubへ保存する方法

このフォルダ内には専用の `.git` があり、独立したローカルリポジトリとして初期化済みです。

1. GitHubで「New repository」
2. 例：Repository name `toshin-ipad-signage`
3. Public / Privateを選ぶ（校舎用途ではPrivate推奨）
4. README追加などは選ばず空のリポジトリを作成
5. GitHubに表示されるURLをコピー
6. このプロジェクトフォルダで実行

```powershell
git add .
git commit -m "Initial digital signage app"
git remote add origin https://github.com/あなたのユーザー名/toshin-ipad-signage.git
git push -u origin main
```

`.env.local` は `.gitignore` 対象です。パスワードや個別設定値をREADMEやソースへ書かないでください。

## 11. Vercelへ公開する方法

1. [Vercel](https://vercel.com/) にGitHubでログイン
2. 「Add New」→「Project」
3. 今作った `toshin-ipad-signage` リポジトリだけをImport
4. Framework Presetが Next.js であることを確認
5. 「Environment Variables」に `.env.local` と同じ5つのFirebase値を登録
6. `NEXT_PUBLIC_ENABLE_DEMO_MODE` は `false` を登録（または登録しない）
7. Deploy
8. 発行された `https://...vercel.app` を開く
9. Firebase Authentication→Settings→Authorized domainsへ、そのVercelドメインを追加
10. `/admin` でログイン、`/display` でリアルタイム切替を再確認

以後、GitHubの `main` ブランチへpushするとVercelが自動デプロイします。

## 12. iPadで実際に運用する方法

1. iPadを校舎の安定したWi-Fiへ接続
2. Safariで `https://あなたのVercelドメイン/display` を開く
3. 横向きにして向きをロック
4. 必要に応じて「ホーム画面に追加」し、そこから起動
5. iPad設定で自動ロックを「なし」または校舎運用に合う長さへ設定
6. 誤操作防止が必要ならアクセスガイドを使用
7. 充電しながら常設する場合は、発熱・ケーブル負荷・バッテリー状態を定期確認
8. 校舎PCでは `/admin` を開き、変更操作を行う
9. 営業終了時や緊急表示終了時は「通常表示（ランキング）に戻す」

Safariを再読み込みする必要はありません。Firestore接続が回復すれば最新状態を受信します。一時的な通信障害中は、Firebaseの永続キャッシュとアプリの最終正常データを使って直前の画面を維持します。

## 13. 開発用コマンド

```powershell
npm run dev     # 開発サーバー
npm run lint    # ESLint
npm run build   # 本番ビルド・型チェック
npm run start   # 本番ビルドをローカル起動
```

## 14. 将来の拡張候補

現在の `SignageCanvas` と各表示コンポーネントを分離しているため、次の機能を追加しやすい構成です。

- 掲載開始・終了日時
- 30分後にランキングへ自動復帰
- 複数のお知らせ
- ランキング自動更新
- 時間帯による表示変更
- 複数iPadの個別制御
- QRコード表示

Phase 1では過剰設計を避け、`PC /admin → Firebase → iPad /display` の基本動作を優先しています。
