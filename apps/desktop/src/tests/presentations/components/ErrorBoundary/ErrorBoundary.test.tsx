// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '@components/ErrorBoundary';

const MaliciousComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('BOOM!');
  }
  return <div>Safe Content</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error so test output stays clean when we intentionally throw
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <MaliciousComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe Content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('catches error and renders default fallback UI', () => {
    render(
      <ErrorBoundary componentName="TestSection">
        <MaliciousComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.queryByText('Safe Content')).not.toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/TestSection/)).toBeInTheDocument();
  });

  it('catches error and renders custom fallback if provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error View</div>}>
        <MaliciousComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('resets error state when "Try again" button is clicked', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <MaliciousComponent shouldThrow />
      </ErrorBoundary>
    );

    // Error is thrown
    const tryAgainBtn = screen.getByRole('button', { name: 'Try again' });
    expect(tryAgainBtn).toBeInTheDocument();

    // Rerender with safe component before clicking try again, so it won't crash repeatedly
    rerender(
      <ErrorBoundary>
        <MaliciousComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Click try again
    await user.click(tryAgainBtn);

    // Error boundary should lift the fallback UI and render safe content
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });
});
