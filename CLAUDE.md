# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
preJSプロジェクトのミニマムテンプレート（prejs-minimum-template）をベースにしたプロジェクト。Vite + Babel + Sass構成。

## コマンド
- `npm run dev` — 開発サーバー起動（自動でブラウザが開く）
- `npm run build` — 本番ビルド（出力先: `dist/`）
- `npm run preview` — ビルド結果のプレビュー
- `npm run deploy` — GitHub Pages へデプロイ（gh-pages）

## アーキテクチャ
- **Viteルート**: `src/`（`vite.config.js` で `root: 'src'` を指定）
- **エントリーポイント**: `src/index.html` → `src/index.js`
- **スタイル**: `src/index.scss`（Sass）
- **静的ファイル**: `public/` ディレクトリ（Viteの `publicDir: '../public'`）
- **ビルド出力**: `dist/`
- **ベースパス**: 相対パス（`base: "./"`）
- **レガシーブラウザ対応**: `@vitejs/plugin-legacy`（IE11以外の古いブラウザをサポート）

## 言語・地域設定
- コード内コメント・コミットメッセージ・ドキュメントは日本語で記述
