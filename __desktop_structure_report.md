Edited __B%C3%81O_C%C3%81O.md
Edited __B%C3%81O_C%C3%81O_BTL.md
Viewed useLanguage.ts:1-11
Listed directory desktop
Listed directory electron
Listed directory src
Listed directory infrastructure
Listed directory ipc
Viewed preload.ts:1-171

This report outlines the technical structure of the **Melovista Desktop** application, which is built using **Electron**, **Vite**, **React**, and **TypeScript**.

The application is split into two primary processes: **Main (Node.js)** and **Renderer (Chromium)**, following Electron's security and performance best practices.

---

## 1. Process Overview

### Main Process (`electron/`)
The "backend" of the application. It has direct access to Node.js APIs (File System, OS, etc.).
-   **Entry Point**: [main.ts](file:///d:/MELOVISTA_DEV/apps/desktop/electron/main.ts)
    -   *Responsibility*: Initializes the Electron window, sets up IPC listeners, and manages application lifecycle.
-   **Preload Script**: [preload.ts](file:///d:/MELOVISTA_DEV/apps/desktop/electron/preload.ts)
    -   *Responsibility*: Acts as a secure bridge. It uses `contextBridge` to expose specific APIs (like `importFiles`, `getLibrary`) to the Renderer process without exposing all of Node.js.

### Renderer Process (`src/`)
The "frontend" of the application. A standard React application that displays the UI.
-   **Entry Point**: [main.tsx](file:///d:/MELOVISTA_DEV/apps/desktop/src/main.tsx)
-   **Root Component**: [App.tsx](file:///d:/MELOVISTA_DEV/apps/desktop/src/App.tsx)

---

## 2. Folder Structure & Functional Roles

### `electron/` (Main Process)
| Folder/File | Purpose | Key Exports/Dependencies |
| :--- | :--- | :--- |
| `infrastructure/` | Implements low-level services. | `MainStorageAdapter`, `MainMetadataService` (Uses `music-metadata`). |
| `ipc/` | Handles messages from Renderer. | Handlers for `library`, `storage`, and `downloader` events. |
| `modules/` | Feature-specific Main logic. | `LibraryManager`, `YoutubeDownloader` (Uses `yt-dlp`). |
| `workers/` | Off-main-thread processing. | Metadata extraction workers to prevent UI lag. |
| `main.ts` | Entry point. | Initializes `BrowserWindow` and `ipcMain` listeners. |

### `src/` (Renderer Process)
| Folder/File | Purpose | Key Exports/Dependencies |
| :--- | :--- | :--- |
| `application/` | App logic & State. | `useLibrary`, `usePlayer`, `useLanguage` hooks. |
| `infrastructure/` | Data adapters. | `ElectronLibraryRepository` (Calls `window.electronAPI`). |
| `presentations/` | UI Components & Pages. | React components, CSS/SCSS modules. |
| `electron.d.ts` | Type Definitions. | Defines the `Window` interface extension for `electronAPI`. |

---

## 3. Key Dependencies & Data Flow

### Important Dependencies (via `package.json`)
-   **Core UI**: `react`, `react-dom`, `framer-motion` (animations).
-   **Icons**: `lucide-react`.
-   **Audio Engine**: `howler` (handling playback on the renderer side).
-   **Metadata**: `music-metadata` (parsing ID3 tags in Main).
-   **Downloads**: `youtube-dl-exec` (interfacing with `yt-dlp`).
-   **Internal**: `@music/core`, `@music/types`, `@music/ui` (Shared monorepo packages).

### Data Flow Diagram (High Level)
1.  **User Action**: User clicks "Import Folder" in the UI ([presentations/](file:///d:/MELOVISTA_DEV/apps/desktop/src/presentations)).
2.  **Hook Trigger**: The UI calls `importFolder` from `useLibrary` ([application/hooks](file:///d:/MELOVISTA_DEV/apps/desktop/src/application/hooks)).
3.  **Repository Call**: The hook calls `ElectronLibraryRepository.importFolder()` ([infrastructure/repositories](file:///d:/MELOVISTA_DEV/apps/desktop/src/infrastructure/repositories)).
4.  **IPC Bridge**: The repository invokes `window.electronAPI.importFolder()`, which sends an IPC message to the Main process via [preload.ts](file:///d:/MELOVISTA_DEV/apps/desktop/electron/preload.ts).
5.  **Main Handler**: The IPC handler in [electron/ipc/library.ts](file:///d:/MELOVISTA_DEV/apps/desktop/electron/ipc/library.ts) opens a native dialog and processes the files using `LibraryManager`.
6.  **Response**: The Main process returns the result back through the IPC bridge to the Renderer, updating the React state.

---

## 4. Notable Files
-   **`vite.config.ts`**: Configures the build system for both the Renderer and Electron Main/Preload scripts.
-   **`App.tsx`**: Orchestrates global providers (`LibraryProvider`, `PlayerProvider`, `ThemeProvider`) and defines the main layout (Sidebar, PlayerBar, Main Content).
-   **`App.scss`**: Global styles and CSS variables for the theme system.