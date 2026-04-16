# concierge-v5 公開版 完全パッケージ

この ZIP は、**https://selfeelshinjuku.github.io/concierge-v5/** のデザイン感を基準に、実データへ差し替えた GitHub 配置用の公開版パッケージです。

## この版で反映したこと

- v5 基準の黒系ヘッダー / 固定フッター / カードUI
- v5 のミニふじくん画像をそのまま同梱
- 症状選択 → 属性確認 → コース提案 → 時間選択 → 組み合わせ提案 → オプション追加 → 最終確認
- 添付資料を元にした **男性用 / 女性用コース・オプション実データ** を反映
- `メンズブースト` の **49歳以下制限**
- `240分 → 4時間` などの時間表示
- 将来条件を追加しやすい `conditions` / `pricingOptions` ベース設計
- オプションは原則 **コース時間内対応** として実装

## 使い方

1. ZIP を展開
2. 中身をそのまま GitHub リポジトリ直下へ配置
3. `index.html` がトップページとして起動
4. `assets/js/config.js` の `reservationFormUrl` を実運用のフォーム URL に差し替え

## ディレクトリ構成

- `index.html` : 実際に動く予約コンシェルジュ本体
- `assets/css/style.css` : v5 基調の UI
- `assets/js/app.js` : 画面進行・時間選択・予約コピー処理
- `assets/js/recommendation.js` : フィルタ・優先表示ロジック
- `assets/js/utils.js` : 共通関数
- `assets/js/config.js` : フォーム遷移先設定
- `assets/img/` : v5 ベースのミニふじくん画像
- `data/*.json` : 症状 / コース / オプション / 会話文言マスター
- `docs/` : 仕様書・補足メモ
- `checklists/` : 受け渡し確認用

## 補足

- 公開前に `assets/js/config.js` のフォーム URL を差し替えると、そのまま公開利用できます。
- ローカルで JSON を読む場合は GitHub Pages か簡易サーバー経由を推奨します。
