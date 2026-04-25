// @vitest-environment jsdom
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { NotificationItem } from '../../../../presentations/components/Notification/Notification';
import { NotificationProvider } from '../../../../presentations/components/Notification/NotificationProvider';
import { useNotification } from '../../../../application/hooks/useNotification';

// Mock constants
vi.mock('@constants', () => ({
  ICON_SIZES: {
    SMALL: 16,
  },
}));

describe('NotificationItem', () => {
  const mockOnClose = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders correctly with message and type', () => {
    render(
      <NotificationItem
        id="1"
        type="success"
        message="Success message"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(document.querySelector('.notification-item.success')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NotificationItem
        id="1"
        type="info"
        message="Info message"
        onClose={mockOnClose}
      />
    );

    const closeBtn = document.querySelector('.notification-close');
    expect(closeBtn).toBeInTheDocument();
    
    await user.click(closeBtn!);
    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  it('calls onClose automatically after duration', () => {
    vi.useFakeTimers();
    render(
      <NotificationItem
        id="1"
        type="error"
        message="Error message"
        onClose={mockOnClose}
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  it('pauses timer on hover', async () => {
    vi.useFakeTimers();
    const { container } = render(
      <NotificationItem
        id="1"
        type="success"
        message="Hover message"
        onClose={mockOnClose}
      />
    );

    const item = container.querySelector('.notification-item');
    
    fireEvent.mouseEnter(item!);
    
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.mouseLeave(item!);
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockOnClose).toHaveBeenCalledWith('1');
  });
});

describe('NotificationProvider', () => {
  it('renders children and shows notification when context method is called', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const { showNotification } = useNotification();
      return (
        <button onClick={() => showNotification('success', 'Context notification')}>
          Show
        </button>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByText('Show');
    await user.click(button);

    expect(screen.getByText('Context notification')).toBeInTheDocument();
    expect(document.querySelector('.notification-item.success')).toBeInTheDocument();
  });
});
