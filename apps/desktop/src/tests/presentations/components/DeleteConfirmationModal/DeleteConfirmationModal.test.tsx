// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteConfirmationModal } from '@components/DeleteConfirmationModal';

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key
  })
}));

vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  AlertTriangle: () => <div data-testid="icon-alert" />
}));

vi.mock('@constants', () => ({
  ICON_SIZES: { SMALL: 16 }
}));

describe('DeleteConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<DeleteConfirmationModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when isOpen is true', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('modal.undoneWarning')).toBeInTheDocument();
  });

  it('renders itemName and messageSuffix when provided', () => {
    render(
      <DeleteConfirmationModal
        {...defaultProps}
        itemName="Song 1"
        messageSuffix="permanently"
      />
    );
    expect(screen.getByText(/"Song 1"/)).toBeInTheDocument();
    expect(screen.getByText(/permanently/)).toBeInTheDocument();
  });

  it('does not render undone warning if showUndoneWarning is false', () => {
    render(<DeleteConfirmationModal {...defaultProps} showUndoneWarning={false} />);
    expect(screen.queryByText('modal.undoneWarning')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const cancelBtn = screen.getByText('common.cancel');
    await user.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} confirmText="Yes, delete it" />);

    const confirmBtn = screen.getByText('Yes, delete it');
    await user.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<DeleteConfirmationModal {...defaultProps} />);

    const overlay = container.querySelector('.modal-overlay');
    expect(overlay).not.toBeNull();

    await user.click(overlay!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal body is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<DeleteConfirmationModal {...defaultProps} />);

    const modal = container.querySelector('.delete-modal');
    expect(modal).not.toBeNull();

    await user.click(modal!);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close icon is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: 'common.close' });
    await user.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
