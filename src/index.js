import './index.scss';
import * as d3 from 'd3';
import { Map as ThematikaMap, GeojsonLayer, GraticuleLayer, OutlineLayer } from 'd3-thematika';

// --- 状態管理 ---
const state = {
  geojson: null,
  projectionType: 'naturalEarth',
  circles: [],       // { center: [lng, lat], radiusKm: number }
  map: null,         // ThematikaMap instance
  rotation: [0, 0, 0],  // [lambda, phi, gamma]
  scale: 1,
  translate: [0, 0],
};

const EARTH_RADIUS_KM = 6371.0088;

// --- 投影法マップ ---
const projectionFactories = {
  naturalEarth: () => d3.geoNaturalEarth1(),
  mercator: () => d3.geoMercator(),
  orthographic: () => d3.geoOrthographic(),
  equirectangular: () => d3.geoEquirectangular(),
  azimuthalEqualArea: () => d3.geoAzimuthalEqualArea(),
  conicEqualArea: () => d3.geoConicEqualArea(),
};

// --- DOM要素 ---
const mapContainer = document.getElementById('map');
const projSelect = document.getElementById('projection-select');
const resetRotationBtn = document.getElementById('reset-rotation');
const radiusInput = document.getElementById('radius-input');
const clearBtn = document.getElementById('clear-circles');
const saveSvgBtn = document.getElementById('save-svg');
const savePngBtn = document.getElementById('save-png');
const coordsDisplay = document.getElementById('coords');
const circleListEl = document.getElementById('circle-list');
const circleInfoEl = document.getElementById('circle-info');
const closeCircleInfoBtn = document.getElementById('close-circle-info');

// --- 大圏円GeoJSON生成 ---
function createGeoCircle(center, radiusKm) {
  const radiusDeg = radiusKm * 180 / (Math.PI * EARTH_RADIUS_KM);
  return d3.geoCircle()
    .center(center)
    .radius(radiusDeg)
    .precision(2)();
}

// --- 円リストUI更新 ---
function updateCircleList() {
  circleListEl.innerHTML = '';
  state.circles.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'circle-item';
    item.innerHTML = `
      <span class="circle-label">${c.center[1].toFixed(1)}, ${c.center[0].toFixed(1)} / ${c.radiusKm}km</span>
      <span class="circle-actions">
        <button type="button" class="align-circle" data-axis="lat" data-index="${i}" aria-label="その円の中心に緯度を合わせる">
          <img src="./icon/lat.png" alt="" />
        </button>
        <button type="button" class="align-circle" data-axis="lng" data-index="${i}" aria-label="その円の中心に経度を合わせる">
          <img src="./icon/lng.png" alt="" />
        </button>
        <button type="button" class="remove-circle" data-index="${i}" aria-label="円を削除">&times;</button>
      </span>
    `;
    circleListEl.appendChild(item);
  });

  // 円アイテムの操作ボタン
  circleListEl.querySelectorAll('.align-circle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      const axis = e.currentTarget.dataset.axis;
      const c = state.circles[idx];

      if (!c) return;

      if (axis === 'lat') {
        state.rotation = [
          state.rotation[0],
          -c.center[1],
          state.rotation[2],
        ];
      } else if (axis === 'lng') {
        state.rotation = [
          -c.center[0],
          state.rotation[1],
          state.rotation[2],
        ];
      }

      state.translate = [0, 0];
      draw();
    });
  });

  // 削除ボタン（イベント伝播を止めて親のクリックを防ぐ）
  circleListEl.querySelectorAll('.remove-circle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      state.circles.splice(idx, 1);
      draw();
    });
  });
}

// --- rAFスロットリング ---
let drawScheduled = false;
function scheduleDraw() {
  if (drawScheduled) return;
  drawScheduled = true;
  requestAnimationFrame(() => {
    drawScheduled = false;
    draw();
  });
}

function applyMapTranslation(svg) {
  const rootGroup = svg.select('g');
  if (rootGroup.empty()) return;

  const baseTransform = rootGroup.attr('data-base-transform') ?? rootGroup.attr('transform') ?? '';
  rootGroup.attr('data-base-transform', baseTransform);

  const translate = `translate(${state.translate[0]}, ${state.translate[1]})`;
  rootGroup.attr('transform', baseTransform ? `${baseTransform} ${translate}` : translate);
}

function getProjectedPointer(event) {
  const [mx, my] = d3.pointer(event);
  return [mx - state.translate[0], my - state.translate[1]];
}

function getPointerCoords(event, projection) {
  const coords = projection.invert(getProjectedPointer(event));
  if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

  const [lng, lat] = coords;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return coords;
}

// --- メイン描画関数 ---
function draw() {
  const width = mapContainer.clientWidth;
  const height = mapContainer.clientHeight;

  // 既存SVGをクリア
  d3.select('#map').selectAll('*').remove();

  // 投影法を作成（rotateを先に設定してからfitExtent）
  const projection = projectionFactories[state.projectionType]()
    .rotate(state.rotation)
    .fitExtent([[20, 20], [width - 20, height - 20]], state.geojson);

  // zoom scaleを追加適用
  if (state.scale !== 1) {
    const baseScale = projection.scale();
    projection.scale(baseScale * state.scale);
  }

  // Thematikaマップ作成
  const map = new ThematikaMap({
    container: '#map',
    width,
    height,
    projection,
    backgroundColor: '#f0f4f8',
  });
  state.map = map;
  const svg = d3.select(map.getSVG());
  applyMapTranslation(svg);

  // レイヤー追加
  const outline = new OutlineLayer({
    createClipPath: true,
    clipPathId: 'earth-clip',
    attr: { fill: '#e8f4ff', stroke: '#666', 'stroke-width': 1 },
  });
  map.addLayer('outline', outline);

  const graticule = new GraticuleLayer({
    step: [15, 15],
    attr: { stroke: '#ccc', 'stroke-width': 0.3 },
  });
  map.addLayer('graticule', graticule);

  const countries = new GeojsonLayer({
    data: state.geojson,
    attr: {
      fill: '#c8dbbe',
      stroke: '#888',
      'stroke-width': 0.5,
    },
  });
  map.addLayer('countries', countries);

  // 円レイヤー
  if (state.circles.length > 0) {
    const circleFeatures = state.circles.map(c => {
      const feature = createGeoCircle(c.center, c.radiusKm);
      return {
        type: 'Feature',
        geometry: feature,
        properties: { center: c.center, radiusKm: c.radiusKm },
      };
    });

    const circleLayer = new GeojsonLayer({
      data: { type: 'FeatureCollection', features: circleFeatures },
      attr: {
        fill: 'rgba(74, 144, 217, 0.25)',
        stroke: '#4a90d9',
        'stroke-width': 1.5,
        'stroke-dasharray': '4,2',
      },
    });
    map.addLayer('circles', circleLayer);

    // 中心マーカー
    const g = svg.select('g');
    state.circles.forEach(c => {
      const [x, y] = projection(c.center);
      if (x != null && y != null) {
        g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 4)
          .attr('fill', '#e63946')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);
      }
    });
  }

  // 円リストUI更新
  updateCircleList();

  // インタラクション設定
  setupInteraction(map, projection);
}

// --- ドラッグ回転 + ホイールズーム ---
function setupInteraction(map, projection) {
  const svg = d3.select(map.getSVG());
  const sensitivity = 75;
  let dragStartRotation;
  let dragStartPos;
  let panStartTranslate;
  let isDragging = false;

  // 左ドラッグで回転
  const drag = d3.drag()
    .on('start', (event) => {
      dragStartRotation = [...state.rotation];
      dragStartPos = [event.x, event.y];
      isDragging = false;
    })
    .on('drag', (event) => {
      const dx = event.x - dragStartPos[0];
      const dy = event.y - dragStartPos[1];
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;
      }
      const k = sensitivity / projection.scale();
      state.rotation = [
        dragStartRotation[0] + dx * k,
        Math.max(-90, Math.min(90, dragStartRotation[1] - dy * k)),
        dragStartRotation[2],
      ];
      scheduleDraw();
    })
    .on('end', () => {});

  svg.call(drag);
  svg.on('contextmenu', (event) => {
    event.preventDefault();
  });

  // 右ドラッグで平行移動
  svg.on('mousedown.pan', (event) => {
    if (event.button !== 2) return;

    event.preventDefault();
    panStartTranslate = [...state.translate];
    dragStartPos = [event.clientX, event.clientY];
    isDragging = false;

    d3.select(window)
      .on('mousemove.map-pan', (moveEvent) => {
        const dx = moveEvent.clientX - dragStartPos[0];
        const dy = moveEvent.clientY - dragStartPos[1];
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          isDragging = true;
        }

        state.translate = [
          panStartTranslate[0] + dx,
          panStartTranslate[1] + dy,
        ];
        applyMapTranslation(svg);
      })
      .on('mouseup.map-pan', () => {
        d3.select(window).on('mousemove.map-pan', null).on('mouseup.map-pan', null);
      });
  });

  // ホイールでズーム
  svg.on('wheel', (event) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    state.scale = Math.max(0.5, Math.min(20, state.scale * factor));
    scheduleDraw();
  }, { passive: false });

  // クリックで円配置（ドラッグでなかった場合のみ）
  svg.on('click', (event) => {
    if (event.button !== 0) return;
    if (isDragging) {
      isDragging = false;
      return;
    }

    const coords = getPointerCoords(event, projection);
    if (!coords) return;

    const radiusKm = parseFloat(radiusInput.value) || 4000;
    state.circles.push({ center: coords, radiusKm });
    draw();
  });

  // マウス移動で座標表示
  svg.on('mousemove', (event) => {
    const coords = getPointerCoords(event, projection);
    if (coords) {
      coordsDisplay.textContent = `緯度: ${coords[1].toFixed(2)}  経度: ${coords[0].toFixed(2)}`;
    } else {
      coordsDisplay.textContent = '緯度: --  経度: --';
    }
  });
}

// --- イベントリスナー ---
projSelect.addEventListener('change', () => {
  state.projectionType = projSelect.value;
  state.rotation = [0, 0, 0];
  state.scale = 1;
  state.translate = [0, 0];
  draw();
});

resetRotationBtn.addEventListener('click', () => {
  state.rotation = [0, 0, 0];
  state.translate = [0, 0];
  draw();
});

clearBtn.addEventListener('click', () => {
  state.circles = [];
  draw();
});

saveSvgBtn.addEventListener('click', () => {
  if (state.map) state.map.saveSVG('map');
});

savePngBtn.addEventListener('click', () => {
  if (state.map) state.map.savePNG('map');
});

closeCircleInfoBtn.addEventListener('click', () => {
  circleInfoEl.hidden = true;
});

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
  draw();
});

// --- 初期化 ---
async function init() {
  state.geojson = await d3.json('./data/world.geojson');
  draw();
}

init();
