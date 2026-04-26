Viewed MobileStorageAdapter.ts:1-151
Viewed ElectronLibraryRepository.ts:1-118

This report provides a detailed overview of the layered architecture implemented in the Melovista project, highlighting how each layer is structured and where they reside in the desktop and mobile applications.

---

# Architecture Report: Melovista Layered Design

Melovista follows a **Clean Architecture** (or Hexagonal Architecture) approach. This decouples the core business logic from technical implementation details (like Electron or React Native), allowing for high code reusability across platforms.

## 1. Architecture Overview

The project is organized into four main layers:

1.  **Domain (Core) Layer**: Business logic, rules, and abstractions.
2.  **Infrastructure Layer**: Platform-specific implementations of the Domain abstractions.
3.  **Application Layer**: Orchestrates use cases and manages application state.
4.  **Presentation Layer**: The user interface (UI) and user interaction logic.

---

## 2. Layer Correspondence Table

| Layer | Responsibility | Shared Package | Desktop Location (`apps/desktop`) | Mobile Location (`apps/mobile`) |
| :--- | :--- | :--- | :--- | :--- |
| **Domain (Core)** | Interfaces, Use Cases, Models | `packages/core`, `packages/types` | Consumes via imports | Consumes via imports |
| **Infrastructure** | Database, API, File System | N/A | `src/infrastructure/` | `src/infrastructure/` |
| **Application** | State Management, Hooks, Providers | `packages/hooks` | `src/application/` | `src/application/` |
| **Presentation** | Components, Screens, Styles | `packages/ui` | `src/presentations/` | `src/presentations/` |

---

## 3. Deep Dive into Layers

### A. Domain (Core) Layer
This is the heart of the application. It contains no platform-specific code.
-   **Interfaces**: Define "contracts" that the infrastructure must follow (e.g., `ILibraryRepository`, `IStorageAdapter`).
    -   *Location*: [interfaces](file:///d:/MELOVISTA_DEV/packages/core/src/interfaces)
-   **Types**: Shared TypeScript definitions for Songs, Playlists, etc.
    -   *Location*: [packages/types](file:///d:/MELOVISTA_DEV/packages/types)

### B. Infrastructure Layer
This layer implements the interfaces defined in the Core. This is where the desktop and mobile apps diverge technically.
-   **Desktop**: Uses [ElectronLibraryRepository.ts](file:///d:/MELOVISTA_DEV/apps/desktop/src/infrastructure/repositories/ElectronLibraryRepository.ts) which communicates with the Electron main process via IPC.
-   **Mobile**: Uses [MobileStorageAdapter.ts](file:///d:/MELOVISTA_DEV/apps/mobile/src/infrastructure/storage/MobileStorageAdapter.ts) which interacts with device storage using `AsyncStorage`.

### C. Application Layer
This layer manages the flow of data. It usually holds the "State" of the app.
-   **Desktop**: Primarily uses custom hooks in [application/hooks](file:///d:/MELOVISTA_DEV/apps/desktop/src/application/hooks) to bridge the UI and Repositories.
-   **Mobile**: Uses React Context Providers like [LibraryProvider.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/application/library/LibraryProvider.tsx) to provide global library state to the React Native tree.

### D. Presentation Layer
The UI components.
-   **Desktop**: Built with React and standard CSS/SCSS. Organized into [components](file:///d:/MELOVISTA_DEV/apps/desktop/src/presentations/components) and [pages](file:///d:/MELOVISTA_DEV/apps/desktop/src/presentations/pages).
-   **Mobile**: Built with React Native components optimized for touch. Found in [presentations](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations).

---

## 4. Key Architectural Patterns Found

1.  **Dependency Inversion**: High-level modules (UI/Application) depend on abstractions (Interfaces in Core), not low-level modules (Infrastructure).
2.  **Monorepo Strategy**: Shared logic is extracted into `packages/`, ensuring that if a business rule changes (e.g., how a playlist is validated), it updates for both Desktop and Mobile simultaneously.
3.  **Adapter Pattern**: The `MobileStorageAdapter` and `ElectronLibraryRepository` act as adapters, translating platform-specific APIs into a format the application layer understands.

### Summary of Accomplishments:
-   Identified and mapped the 4-layer architecture across the monorepo.
-   Located specific repository and provider implementations for both Desktop and Mobile.
-   Clarified the role of the shared `@music/core` and `@music/types` packages.