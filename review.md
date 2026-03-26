# plan.md レビュー

## Findings

### 1. `countries` レイヤーのハイライト方法が未定義で、このままだと全国家が同じ色になる
- 対象: [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L40) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L41)
- `countries` レイヤーで「選択済み国だけ fill を `#f4a460` に変更」とありますが、実装方法が計画にありません。
- 現状の `countries` は全 feature を 1 つの `GeojsonLayer` で描画しているため、単純に `attr.fill` を差し替えると全国家が同色になります。
- このライブラリは `attr.fill` に関数を渡せるので、`selectedKeySet` を使った条件分岐か、選択済み国だけ別レイヤーで重ねる方針を計画に明記した方が安全です。

### 2. 重複判定キーの定義が分散しており、`-99` フォールバックとの整合が崩れやすい
- 対象: [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L45) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L48) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L66) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L69)
- Step 5 では `ISO_A3` で重複チェック、設計上のポイントでは `ISO_A3 === "-99"` のとき `NAME` をフォールバックキーにするとあります。
- ただしこのキー定義が helper として明文化されていないため、重複判定、ハイライト判定、削除対象特定が別々の条件になりやすいです。
- `getCountryKey(feature)` を先に定義し、state にも `countryKey` を保持する計画にした方が実装のぶれを防げます。

### 3. 選択済み国のバッファ距離を変更する手段がなく、UI期待とずれる可能性がある
- 対象: [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L45) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L49) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L67) [plan.md](/home/shimizu/_tools/geo_buffer_export/plan.md#L76)
- 計画では追加時に `bufferGeoJSON` をキャッシュし、同じ国の再追加は重複として拒否します。
- この仕様だと、一度選んだ国について距離入力を変えても再計算できません。削除して再選択すれば済む、という仕様なら明記が必要です。
- 想定 UX が「同じ国を再クリックしたら距離更新」なのか「削除して入れ直し」なのかを決めておかないと、実装後に挙動差分が出ます。

## Open Questions
- `findCountryAtPoint()` が国境線上をクリックしたとき、最初にヒットした feature を採用する仕様でよいか。
- `coords` 表示はそのまま残すのか。国選択中心 UI に寄せるなら、国名表示へ変える選択肢もあります。

## Summary
- 方向性自体は妥当です。
- ただし `selected country の識別キー` と `ハイライトの描画方式` は、実装前に計画へ追記しないと手戻りが出やすいです。
