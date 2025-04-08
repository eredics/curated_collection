# 🖼️ Curated Collection

An AI-curated, modular virtual gallery built with Claude Sonnet (via GitHub Copilot Chat) using a step-by-step prompt system.

Designed to be fully offline, accessible, and responsive, this gallery loads artwork from a local CSV and displays it using a grid-based layout.

## 🏗️ Architecture Overview

Curated Collection uses a modular architecture combining several modern web development patterns:

### MVC Pattern
- **Model**: Handles data management, CSV parsing, and state
- **View**: Renders UI components and manages DOM interactions
- **Controller**: Coordinates between Model and View, handles application logic

### Component System
The UI is built using a lightweight component system that provides:
- Template-based rendering
- Data binding
- Event delegation
- Lifecycle hooks (beforeRender, afterRender, onDestroy)

### Offline-First Approach
- Service Worker for asset caching
- Local storage with fallbacks
- Robust error handling and recovery

---

## 📁 Folder Structure

```
curated_collection/ 
├── css/ 
│   └── styles.css               # Main stylesheet with responsive design 
├── data/ 
│   ├── filtered.csv             # Curated artwork dataset 
│   └── artworks.csv             # Complete artwork dataset 
├── js/ 
│   ├── component.js           # Component system for UI elements 
│   ├── constants.js           # Application constants and configuration 
│   ├── data-binding.js        # Two-way data binding implementation 
│   ├── failsafe.js            # Error handling and recovery 
│   ├── ios-compat.js          # iOS compatibility fixes 
│   ├── main.js                # Application entry point and controller 
│   ├── performance.js         # Performance optimizations 
│   ├── router.js              # Client-side routing 
│   ├── service-worker.js      # Offline caching and PWA support 
│   ├── storage.js             # Data persistence layer 
│   ├── template-engine.js     # HTML templating system 
│   └── utils.js               # Utility functions 
├── index.html # Main application entry point 
├── manifest.json # PWA manifest 
└── README.md # Project documentation

```

---

## 🚀 Live Preview (Local)

You can run this locally with Python:

```bash
cd curated_collection
python3 -m http.server 8000
```

Then visit: [http://localhost:8000](http://localhost:8000)

Or use VS Code's "Live Server" extension.

---

## 🌱 Initialize GitHub Repo

```bash
cd curated_collection
git init
git commit -m "Initial build from modular prompts"
git push -u origin main
```

---

## 📦 Prompt Module System

This project is built from 5 Claude prompt stacks, each broken into modular instructions:

| Prompt | Scope                              | Modules                    |
|--------|-------------------------------------|----------------------------|
| 1      | Core structure + gallery rendering | Layout, splash, images     |
| 2      | CSV loading + basic filtering      | Data pipeline, filter UI   |
| 3      | Advanced filtering + search        | AND filters, live search   |
| 4      | UI design + animation              | Typography, transitions    |
| 5      | Frame visualization + export       | Modal preview, download    |

Use Claude Sonnet + GitHub Copilot Chat to implement each module.

---

## 🤖 Working With Claude Sonnet (Copilot Chat)

Paste one module at a time and say:

> “Claude, please implement this module. Generate HTML, CSS, and JS. Include inline comments.”

Ask follow-ups like:
- “Use mobile-first styles”
- “Make the modal keyboard accessible”
- “Refactor this to use canvas layers”

---

## Development

### Code Quality

This project uses linting tools to maintain code quality and consistency:

- **JavaScript**: ESLint with custom configuration
- **CSS**: Stylelint with standard configuration
- **HTML**: HTMLHint

#### Linting Commands

```bash
# Lint all files
npm run lint

# Lint and automatically fix issues where possible
npm run lint:fix

# Lint specific file types
npm run lint:js
npm run lint:css
npm run lint:html
```

---

## 🔄 Data Flow

1. **Initialization**: 
   - Service worker registers for offline support
   - Application loads configuration from constants.js
   - Controller initializes Model and View

2. **Data Loading**:
   - Model loads artwork data from CSV
   - Failsafe system handles potential data corruption
   - Data is processed and normalized

3. **Rendering**:
   - View creates components based on data from Model
   - Template engine processes component templates
   - Components are rendered to the DOM
   - Event listeners are attached

4. **User Interaction**:
   - Events are captured by the component system
   - Controller processes user actions
   - Model updates based on controller instructions
   - View re-renders as needed

## 🔌 Module Relationships

- **Component System**: Core UI rendering engine that other modules use
- **Template Engine**: Used by Component for HTML string processing
- **Router**: Manages application state and navigation
- **Failsafe**: Provides error recovery across all modules
- **Utils**: Shared utility functions used throughout the application

## 📱 Responsive Design

The application implements a mobile-first approach with:
- Fluid grid layout using CSS Grid and Flexbox
- Viewport-based measurements with iOS fixes
- Touch-optimized controls
- Media queries for different device sizes

## 🔒 Offline Capabilities

- Service worker caches all essential assets
- IndexedDB/localStorage for user data persistence
- Graceful degradation when offline
- Sync capabilities when connection is restored

## 🧩 Extensions and Customization

The modular architecture allows for easy extension:
- Add new components by extending the Component class
- Register new routes in the Router
- Add data processors to handle different data sources

---

## 📦 Dependencies

Curated Collection is built without external dependencies, using vanilla:
- HTML5
- CSS3
- JavaScript (ES6+)

Development dependencies:
- ESLint
- Stylelint
- HTMLHint

---

## 🌐 Browser Compatibility

Curated Collection has been tested and works on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari iOS 14+
- Chrome for Android 90+

Note: Internet Explorer is not supported.

---

## ♿ Accessibility

This gallery implements accessibility best practices:
- Semantic HTML structure
- ARIA landmarks and attributes
- Keyboard navigation support
- Focus management for modals
- Color contrast compliance (WCAG AA)
- Screen reader-friendly alt text for all images
- Reduced motion options for animations

---

## 🚀 Deployment

### Basic Hosting
Upload the entire project to any static file hosting service:
- GitHub Pages
- Netlify
- Vercel
- Amazon S3

### Build for Production
For optimized deployment:

```bash
# Install build tools
npm install

# Generate optimized build
npm run build
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ❓ Troubleshooting

### Common Issues

1. **Images don't load offline**
   - Ensure the service worker has registered correctly
   - Check browser's cache storage to confirm assets are cached

2. **Performance issues on mobile**
   - Try enabling the "Reduce Motion" option
   - Disable high-resolution images in the settings

3. **Data not saving between sessions**
   - Check if your browser has cookies/storage disabled
   - Ensure your device has available storage space

---

## 🙏 Acknowledgments

* [Claude AI](https://claude.ai) - AI assistant used to generate code through GitHub Copilot Chat
* [GitHub Copilot](https://github.com/features/copilot) - AI pair programming tool

---
