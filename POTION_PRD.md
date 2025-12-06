

---

# PRD – Local-Only Notion-Style Workspace (Single User)

## 1. Overview

We want a **local-only, single-user Notion-style workspace** that runs entirely in the browser as a **static web app**:

* **No backend services**: All data is stored locally.
* **Installable PWA**: Offline-first, add to home screen, runs like a desktop/mobile app.
* **Notion-style block editor**: Pages composed of rich “blocks” (headings, bullets, checklists, toggles, code, etc.).
* **Local database / workspace**: Hierarchical pages and simple databases.
* **Export / import / merge**: Users can backup, restore, and merge workspaces. Exports are files that can be attached to emails.
* **Pluggable storage**: Default is IndexedDB via a storage abstraction layer with predictable swapping to other backends.

Working codename: **Potion**.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Privacy-first, local-only**

   * All content stored on user’s device (IndexedDB by default).
   * No automatic network calls (except optional, explicit user actions like “open mail client with attachment”).

2. **Notion-style editing UX**

   * Block-based editor (paragraphs, headings, lists, to-dos, code blocks, callouts, quotes, etc.).
   * Slash commands (`/heading`, `/todo`, `/code`) and block toolbar for formatting.
   * Keyboard-driven editing: enter, backspace, arrow navigation, block reordering.

3. **PWA & offline-first**

   * Installable on desktop and mobile.
   * Fully usable offline once first loaded.
   * Automatic cache updates with safe migration.

4. **Simple “workspace” model**

   * Hierarchy of pages (nested).
   * Simple “databases” (collections of pages with properties and basic views: table / list).
   * Search across pages and databases.

5. **Durable backups**

   * Export full workspace (or subset) to a portable file (e.g. JSON or ZIP with JSON + assets).
   * Import a workspace file into a new or existing workspace.
   * Merge imported data with existing workspace with simple conflict handling.

6. **Pluggable storage abstraction**

   * Core app talks to a **StorageAdapter** interface.
   * Default implementation: IndexedDB.
   * Future: file-based storage (File System Access API), local server, or cloud backend via another adapter.

### 2.2 Non-Goals (v1)

* No multi-user collaboration or sync.
* No real-time presence / CRDT / multiplayer.
* No advanced Notion features: formula fields, complex rollups, multi-workspace accounts, permissions, etc.
* No external account system (no login, no auth).

---

## 3. Target User & Use Cases

**User:** A privacy-conscious individual (developer, writer, researcher) who wants Notion-like UX but refuses to store data remotely.

Key use cases:

1. Personal knowledge base and journaling.
2. Project notes with light structure (tasks, lists, small databases).
3. Offline notebooks (e.g. travel, research, learning notes).
4. Exporting workspace as a backup to store elsewhere or email to self.

---

## 4. Core User Stories

### Editor

* As a user, I can **create and edit a page** using blocks (paragraphs, headings, lists, to-dos, code, etc.).
* As a user, I can **reorder blocks** via drag-and-drop and keyboard shortcuts.
* As a user, I can **insert blocks via slash commands** (`/heading`, `/todo`, `/code`, etc.).
* As a user, I can **apply formatting** (bold, italic, underline, code, links) inline.
* As a user, I can **insert media blocks** (images at minimum; optional: separators, callouts).

### Pages & Navigation

* As a user, I can **create, rename, and delete pages**.
* As a user, I can **nest pages under other pages** to form a hierarchy.
* As a user, I can **mark favorites** and access them quickly.
* As a user, I can see a **left sidebar** with my pages tree and search.

### Databases (Lightweight)

* As a user, I can create a **database page** that contains rows of items (each row is a page).
* As a user, I can define **properties** (e.g. text, number, date, checkbox, select/tag).
* As a user, I can **edit rows inline** (similar to Notion’s table view, but simplified).
* As a user, I can **filter and sort** rows by properties (basic operators).

### Search

* As a user, I can **search by page title** and optionally page contents.
* As a user, I can **filter search results** by type (page vs database row).

### Export / Import / Merge

* As a user, I can **export my entire workspace** to a single file (e.g. `.localnote.json` or `.localnote.zip`).
* As a user, I can choose to **export a single page / subtree / database**.
* As a user, I can **import a workspace file** into an empty workspace (replace mode).
* As a user, I can **import a workspace file into an existing workspace** (merge mode).
* As a user, when merging, I can see:

  * New pages that will be added.
  * Conflicts (same IDs) with timestamps and choose “keep local” / “keep imported”.
* As a user, I can **download the export file** and manually attach it to an email.

### PWA & Local-Only

* As a user, I can **install** the app to my desktop or mobile device (PWA).
* As a user, I can use the app **offline** and have my changes sync once the app is open again (no server, just local persistence).
* As a user, I have **confidence that no data is sent anywhere** unless I explicitly export a file or open a link.

---

## 5. Functional Requirements

### 5.1 Tech Stack

* **Language**: TypeScript.
* **Runtime / tooling**: **Bun** for dev server, bundling (via `bun build` or Vite+Bun), tests, scripts.
* **UI framework**: React (TSX) for predictable ecosystem and editor integration.
* **Styling**: TailwindCSS or similar utility-first CSS (config-driven, tree-shakeable).
* **PWA**:

  * `manifest.webmanifest`
  * Service worker (Workbox or lightweight custom) for offline caching.

### 5.2 Editor Component

**Requirement:** Use a **best-in-class open source Notion-style block editor** that integrates well with React & TypeScript.

Candidates:

1. **BlockNote**

   * Open-source, **block-based, Notion-style React rich text editor**, built on ProseMirror and Tiptap.([BlockNote][1])
   * Provides slash commands, drag-and-drop blocks, animations, and batteries-included UI components.([BlockNote][1])
   * Designed for React, strongly aligned with “build a Notion-like app quickly”.([Strapi][2])

2. **Tiptap**

   * Headless editor framework, ProseMirror-based, open source, used for building Notion/Google Docs-style editors but requires custom UI work.([tiptap.dev][3])

3. **BlockSuite (AFFiNE)**

   * Open-source toolkit powering AFFiNE, a local-first Notion/Miro alternative. Provides editor infra and components but is more opinionated and complex to embed.([block-suite.com][4])

**Decision for v1:**

* **Primary choice**: **BlockNote** as the main editor component, due to:

  * Strong Notion-like UX out of the box.
  * React-first design.
  * Batteries-included UI, slash commands, drag-and-drop.([BlockNote][1])
* **Abstraction requirement**:

  * Wrap BlockNote in an internal `RichTextEditor` component with a **stable internal block schema and value format**, so we can swap the editor engine later if needed.

**Editor Features (v1)**

* Text formatting: bold, italic, underline, strikethrough, inline code, links.
* Blocks:

  * Paragraph, heading (H1–H3), bulleted list, numbered list.
  * To-do list (checkbox), quote, callout, divider.
  * Code block with language selection for common languages (at least `ts`, `js`, `json`, `bash`, `python`).
  * Image block (upload or paste URL; local reference stored in IndexedDB).
* Slash command palette for inserting blocks.
* Block reordering via drag-and-drop and keyboard shortcuts.

### 5.3 Data Model

High-level entities:

* **Workspace**

  * `id` (UUID)
  * `name`
  * `createdAt`, `updatedAt`
  * `version` (for migrations)
* **Page**

  * `id` (UUID)
  * `workspaceId`
  * `parentPageId` (nullable)
  * `title`
  * `type`: `"page"` | `"database"`
  * `isFavorite: boolean`
  * `content` (editor document JSON, stable format independent of particular editor lib)
  * `createdAt`, `updatedAt`
* **Database**

  * A page with `type = "database"` plus:
  * `properties`: array of `{ id, name, type, options? }`
  * `views`: simple representation of filters/sorts (v1: one default view)
* **Row (Database Item)**

  * `id` (UUID)
  * `databasePageId`
  * `pageId` (the row’s detail page)
  * `values`: property values map
  * `createdAt`, `updatedAt`
* **Settings**

  * PWA & sync options (for future).
  * Editor preferences (theme, font size, etc.)

### 5.4 Storage Abstraction

Define a **StorageAdapter** interface, for example:

```ts
interface StorageAdapter {
  init(): Promise<void>;
  getWorkspace(id: string): Promise<Workspace | null>;
  upsertWorkspace(workspace: Workspace): Promise<void>;
  listPages(workspaceId: string): Promise<PageSummary[]>;
  getPage(pageId: string): Promise<Page | null>;
  upsertPage(page: Page): Promise<void>;
  deletePage(pageId: string): Promise<void>;
  // Databases and rows
  getDatabase(pageId: string): Promise<Database | null>;
  upsertDatabase(db: Database): Promise<void>;
  listRows(databasePageId: string): Promise<RowSummary[]>;
  getRow(rowId: string): Promise<Row | null>;
  upsertRow(row: Row): Promise<void>;
  deleteRow(rowId: string): Promise<void>;
  // Export / import
  exportWorkspace(workspaceId: string): Promise<WorkspaceExport>;
  importWorkspace(workspaceId: string | null, data: WorkspaceExport, mode: "replace" | "merge"): Promise<ImportResult>;
}
```

* **Default implementation**: `IndexedDbStorageAdapter` using IndexedDB

  * May optionally use Dexie or similar under the hood, but adapter type must hide any library specifics.
* All UI code must only depend on the interface, not on IndexedDB directly.

### 5.5 Export / Import / Merge

**Export Format**

* `WorkspaceExport` is a JSON object with:

  * `version` (schema version)
  * `exportedAt`
  * `workspace` (metadata)
  * `pages[]`, `databases[]`, `rows[]`, `settings`
* For images/attachments:

  * v1: keep minimal – store file metadata and base64 blobs or data URLs inside the JSON.
  * Optionally wrap JSON + blobs in a `.zip` container at a later iteration.

**Export UX**

* “Export workspace” action:

  * Produces a file `localnote-workspace-<date>.json`.
  * Triggers browser download dialog.
  * After download, show message: “Attach this file to an email to back it up.”
* “Export page / subtree / database”:

  * Same as above but with a subset of data.

**Import UX**

* “Import workspace”:

  * User selects `.json` file via `<input type="file">`.
  * Validate version and schema.
  * Show summary:

    * New workspace vs merge into existing.
    * Number of pages, databases, rows.
* **Replace mode**:

  * Clears current workspace data and replaces with imported.
* **Merge mode**:

  * Algorithm:

    * If imported page ID not in local → add as new.
    * If same page ID exists:

      * Compare `updatedAt`; default rule: keep most recent.
      * Show conflicts in a simple dialog for manual override where feasible.
    * Same approach for database definitions and rows.

### 5.6 PWA & Offline Behaviour

* **Manifest**:

  * Name, short_name, icons, theme_color, background_color.
  * `display: "standalone"`.
  * Start URL (e.g. `/`).
* **Service worker**:

  * Precache app shell: HTML, JS bundles, CSS, icons, manifest.
  * Runtime cache strategy for editor assets.
  * Versioning:

    * On app load, check for updated SW and prompt user: “New version available – Reload now / later”.
* **Offline constraints**:

  * App can be installed and launched offline.
  * If an update requires schema migration, ensure migrations run before app loads main UI.

### 5.7 Settings & UX polish

* Theme: light / dark (optional v1: light-only with planned dark).
* Keyboard shortcuts:

  * `Ctrl/Cmd + N` new page.
  * `Ctrl/Cmd + F` open search.
  * `Ctrl/Cmd + Shift + P` command palette (optional).
* Basic onboarding:

  * Default workspace with a “Welcome” page explaining:

    * Local-only nature.
    * Export/import basics.

---

## 6. Non-Functional Requirements

* **Performance**

  * Initial load < 2s on a typical laptop with a fresh cache.
  * Editor interaction responsiveness: keystrokes handled < 16 ms typical.
  * Search over hundreds of pages should complete in < 200ms.

* **Reliability**

  * All edits auto-saved within 1 second of idle.
  * IndexedDB operations handled with retry and integrity checks.
  * Schema migrations are versioned and reversible (backup workspace before destructive changes).

* **Security & Privacy**

  * No outbound HTTP requests except:

    * Optional explicit actions like clicking help links or opening documentation.
  * CSP that prevents loading remote scripts/styles by default.
  * No analytics, no logging to remote endpoints.

* **Portability**

  * Export format must remain stable across versions, with migration paths from older versions.

---

## 7. Architecture & Modules

High-level modules:

1. **App Shell**

   * Routing (simple client-side router).
   * Layout (sidebar, top bar, content area).
   * PWA integrations (manifest, SW registration).

2. **Editor Module**

   * `RichTextEditor` wrapper around BlockNote.
   * Internal block schema & serialization format.
   * Plugins for code blocks, callouts, images, to-dos.

3. **Workspace Module**

   * Page tree UI.
   * Page CRUD, nesting, favorites.
   * Database pages & row editing.

4. **Storage Module**

   * `StorageAdapter` interface.
   * `IndexedDbStorageAdapter` implementation.
   * Export/import routines and migrations.

5. **Search Module**

   * Index builder (titles + optionally content).
   * In-memory or simple IndexedDB index.
   * Search UI overlay.

6. **Settings & System**

   * Theme, shortcuts, workspace metadata.

---

## 8. Open Questions

1. **Attachment handling**

   * For v1, is base64-in-JSON sufficient, or do we need zip packaging from day one?
2. **Database views**

   * Limit to a single table view per database in v1, or support multiple saved views?
3. **Mobile UX**

   * Minimum gesture support expectations: swipe to open sidebar, drag-and-drop blocks on mobile?
4. **Editor extensibility**

   * How much of BlockNote’s feature set do we expose vs hide to keep UX simple?

---

## 9. Risks & Mitigations

* **Risk:** BlockNote API changes, or project stagnates.

  * **Mitigation:** Keep a strict `RichTextEditor` wrapper and internal document model; don’t leak BlockNote types across app boundaries.

* **Risk:** IndexedDB quirks across browsers (especially Safari / iOS).

  * **Mitigation:** Test across Chrome, Edge, Safari; consider feature detection and fallbacks (e.g. using in-memory storage with warning on unsupported browsers).

* **Risk:** Export files grow large because of embedded images.

  * **Mitigation:** v1 acceptable; later introduce zipped export format and optional external image storage.

---

[1]: https://www.blocknotejs.org/?utm_source=chatgpt.com "BlockNote - Javascript Block-Based React rich text editor"
[2]: https://strapi.io/integrations/blocknote?utm_source=chatgpt.com "BlockNote & Strapi: Block-Based Rich Text Editor Guide"
[3]: https://tiptap.dev/product/editor?utm_source=chatgpt.com "Tiptap Rich Text Editor - the Headless WYSIWYG Editor"
[4]: https://block-suite.com/guide/overview.html?utm_source=chatgpt.com "BlockSuite Framework Overview"
