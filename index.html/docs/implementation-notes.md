# 実装メモ（v5復元版）

- 基本 UI は concierge-v5 の世界観を維持
- ミニふじくん画像は v5 公開版と同系統の PNG を同梱
- 将来の出し分けは `data/*.json` の `gender`, `ageMin`, `ageMax`, `conditions`, `symptomWeights`, `segmentWeights` を追加するだけで拡張可能
- 49歳以下制限の例は `mens_boost` に実装済み
- フェイシャル優先は `category: facial` と `symptomWeights` + `categoryBoost` で制御
- 最終確認ではコピー文面を作り、フォーム URL が設定済みなら別タブ遷移
