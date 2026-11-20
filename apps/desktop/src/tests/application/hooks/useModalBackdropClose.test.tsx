// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useModalBackdropClose } from '@hooks';

interface TestModalProps {
  disabled?: boolean;
  onClose: () => void;
}

const TestModal = ({ disabled = false, onClose }: TestModalProps) => {
  const backdropProps = useModalBackdropClose(onClose, { disabled });

  return (
    <div data-testid="backdrop" {...backdropProps}>
      <div data-testid="content">
        <input aria-label="Editable content" defaultValue="Drag this text" />
      </div>
    </div>
  );
};

describe('useModalBackdropClose', () => {
  it('closes when the pointer starts and ends on the backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    await user.click(screen.getByTestId('backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when a drag starts in the modal and ends on the backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    await user.pointer([
      { keys: '[MouseLeft>]', target: screen.getByLabelText('Editable content') },
      { target: screen.getByTestId('backdrop') },
      { keys: '[/MouseLeft]', target: screen.getByTestId('backdrop') },
    ]);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close while backdrop dismissal is disabled', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TestModal disabled onClose={onClose} />);

    await user.click(screen.getByTestId('backdrop'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
