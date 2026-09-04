// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { LanguageProvider } from '../../../../presentations/components/Language/LanguageProvider';
import { LanguageContext } from '../../../../presentations/components/Language/LanguageContext';

vi.mock('@music/i18n', () => ({
  desktopTranslations: {
    en: {
      greeting: 'Hello {name}',
      simple: 'Hi',
      nested: {
        key: 'Nested Key',
      },
      notString: { key: 'value' }
    },
    vi: {
      greeting: 'Xin chào {name}',
      simple: 'Chào',
      nested: {
        key: 'Khóa lồng',
      },
      notString: { key: 'giá trị' }
    }
  }
}));

const TestComponent = () => {
  const context = useContext(LanguageContext);
  if (!context) return null;
  const { language, setLanguage, t } = context;

  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="t-simple">{t('simple')}</span>
      <span data-testid="t-var">{t('greeting', { name: 'John' })}</span>
      <span data-testid="t-nested">{t('nested.key')}</span>
      <span data-testid="t-missing">{t('missing.key')}</span>
      <span data-testid="t-obj">{t('notString')}</span>
      <button onClick={() => setLanguage('en')}>Set EN</button>
      <button onClick={() => setLanguage('vi')}>Set VI</button>
    </div>
  );
};

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with default language "vi" when localStorage is empty', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('t-simple')).toHaveTextContent('Chào');
  });

  it('initializes with language from localStorage if present', () => {
    localStorage.setItem('app_language', 'en');
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('t-simple')).toHaveTextContent('Hi');
  });

  it('provides simple and nested translations based on current language', () => {
    localStorage.setItem('app_language', 'en');
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('t-simple')).toHaveTextContent('Hi');
    expect(screen.getByTestId('t-nested')).toHaveTextContent('Nested Key');
  });

  it('replaces variables in templated strings correctly', () => {
    localStorage.setItem('app_language', 'en');
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('t-var')).toHaveTextContent('Hello John');
  });

  it('returns keyPath if translation is not found', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('t-missing')).toHaveTextContent('missing.key');
  });

  it('returns defaultValue if translation is not found and defaultValue is provided in options', () => {
    const FallbackComponent = () => {
      const context = useContext(LanguageContext);
      return <span>{context?.t('totally.unknown.key', { defaultValue: 'Default Text' })}</span>;
    };

    render(
      <LanguageProvider>
        <FallbackComponent />
      </LanguageProvider>
    );

    expect(screen.getByText('Default Text')).toBeInTheDocument();
  });

  it('returns keyPath if the resolved value is not a string (like an object)', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('t-obj')).toHaveTextContent('notString');
  });

  it('updates language and persists to localStorage when setLanguage is called', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    // Initial state
    expect(screen.getByTestId('lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('t-simple')).toHaveTextContent('Chào');

    // Click Set EN
    await user.click(screen.getByRole('button', { name: 'Set EN' }));

    // UI should update
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('t-simple')).toHaveTextContent('Hi');
    
    // LocalStorage should update
    expect(localStorage.getItem('app_language')).toBe('en');

    // Click Set VI
    await user.click(screen.getByRole('button', { name: 'Set VI' }));

    // UI should update
    expect(screen.getByTestId('lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('t-simple')).toHaveTextContent('Chào');
    
    // LocalStorage should update
    expect(localStorage.getItem('app_language')).toBe('vi');
  });
});
