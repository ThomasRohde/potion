# 🧪 Potion

**Local-only Notion-style workspace** - Privacy-first, offline-first PWA.

Potion is a local-first productivity app that gives you the power of Notion-style block editing while keeping all your data on your device. No servers, no accounts, no tracking.

## ✨ Features

- 📝 **Block-based editor** - Rich text editing with headings, lists, code blocks, and more
- 📁 **Hierarchical pages** - Organize content with nested pages
- 📊 **Simple databases** - Tables with properties, filtering, and sorting
- 🔍 **Fast search** - Find anything across all your pages
- 💾 **Export/Import** - Backup and restore your entire workspace
- 🌐 **Offline-first** - Works without internet after first load
- 📱 **PWA** - Install on desktop or mobile like a native app
- 🔒 **Privacy-first** - No external network calls, ever

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0 or later

### Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Or use the init script
./init.sh        # Unix/macOS
.\init.ps1       # Windows
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Testing

```bash
# Run unit tests
bun test

# Run E2E tests
bun run test:e2e
```

## 🛠 Tech Stack

- **Runtime**: Bun
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand with Immer middleware
- **Styling**: TailwindCSS
- **Editor**: BlockNote (ProseMirror-based)
- **Storage**: IndexedDB
- **PWA**: Vite PWA Plugin + Workbox

## 🧠 State Management

Potion uses [Zustand](https://zustand-demo.pmnd.rs/) with [Immer](https://immerjs.github.io/immer/) middleware for state management. State is organized into three focused stores:

### WorkspaceStore (`src/stores/workspaceStore.ts`)

Manages workspace and page data:
- **State**: `workspace`, `flatPages`, `pageTree`, `currentPageId`
- **Actions**: `setWorkspace`, `setPages`, `refreshPages`, `setCurrentPageId`, `addPage`, `updatePage`, `removePage`
- **Selectors**: `selectCurrentPage`, `selectFavoritePages`

```typescript
// Example usage
const pages = useWorkspaceStore(state => state.flatPages);
const currentPage = useWorkspaceStore(selectCurrentPage);
```

### UIStore (`src/stores/uiStore.ts`)

Manages UI state with localStorage persistence:
- **State**: `sidebarCollapsed`, `sidebarWidth`, `searchOpen`, `shortcutsOpen`, `settingsOpen`, `deleteConfirm`, `importData`
- **Actions**: `toggleSidebar`, `setSidebarWidth`, `openSearch`, `closeSearch`, `toggleSearch`, `openDeleteConfirm`, `closeDeleteConfirm`, `openImport`, `closeImport`
- **Persistence**: Sidebar preferences persist to localStorage

```typescript
// Example usage
const { sidebarCollapsed, toggleSidebar } = useUIStore();
```

### ThemeStore (`src/stores/themeStore.ts`)

Manages theme with system preference detection:
- **State**: `preference` (light/dark/system), `applied` (resolved theme)
- **Actions**: `setTheme`, `toggleTheme`, `syncSystemTheme`
- **Selectors**: `selectThemePreference`, `selectIsDarkMode`
- **Persistence**: Theme preference persists to localStorage
- **Auto-sync**: Listens to system theme changes when preference is 'system'

```typescript
// Example usage
const isDark = useThemeStore(selectIsDarkMode);
const setTheme = useThemeStore(state => state.setTheme);
```

### Middleware

- **Devtools**: Redux DevTools integration in development mode
- **Persist**: localStorage persistence for UI preferences and theme
- **Immer**: Immutable state updates with mutable syntax (WorkspaceStore)

## 📁 Project Structure

```
potion/
├── src/
│   ├── components/     # React components (AppShell, Sidebar, dialogs)
│   ├── contexts/       # React contexts (deprecated - use stores)
│   ├── hooks/          # Custom React hooks (useAutoSave)
│   ├── pages/          # Route pages (HomePage, PageView)
│   ├── services/       # Business logic (pageService, databaseService)
│   ├── storage/        # StorageAdapter interface & IndexedDB implementation
│   ├── stores/         # Zustand stores (workspaceStore, uiStore, themeStore)
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── e2e/                # Playwright E2E tests
└── test-results/       # Test output
```

## 🔐 Privacy

Potion makes **zero external network requests** by default. Your data never leaves your device unless you explicitly export it.

- No analytics
- No telemetry
- No cloud sync
- No user accounts

## 📝 License

MIT

---

*Your data. Your device. Your control.*
