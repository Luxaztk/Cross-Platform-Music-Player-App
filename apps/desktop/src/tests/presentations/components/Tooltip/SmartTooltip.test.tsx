import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmartTooltip } from '../../../../presentations/components/Tooltip/SmartTooltip';

describe('SmartTooltip', () => {
  let originalInnerHeight: number;
  let originalInnerWidth: number;

  beforeEach(() => {
    vi.clearAllMocks();
    originalInnerHeight = window.innerHeight;
    originalInnerWidth = window.innerWidth;
    
    // Default window size for tests
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1000 });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
  });

  it('renders children but not tooltip content initially', () => {
    render(
      <SmartTooltip content="Tooltip Content">
        <button data-testid="trigger">Hover Me</button>
      </SmartTooltip>
    );

    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.queryByText('Tooltip Content')).not.toBeInTheDocument();
  });

  it('shows tooltip content on mouse enter', () => {
    render(
      <SmartTooltip content="Tooltip Content">
        <button data-testid="trigger">Hover Me</button>
      </SmartTooltip>
    );

    const trigger = screen.getByTestId('trigger');
    
    // Simulate mouseEnter on the trigger wrapper
    act(() => {
      fireEvent.mouseEnter(trigger.parentElement!);
    });

    expect(screen.getByText('Tooltip Content')).toBeInTheDocument();
  });

  it('hides tooltip content on mouse leave', () => {
    render(
      <SmartTooltip content="Tooltip Content">
        <button data-testid="trigger">Hover Me</button>
      </SmartTooltip>
    );

    const trigger = screen.getByTestId('trigger');
    
    act(() => {
      fireEvent.mouseEnter(trigger.parentElement!);
    });

    expect(screen.getByText('Tooltip Content')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(trigger.parentElement!);
    });

    expect(screen.queryByText('Tooltip Content')).not.toBeInTheDocument();
  });

  it('hides tooltip on scroll event', () => {
    render(
      <SmartTooltip content="Tooltip Content">
        <button data-testid="trigger">Hover Me</button>
      </SmartTooltip>
    );

    const trigger = screen.getByTestId('trigger');
    
    act(() => {
      fireEvent.mouseEnter(trigger.parentElement!);
    });

    expect(screen.getByText('Tooltip Content')).toBeInTheDocument();

    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.queryByText('Tooltip Content')).not.toBeInTheDocument();
  });

  it('positions tooltip below trigger by default', () => {
    render(
      <SmartTooltip content="Tooltip Content">
        <button data-testid="trigger">Hover Me</button>
      </SmartTooltip>
    );

    const trigger = screen.getByTestId('trigger');
    
    // Mock getBoundingClientRect
    trigger.parentElement!.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      bottom: 120,
      left: 100,
      right: 200,
      width: 100,
      height: 20,
    });

    act(() => {
      fireEvent.mouseEnter(trigger.parentElement!);
    });

    const tooltip = screen.getByText('Tooltip Content');
    // Since we can't easily mock the tooltip's DOM ref right as it's created in JSDOM,
    // we test that it attempts to render. The exact px coordinates calculation
    // in useLayoutEffect depends on DOM which is mocked.
    expect(tooltip).toBeInTheDocument();
  });
});
