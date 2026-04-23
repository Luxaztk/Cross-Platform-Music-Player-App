MeloVista Color System Report

## 1. Global Styles & Theme Configuration

The application’s central design tokens are established using native CSS variables (`--var`), completely eschewing utility-class frameworks like TailwindCSS or CSS-in-JS libraries.

- **Definition File**:`apps/desktop/src/presentations/components/Theme/ThemeProvider.scss`
- **Application Logic**:
  `apps/desktop/src/presentations/components/Theme/ThemeProvider.tsx`

---

## 2. Dark/Light Mode Implementation

Theming is dynamically injected via the `data-theme` attribute on the `<body>` element. MeloVista supports **six distinct aesthetics**, utilizing five dark variations and one light variation:

1. `midnight` (Default - Dark Charcoal & Emerald)
2. `amoled` (True Black)
3. `nord` (Snowy Blue-Grey & Frost)
4. `rose` (Deep Stone & Dusty Rose)
5. `ocean` (Deep Navy & Cyan)
6. `snow` (Soft Creamy Light Mode)

When switching themes, the app relies on CSS transitions (`transition: background-color 0.4s ease, color 0.4s ease;`) in the global body to smoothly cross-fade colors.

---

## 3. Core Color Palette

Below are the primary semantic tokens extracted from the default `midnight` theme:

| Variable                  | Hex/RGBA                        | Description                                                  |
| ------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `--bg-primary`            | `#0a0a0a`                       | Deepest background layer                                     |
| `--bg-surface`            | `rgba(255, 255, 255, 0.05)`   | Default background for cards and list items                  |
| `--bg-surface-hover`      | `rgba(255, 255, 255, 0.08)`   | Interactive hover state for surfaces                         |
| `--bg-surface-solid`      | `#1c1c1c`                       | Solid, non-transparent surface panels (menus, modals)        |
| `--color-primary`         | `#10b981`                       | Accent color (Emerald green default)                         |
| `--color-primary-hover`   | `#059669`                       | Interactive hover state for primary accents                  |
| `--color-text-main`       | `#ffffff`                       | Primary vibrant text                                         |
| `--color-text-muted`      | `#9ca3af`                       | Secondary/subtle text                                        |
| `--color-text-dim`        | `#6b7280`                       | Tertiary text, muted icons, timestamps                       |
| `--border-color`          | `rgba(255, 255, 255, 0.1)`    | Thin divider lines                                           |
| `--bg-inverse`            | `#ffffff`                       | Hard contrast background (used on play button/slider thumbs) |
| `--color-inverse`         | `#000000`                       | Hard contrast text                                           |

---

## 4. Semantic Rules & Usage Guide

Based on analysis of core components (`PlayerBar`, `Sidebar`), here is the strict usage guide:

* **Backgrounds**: Never use `--bg-primary` on elements; it is reserved for the `<body>` and main pane. Use dedicated variables for sections: `--bg-sidebar`, `--bg-player-bar`, or `--bg-header`.
* **Surfaces**: For floating menus, tooltips, or popovers, use `--bg-surface-solid` combined with `--border-subtle` and a shadow. For standard list items (`queue-item`, `nav-item`), use `--bg-surface` and transition to `--bg-surface-hover`.
* **Primary Text**: Use `--color-text-main` for the active song title, playlist headers, active navigation text, and user inputs.
* **Secondary Text**: Use `--color-text-muted` for artist names, album titles, and standard navigation items.
* **Tertiary Text / Icons**: Use `--color-text-dim` for small metadata, inactive control icons, and timestamps.
* **Accents**: Use `--color-primary` to highlight the current active navigational tab, the active song playing, or active "on" states for toggles (e.g., Shuffle/Repeat). Use `--bg-inverse` / `--color-inverse` for the highest emphasis button (e.g., the main Play button).

---

## 5. Strict AI Directive

If you are generating or refactoring UI components for this project, append the following directive to the AI System Prompt:

```markdown
# ⚠️ UI DICTATES: NO HARDCODED COLORS
- NEVER hardcode hex `#` or rgb/rgba values in SCSS/CSS.
- ALL colors MUST be mapped to the `ThemeProvider.scss` CSS custom properties (e.g., `var(--color-text-main)`).
- Adhere strictly to the established Semantic Usage Guide (e.g., Use `var(--color-text-muted)` for artist names and secondary lore. Use `var(--color-text-dim)` for inactive icons).
- Leverage CSS variables for both light and dark mode flipping natively.
```
