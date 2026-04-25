// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuplicateResolutionModal } from '@components/DuplicateResolutionModal';
import type { Song } from '@music/types';

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key
  })
}));

describe('DuplicateResolutionModal', () => {
  const mockSong1: Song = {
    id: 'song1', title: 'Test Song 1', artist: 'Artist 1', album: 'Album',
    duration: 120, filePath: '/path/to/song1.mp3', hash: 'hash1',
    artists: ['Artist 1'], genre: 'Pop', year: 2023, coverArt: null
  };
  const mockSong2: Song = {
    id: 'song2', title: 'Test Song 2', artist: 'Artist 2', album: 'Album',
    duration: 180, filePath: '/path/to/song2.mp3', hash: 'hash2',
    artists: ['Artist 2'], genre: 'Rock', year: 2023, coverArt: null
  };

  const defaultProps = {
    isOpen: true,
    duplicates: [mockSong1, mockSong2],
    onClose: vi.fn(),
    onResolve: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<DuplicateResolutionModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when duplicates array is empty', () => {
    const { container } = render(<DuplicateResolutionModal {...defaultProps} duplicates={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly with given duplicates', () => {
    render(<DuplicateResolutionModal {...defaultProps} />);

    // Header
    expect(screen.getByText('modal.duplicatesFound')).toBeInTheDocument();

    // Content descriptions
    expect(screen.getByText('modal.duplicatesDescription')).toBeInTheDocument();

    // Duplicate Items
    expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    expect(screen.getByText('/path/to/song1.mp3')).toBeInTheDocument();

    expect(screen.getByText('Test Song 2')).toBeInTheDocument();
    expect(screen.getByText('/path/to/song2.mp3')).toBeInTheDocument();

    // Apply button disabled initially
    const addBtn = screen.getByRole('button', { name: /common.addSelected/i });
    expect(addBtn).toBeDisabled();
  });

  it('allows toggling individual selection and updates button state', async () => {
    const user = userEvent.setup();
    render(<DuplicateResolutionModal {...defaultProps} />);

    const song1Text = screen.getByText('Test Song 1');
    const song1Row = song1Text.closest('.duplicate-item');

    const addBtn = screen.getByRole('button', { name: /common.addSelected/i });
    expect(addBtn).toBeDisabled();

    // Click song1 row
    await user.click(song1Row!);

    expect(song1Row).toHaveClass('selected');
    expect(addBtn).toBeEnabled();

    // Click again to deselect
    await user.click(song1Row!);
    expect(song1Row).not.toHaveClass('selected');
    expect(addBtn).toBeDisabled();
  });

  it('allows select all and deselect all functionality', async () => {
    const user = userEvent.setup();
    render(<DuplicateResolutionModal {...defaultProps} />);

    const selectAllBtn = screen.getByRole('button', { name: 'common.selectAll' });

    // Click Select All
    await user.click(selectAllBtn);

    const addBtn = screen.getByRole('button', { name: /common.addSelected/i });
    expect(addBtn).toBeEnabled();

    // Button Text changes to deselectAll
    const deselectAllBtn = screen.getByRole('button', { name: 'common.deselectAll' });
    expect(deselectAllBtn).toBeInTheDocument();

    // Click Deselect All
    await user.click(deselectAllBtn);
    expect(addBtn).toBeDisabled();
  });

  it('handles apply resolution correctly', async () => {
    const user = userEvent.setup();
    render(<DuplicateResolutionModal {...defaultProps} />);

    // Select song 1
    const song1Text = screen.getByText('Test Song 1');
    await user.click(song1Text.closest('.duplicate-item')!);

    // Click apply
    const addBtn = screen.getByRole('button', { name: /common.addSelected/i });
    await user.click(addBtn);

    expect(defaultProps.onResolve).toHaveBeenCalledTimes(1);
    expect(defaultProps.onResolve).toHaveBeenCalledWith([mockSong1]);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button or cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<DuplicateResolutionModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: 'common.cancel' });
    await user.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    const closeIconBtn = screen.getByRole('button', { name: 'common.close' });
    await user.click(closeIconBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
