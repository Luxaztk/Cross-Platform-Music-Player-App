// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VolumeControl } from '../../../../presentations/components/PlayerBar/components/VolumeControl';

describe('VolumeControl', () => {
  const defaultProps = {
    isVisible: true,
    volume: 0.5,
    percent: 50,
    onVolumeChange: vi.fn(),
    onToggleMute: vi.fn(),
  };

  it('renders volume control when visible', () => {
    const { container } = render(<VolumeControl {...defaultProps} />);
    const rangeInput = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(rangeInput).toBeInTheDocument();
    expect(rangeInput.value).toBe('0.5');
  });

  it('does not render when isVisible is false', () => {
    const { container } = render(<VolumeControl {...defaultProps} isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('prevents default on arrow keys and space to disable native range stepping', () => {
    const { container } = render(<VolumeControl {...defaultProps} />);
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;

    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    keys.forEach((key) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
    input.dispatchEvent(tabEvent);
    expect(tabEvent.defaultPrevented).toBe(false);
  });

  it('blurs range input on pointer up', () => {
    const { container } = render(<VolumeControl {...defaultProps} />);
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;
    const blurSpy = vi.spyOn(input, 'blur');

    fireEvent.pointerUp(input);
    expect(blurSpy).toHaveBeenCalled();
  });

  it('calls onToggleMute when clicking volume button', () => {
    const onToggleMute = vi.fn();
    const { container } = render(<VolumeControl {...defaultProps} onToggleMute={onToggleMute} />);
    const btn = container.querySelector('.volume-btn') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(onToggleMute).toHaveBeenCalled();
  });
});
