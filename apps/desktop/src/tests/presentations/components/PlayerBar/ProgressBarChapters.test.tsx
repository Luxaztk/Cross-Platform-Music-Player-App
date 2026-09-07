// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProgressBar } from '../../../../presentations/components/PlayerBar/components/ProgressBar';
import type { SongChapter } from '@music/types';

describe('ProgressBar with Chapters', () => {
  const mockChapters: SongChapter[] = [
    { id: 'c1', title: 'Intro', startTime: 0, endTime: 60 },
    { id: 'c2', title: 'Drop Beat', startTime: 60, endTime: 120 },
    { id: 'c3', title: 'Outro', startTime: 120, endTime: 180 },
  ];

  const defaultProps = {
    isVisible: true,
    progress: 30,
    duration: 180,
    percent: 16.67,
    chapters: mockChapters,
    onSeekStart: vi.fn(),
    onSeekChange: vi.fn(),
    onSeekEnd: vi.fn(),
    formatTime: (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`,
    disabled: false,
  };

  it('renders chapter tick marks for chapters starting after 0s', () => {
    const { container } = render(<ProgressBar {...defaultProps} />);

    // Chapters starting at >0 (c2 at 60s, c3 at 120s) should render divider ticks
    const dividers = container.querySelectorAll('.chapter-divider');
    expect(dividers.length).toBe(2);

    // c2 at 60s / 180s = 33.33%
    expect((dividers[0] as HTMLElement).style.left).toContain('33.33');
    // c3 at 120s / 180s = 66.67%
    expect((dividers[1] as HTMLElement).style.left).toContain('66.66');
  });

  it('shows chapter hover tooltip on mouse move over progress container', () => {
    const { container } = render(<ProgressBar {...defaultProps} />);

    const progressContainer = container.querySelector('.progress-container') as HTMLElement;
    expect(progressContainer).toBeInTheDocument();

    // Mock getBoundingClientRect
    vi.spyOn(progressContainer, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 180,
      height: 20,
      bottom: 20,
      right: 180,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Hover at x = 90 (50% -> 90s, which is inside "Drop Beat" chapter)
    fireEvent.mouseMove(progressContainer, { clientX: 90 });

    const tooltip = container.querySelector('.chapter-hover-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip?.textContent).toContain('Drop Beat');
  });

  it('hides hover tooltip on mouse leave', () => {
    const { container } = render(<ProgressBar {...defaultProps} />);

    const progressContainer = container.querySelector('.progress-container') as HTMLElement;
    fireEvent.mouseMove(progressContainer, { clientX: 50 });
    expect(container.querySelector('.chapter-hover-tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(progressContainer);
    expect(container.querySelector('.chapter-hover-tooltip')).not.toBeInTheDocument();
  });

  it('renders .chapter-skipped-region and .chapter-divider.skipped when chapter has skip: true', () => {
    const skippedChapters: SongChapter[] = [
      { id: 'c1', title: 'Intro', startTime: 0, endTime: 60, skip: true },
      { id: 'c2', title: 'Drop Beat', startTime: 60, endTime: 120 },
      { id: 'c3', title: 'Outro', startTime: 120, endTime: 180, skip: true },
    ];

    const { container } = render(<ProgressBar {...defaultProps} chapters={skippedChapters} />);

    const skippedRegions = container.querySelectorAll('.chapter-skipped-region');
    expect(skippedRegions.length).toBe(2);

    const skippedDividers = container.querySelectorAll('.chapter-divider.skipped');
    expect(skippedDividers.length).toBe(1); // c3 at 120s
  });

  it('prevents default on arrow keys and space on the range input to disable native stepping', () => {
    const { container } = render(<ProgressBar {...defaultProps} />);
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    keys.forEach((key) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    // Other keys like Tab or Escape should not be prevented
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
    input.dispatchEvent(tabEvent);
    expect(tabEvent.defaultPrevented).toBe(false);
  });

  it('calls onSeekEnd and blurs range input on pointer up', () => {
    const onSeekEnd = vi.fn();
    const { container } = render(<ProgressBar {...defaultProps} onSeekEnd={onSeekEnd} />);
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;
    const blurSpy = vi.spyOn(input, 'blur');

    fireEvent.pointerUp(input);
    expect(onSeekEnd).toHaveBeenCalled();
    expect(blurSpy).toHaveBeenCalled();
  });
});
