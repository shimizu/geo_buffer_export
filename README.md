# Geo Buffer Export - 国バッファ描画ツール

地図上の国をクリックして選択し、turf.buffer() でバッファを生成・描画するツール。

https://shimizu.github.io/geo_buffer_export/

## 機能

- 国クリックで選択・ハイライト表示
- 選択した国のジオメトリにバッファを適用して描画
- 同じ国に異なる距離で複数バッファを追加可能
- 緯度・経度のセンタリング機能
- 複数の投影法に対応（Natural Earth、メルカトル、正射図法など）
- SVG / PNG エクスポート

## インストール

```bash
npm install
```

## 開発サーバーの起動

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```

## デプロイ

```bash
npm run deploy
```
