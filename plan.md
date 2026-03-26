# 国バッファ生成アプリへの変換計画

## Context
現在のアプリは「地図クリックで大圏円を配置する」ツール。これを「クリックした国のジオメトリに turf.buffer() でバッファを適用する」アプリに変換する。`@turf/turf` v7.3.4 は既にインストール済み。world.geojson には `NAME_JA`（日本語名）、`ISO_A3`（国コード）等のプロパティあり。

## 変更対象ファイル
1. **`src/index.js`** — メインロジック（大部分の変更）
2. **`src/index.html`** — UIラベル・説明文の更新
3. **`src/index.scss`** — 軽微な調整のみ

---

## 実装ステップ

### Step 1: index.js — import・state変更
- `import * as turf from '@turf/turf'` を追加
- `state.circles` → `state.selectedCountries` に変更
  - 各要素: `{ countryKey, feature, isoA3, name, nameJa, bufferDistance, bufferGeoJSON }`
- `EARTH_RADIUS_KM` 定数と `createGeoCircle()` 関数を削除

### Step 2: 国特定・バッファ生成関数の新設
```js
// 国の一意キーを返す（ISO_A3が"-99"の領土はNAMEをフォールバック）
function getCountryKey(feature) {
  const iso = feature.properties.ISO_A3;
  return iso && iso !== '-99' ? iso : feature.properties.NAME;
}

function findCountryAtPoint(lngLat) {
  const point = turf.point(lngLat);
  for (const feature of state.geojson.features) {
    if (turf.booleanPointInPolygon(point, feature)) return feature;
  }
  return null;
}

function createCountryBuffer(feature, distanceKm) {
  return turf.buffer(feature, distanceKm, { units: 'kilometers' });
}
```
- `getCountryKey()` は重複判定・ハイライト判定・削除対象特定のすべてで使用する

### Step 3: updateCircleList → updateCountryList に改修
- 国名（`nameJa`）+ ISO_A3 + バッファ距離を表示
- 緯度/経度合わせボタン（align-circle）を削除、削除ボタンのみ残す

### Step 4: draw() 関数の改修
- **countriesレイヤー**: `attr.fill` に関数を渡し、選択済み国のみハイライト表示する
  ```js
  const selectedKeySet = new Set(state.selectedCountries.map(c => c.countryKey));
  // GeojsonLayer の attr.fill に関数を渡す
  fill: (d) => selectedKeySet.has(getCountryKey(d)) ? '#f4a460' : '#c8dbbe'
  ```
- **円レイヤー → バッファレイヤー**: `state.selectedCountries` の `bufferGeoJSON` を FeatureCollection にまとめて GeojsonLayer で描画
- 中心マーカー描画を削除

### Step 5: クリックハンドラの改修
- 座標から `findCountryAtPoint()` で国を特定
- 海上クリックは無視（`return`）
- `getCountryKey()` で重複チェック（同じ国の再クリックは重複として拒否。距離を変えたい場合は削除→再選択）
- `createCountryBuffer()` でバッファ計算 → `countryKey` を含めて state に追加 → `draw()`

### Step 6: クリアボタン等のハンドラ修正
- `state.circles = []` → `state.selectedCountries = []`

### Step 7: index.html のUI更新
- タイトル: 「Geo Buffer Export - 国バッファ描画ツール」
- ラベル: 「円の半径 (km)」→「バッファ距離 (km)」、デフォルト値 4000 → 500
- ヒント: 「地図をクリックして国を選択」
- クリアボタン: 「円をクリア」→「選択をクリア」
- 操作説明・計算方法の説明文をバッファに合わせて更新

### Step 8: index.scss の軽微調整
- `#circle-list` の `max-height` を増やす（複数国選択時の視認性向上）

---

## 設計上のポイント
- **バッファGeoJSONをキャッシュ**: draw()ごとの再計算を回避。追加時にのみ計算しstateに保持
- **一意キー**: `getCountryKey()` で統一管理。重複判定・ハイライト・削除すべてこの関数を経由
- **距離変更**: 同じ国の再クリックは重複として拒否。距離を変えたい場合は削除→再選択する仕様

## 検証方法
1. `npm run dev` で開発サーバー起動
2. 地図上の国をクリック → 国がハイライトされバッファが表示されることを確認
3. 複数国を選択 → リストに追加されることを確認
4. 同じ国を再クリック → 重複追加されないことを確認
5. バッファ距離を変更して別の国をクリック → 異なる距離のバッファが生成されることを確認
6. 「選択をクリア」→ 全てリセットされることを確認
7. SVG/PNGエクスポートが正常に動作することを確認
8. ロシア・カナダ等の大きな国でバッファ計算が完了することを確認
