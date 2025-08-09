# Surface Browser

A modern, feature-rich desktop web browser built with Electron and React, designed to provide a clean, efficient browsing experience with powerful tab management and history features.

![Surface Browser](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## 🚀 Features

### Core Browsing
- **Modern Tab System** - Dynamic tab creation, switching, and management with React
- **Smart URL Bar** - Intelligent search and URL validation with auto-completion
- **Fast Navigation** - Chromium-powered rendering engine for optimal performance
- **Custom Titlebar** - Frameless window design with native window controls

### Advanced Navigation
- **Keyboard Shortcuts** - Complete keyboard navigation support
  - `Ctrl+T` - New tab
  - `Ctrl+W` - Close tab
  - `Ctrl+L` - Focus address bar
  - `Ctrl+H` - Toggle history panel
  - `Ctrl+Left/Right` - Navigate back/forward
  - `Alt+Left/Right` - Alternative back/forward navigation

### Data Management
- **Persistent History** - SQLite-powered browsing history with real-time updates
- **Bookmark System** - JSON-based bookmark storage with quick access
- **Favicon Support** - Intelligent favicon fetching with emoji fallbacks
- **Cross-Session Persistence** - Maintains history and bookmarks across browser restarts

### User Interface
- **Clean Design** - Minimalist interface inspired by Arc and Zen browsers
- **Dark Theme** - Native dark mode support
- **Smooth Animations** - Fluid panel transitions and window effects
- **Responsive Layout** - Adaptive design for different screen sizes

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git** for version control

## 🛠️ Installation

### Clone the Repository
```bash
git clone https://github.com/DevanshV03/Surface-Browser.git
cd surface-browser
```

### Install Dependencies
```bash
npm install
```

### Development Setup
```bash
npm run dev
```

### Build for current platform
```bash
npm run build
```

### Build for specific platforms
```bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## 🏗️ Project Structure

```
surface-browser/
├── main/               # Electron main process
│   └── index.js        # Main application logic
├── preload/            # Preload scripts
│   └── index.js        # Context bridge setup
├── renderer/           # Renderer process (UI)
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # Business logic services
│   │   ├── utils/      # Utility functions
│   │   └── styles/     # CSS modules
│   └── index.html      # Main HTML template
├── package.json
└── README.md
```

## 🔧 Architecture

### Technology Stack
- **Electron** - Desktop application framework
- **React** - UI component library
- **Vite** - Fast build tool and dev server
- **SQLite** - Local database for history storage
- **CSS Modules** - Scoped styling

### Key Components
- **Tab Management** - React-based dynamic tab system
- **WebView Engine** - Chromium webviews for web content rendering
- **History Service** - SQLite-powered browsing history
- **Bookmark Manager** - JSON-based bookmark persistence
- **Navigation Service** - URL handling and smart search

## 📚 Usage

### Basic Navigation
1. **Create New Tab** - Click the `+` button or press `Ctrl+T`(v1.0.0-alpha.2 coming soon)
2. **Navigate to Website** - Type URL or search term in the address bar
3. **Switch Between Tabs** - Click tab headers or use keyboard shortcuts
4. **View History** - Press `Ctrl+H` to open the history panel (v1.0.0-alpha.2 coming soon)

### Keyboard Shortcuts - Next Patch for the Alpha
| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close current tab |
| `Ctrl+L` | Focus address bar |
| `Ctrl+H` | Toggle history panel |
| `Ctrl+Left` | Navigate back |
| `Ctrl+Right` | Navigate forward |
| `Ctrl+l` | Focus on Addresss Bar |


### Bookmarks
- **Add Bookmark** - Click the bookmark button in the address bar
- **View Bookmarks** - Access from the bookmarks panel, separated by an animated separator.
- **Delete Bookmarks** - Click the red close button on bookmark items

## 🎨 Customization

### Themes
- Default dark theme with customizable CSS variables
- Modify colors in `renderer/src/styles/` directory

### Window Behavior
- Adjust window properties in `main/index.js`
- Customize titlebar appearance and behavior

## 🐛 Known Issues
- Sometimes bookmark button might not trigger properly
- Trackpad gesture navigation is not yet implemented
- Some favicon URLs may not load correctly
- History search functionality is planned for future release

## 🔮 Upcoming Features

- **History Search** - Full-text search through browsing history
- **Timeline Categorization** - Organize history by date and time
- **Clear History** - Selective or complete history clearing
- **Enhanced Bookmarks** - Folder organization and tags
- **Tab Groups** - Organize tabs into collapsible groups
- **Extensions Support** - Plugin system for third-party extensions
- **Download Manager** - Download Manager integration
- **UI Polish** - Further UI Polish for an even better experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Surface Browser** - Redefining the desktop browsing experience with modern technology and clean design.