import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Song } from '@music/types';
import { DuplicateResolutionModal } from '../../../../presentations/components/DuplicateResolutionModal/DuplicateResolutionModal';
import { useDuplicateResolution } from '../../../../presentations/components/DuplicateResolutionModal/useDuplicateResolution';

vi.mock('../../../../presentations/components/DuplicateResolutionModal/useDuplicateResolution', () => ({
  useDuplicateResolution: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  Check: () => <svg data-testid="icon-check" />,
  Copy: () => <svg data-testid="icon-copy" />,
}));

describe('DuplicateResolutionModal', () => {
  let mockToggleSelect: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockSelectAll: ReturnType<typeof vi.fn>;
  let mockHandleApply: ReturnType<typeof vi.fn>;

  const mockDuplicates: Song[] = [
    { id: '1', title: 'Song 1', filePath: '/path/1.mp3' } as unknown as Song,
    { id: '2', title: 'Song 2', filePath: '/path/2.mp3' } as unknown as Song,
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockToggleSelect = vi.fn();
    mockOnClose = vi.fn();
    mockSelectAll = vi.fn();
    mockHandleApply = vi.fn();

    vi.mocked(useDuplicateResolution).mockReturnValue({
      state: {
        selectedIds: new Set(['1']),
        isAllSelected: false,
      },
      actions: {
        toggleSelect: mockToggleSelect,
        onClose: mockOnClose,
        selectAll: mockSelectAll,
        handleApply: mockHandleApply,
      },
      utils: {
        t: vi.fn((key: string) => key),
      },
    } as unknown as ReturnType<typeof useDuplicateResolution>);
  });

  it('returns null if not open', () => {
    const { container } = render(
      <DuplicateResolutionModal
        isOpen={false}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null if duplicates array is empty', () => {
    const { container } = render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={[]}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with duplicates when open', () => {
    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    expect(screen.getByText('modal.duplicatesFound')).toBeInTheDocument();
    expect(screen.getByText('Song 1')).toBeInTheDocument();
    expect(screen.getByText('/path/1.mp3')).toBeInTheDocument();
    expect(screen.getByText('Song 2')).toBeInTheDocument();
    expect(screen.getByText('/path/2.mp3')).toBeInTheDocument();
  });

  it('calls actions.onClose when close button is clicked', () => {
    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const closeBtns = screen.getAllByRole('button');
    // Top right X button
    act(() => {
      closeBtns[0].click();
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls actions.toggleSelect when a duplicate item is clicked', () => {
    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const song2Item = screen.getByText('Song 2').closest('.duplicate-item');
    act(() => {
      fireEvent.click(song2Item!);
    });

    expect(mockToggleSelect).toHaveBeenCalledWith('2');
  });

  it('shows Check icon for selected item and Copy icon for unselected', () => {
    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const items = document.querySelectorAll('.duplicate-item');
    expect(items[0]).toHaveClass('selected');
    expect(items[0].querySelector('[data-testid="icon-check"]')).toBeInTheDocument();
    
    expect(items[1]).not.toHaveClass('selected');
    expect(items[1].querySelector('[data-testid="icon-copy"]')).toBeInTheDocument();
  });

  it('calls actions.selectAll when Select All button is clicked', () => {
    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const selectAllBtn = screen.getByText('common.selectAll');
    act(() => {
      selectAllBtn.click();
    });
    expect(mockSelectAll).toHaveBeenCalled();
  });

  it('shows Deselect All if all are selected', () => {
    vi.mocked(useDuplicateResolution).mockReturnValue({
      state: {
        selectedIds: new Set(['1', '2']),
        isAllSelected: true,
      },
      actions: {
        toggleSelect: mockToggleSelect,
        onClose: mockOnClose,
        selectAll: mockSelectAll,
        handleApply: mockHandleApply,
      },
      utils: {
        t: vi.fn((key: string) => key),
      },
    } as unknown as ReturnType<typeof useDuplicateResolution>);

    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    expect(screen.getByText('common.deselectAll')).toBeInTheDocument();
  });

  it('calls actions.handleApply when Apply button is clicked', () => {
    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const applyBtn = screen.getByText('common.addSelected');
    expect(applyBtn).not.toBeDisabled();

    act(() => {
      applyBtn.click();
    });

    expect(mockHandleApply).toHaveBeenCalled();
  });

  it('disables Apply button when no items are selected', () => {
    vi.mocked(useDuplicateResolution).mockReturnValue({
      state: {
        selectedIds: new Set([]),
        isAllSelected: false,
      },
      actions: {
        toggleSelect: mockToggleSelect,
        onClose: mockOnClose,
        selectAll: mockSelectAll,
        handleApply: mockHandleApply,
      },
      utils: {
        t: vi.fn((key: string) => key),
      },
    } as unknown as ReturnType<typeof useDuplicateResolution>);

    render(
      <DuplicateResolutionModal
        isOpen={true}
        duplicates={mockDuplicates}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const applyBtn = screen.getByText('common.addSelected');
    expect(applyBtn).toBeDisabled();
  });
});
