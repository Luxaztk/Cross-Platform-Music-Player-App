import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncHistoryModal } from '../../../../presentations/components/Library/SyncHistoryModal';
import { useLibrary } from '@music/hooks';
import { useLanguage } from '@hooks';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks
vi.mock('@music/hooks', () => ({
  useLibrary: vi.fn(),
}));

vi.mock('@hooks', () => ({
  useLanguage: vi.fn(),
}));

describe('SyncHistoryModal', () => {
  const mockGetSyncHistory = vi.fn();
  const mockClearSyncHistory = vi.fn();
  const mockHistory = [
    {
      id: '1',
      timestamp: '2026-04-26T12:00:00Z',
      stats: { added: 5, migrated: 2, deleted: 0 },
      details: ['[Added] Song 1', '[Migrated] Song 2'],
    },
    {
      id: '2',
      timestamp: '2026-04-26T13:00:00Z',
      stats: { added: 0, migrated: 0, deleted: 3 },
      details: ['[Deleted] Song 3', '[Error] Failed 1'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLibrary as any).mockReturnValue({
      getSyncHistory: mockGetSyncHistory,
      clearSyncHistory: mockClearSyncHistory,
    });
    (useLanguage as any).mockReturnValue({
      t: (key: string) => {
        if (key === 'libraryCleanup.historyTitle') return 'Lịch sử đồng bộ thư viện';
        if (key === 'libraryCleanup.noHistory') return 'Chưa có hoạt động đồng bộ nào được ghi lại.';
        if (key === 'libraryCleanup.clearHistory') return 'Xóa lịch sử';
        if (key === 'libraryCleanup.clearHistoryConfirm') return 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử đồng bộ?';
        if (key === 'common.close') return 'Close';
        return key;
      },
    });
    mockGetSyncHistory.mockResolvedValue(mockHistory);

    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  it('should not render when isOpen is false', () => {
    render(<SyncHistoryModal isOpen={false} onClose={() => { }} />);
    expect(screen.queryByText('Lịch sử đồng bộ thư viện')).not.toBeInTheDocument();
  });

  it('should fetch and display history when opened', async () => {
    await act(async () => {
      render(<SyncHistoryModal isOpen={true} onClose={() => { }} />);
    });

    expect(mockGetSyncHistory).toHaveBeenCalled();
    expect(screen.getByText('Lịch sử đồng bộ thư viện')).toBeInTheDocument();

    // Check items
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('~2')).toBeInTheDocument();
    expect(screen.getByText('[Added] Song 1')).toBeInTheDocument();
    expect(screen.getByText('[Error] Failed 1')).toBeInTheDocument();
  });

  it('should display empty state when no history exists', async () => {
    mockGetSyncHistory.mockResolvedValue([]);

    await act(async () => {
      render(<SyncHistoryModal isOpen={true} onClose={() => { }} />);
    });

    expect(screen.getByText('Chưa có hoạt động đồng bộ nào được ghi lại.')).toBeInTheDocument();
  });

  it('should call clearSyncHistory when clear button is clicked and confirmed', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<SyncHistoryModal isOpen={true} onClose={() => { }} />);
    });

    const clearBtn = screen.getByText('Xóa lịch sử');
    await user.click(clearBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearSyncHistory).toHaveBeenCalled();
    expect(screen.getByText('Chưa có hoạt động đồng bộ nào được ghi lại.')).toBeInTheDocument();
  });

  it('should close when close button or overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    await act(async () => {
      render(<SyncHistoryModal isOpen={true} onClose={onClose} />);
    });

    // Click close button (using title from translation)
    const closeBtn = screen.getByTitle('Close'); // Default translation for common.close
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    // Click overlay
    const overlay = screen.getByText('Lịch sử đồng bộ thư viện').closest('.cleanup-modal')?.parentElement;
    if (overlay) await user.click(overlay);
    // onClose was called again
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
