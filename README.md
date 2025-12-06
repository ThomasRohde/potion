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
- **Styling**: TailwindCSS
- **Editor**: BlockNote (ProseMirror-based)
- **Storage**: IndexedDB
- **PWA**: Vite PWA Plugin + Workbox

## 📁 Project Structure

```
potion/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries
│   │   ├── storage/    # StorageAdapter interface & implementations
│   │   ├── editor/     # RichTextEditor wrapper
│   │   └── models/     # Data models
│   ├── pages/          # Route pages
│   └── styles/         # Global styles
├── public/             # Static assets
└── test/               # Test files
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
