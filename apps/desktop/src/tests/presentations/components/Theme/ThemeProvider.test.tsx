import { useContext } from 'react';
import { render, screen, act } from '@testing-library/react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, ThemeContext } from '@components';

vi.mock('@music/brand/logos/app_icon_ios_dark.png', () => ({ default: 'dark-icon.png' }));
vi.mock('@music/brand/logos/app_icon_ios_light.png', () => ({ default: 'light-icon.png' }));

const TestComponent = () => {
  const context = useContext(ThemeContext);
  if (!context) return null;

  return (
    <div>
      <span data-testid="theme">{context.theme}</span>
      <span data-testid="icon">{context.appIcon}</span>
      <button onClick={() => context.setTheme('snow')} data-testid="set-snow">Set Snow</button>
      <button onClick={() => context.setTheme('amoled')} data-testid="set-amoled">Set Amoled</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.dataset.theme = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides default theme (midnight) when no local storage or media match', () => {
    // Mock matchMedia to return false for light
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
      })),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('midnight');
    expect(screen.getByTestId('icon')).toHaveTextContent('dark-icon.png');
    expect(document.body.dataset.theme).toBe('midnight');
    expect(localStorage.getItem('melovista-theme')).toBe('midnight');
  });

  it('uses saved theme from local storage', () => {
    localStorage.setItem('melovista-theme', 'rose');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('rose');
    expect(document.body.dataset.theme).toBe('rose');
  });

  it('falls back to media query (light) if no local storage', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
      })),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('nord');
    expect(document.body.dataset.theme).toBe('nord');
  });

  it('updates theme and local storage when setTheme is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const btnSnow = screen.getByTestId('set-snow');

    act(() => {
      btnSnow.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('snow');
    expect(screen.getByTestId('icon')).toHaveTextContent('light-icon.png');
    expect(document.body.dataset.theme).toBe('snow');
    expect(localStorage.getItem('melovista-theme')).toBe('snow');

    const btnAmoled = screen.getByTestId('set-amoled');

    act(() => {
      btnAmoled.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('amoled');
    expect(screen.getByTestId('icon')).toHaveTextContent('dark-icon.png');
    expect(document.body.dataset.theme).toBe('amoled');
    expect(localStorage.getItem('melovista-theme')).toBe('amoled');
  });
});
