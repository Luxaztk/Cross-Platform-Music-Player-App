// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HotkeysModal } from '@components/HotkeysModal';

vi.mock('@hooks', () => ({
  useLanguage: () => ({ t: (k: string) => k }) // Mock translation hook
}));

describe('HotkeysModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<HotkeysModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders hotkey groups and items correctly when isOpen is true', () => {
    render(<HotkeysModal {...defaultProps} />);
    
    // Check main title
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    
    // Check group titles
    expect(screen.getByText('Playback')).toBeInTheDocument();
    expect(screen.getByText('UI Controls')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('App Controls')).toBeInTheDocument();
    
    // Check some specific hotkeys
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('Play/Pause')).toBeInTheDocument();
    
    expect(screen.getByText('Shift + ?')).toBeInTheDocument();
    expect(screen.getByText('Show this hotkeys list')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<HotkeysModal {...defaultProps} />);
    
    const closeBtn = screen.getByTitle('common.close');
    await user.click(closeBtn);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<HotkeysModal {...defaultProps} />);
    
    const overlay = container.querySelector('.hotkeys-modal-overlay');
    expect(overlay).toBeInTheDocument();
    
    if (overlay) {
      await user.click(overlay);
    }
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal body is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<HotkeysModal {...defaultProps} />);
    
    const modalBody = container.querySelector('.hotkeys-modal');
    expect(modalBody).toBeInTheDocument();
    
    if (modalBody) {
      await user.click(modalBody);
    }
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
