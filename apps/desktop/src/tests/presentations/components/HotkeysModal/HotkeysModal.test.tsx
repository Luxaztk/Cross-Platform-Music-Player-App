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
    expect(screen.getByText('common.keyboardShortcuts')).toBeInTheDocument();
    
    // Check group titles
    expect(screen.getByText('hotkeys.playback')).toBeInTheDocument();
    expect(screen.getByText('hotkeys.ui')).toBeInTheDocument();
    expect(screen.getByText('hotkeys.navigation')).toBeInTheDocument();
    expect(screen.getByText('hotkeys.app')).toBeInTheDocument();
    
    // Check some specific hotkeys
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('hotkeys.playPause')).toBeInTheDocument();
    
    expect(screen.getByText('F1')).toBeInTheDocument();
    expect(screen.getByText('hotkeys.showHotkeys')).toBeInTheDocument();
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
