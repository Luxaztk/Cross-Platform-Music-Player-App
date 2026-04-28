/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchOverlay } from '../../../presentations/components/Header/SearchOverlay';

// Mock các hooks
vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'search.noResults': 'Không tìm thấy kết quả',
        'downloader.searching': 'Đang tìm kiếm...',
      };
      return translations[key] || key;
    }
  }),
  useTheme: () => ({
    appIcon: 'mock-icon.png'
  })
}));

describe('SearchOverlay Empty State Test', () => {
  const mockProps = {
    query: 'nơi',
    results: {
      songs: [],
      playlists: [],
      albums: [],
      artists: [],
      isSearching: false
    },
    recentSearches: [],
    selectedIndex: -1,
    onSelect: vi.fn(),
    onSelectRecent: vi.fn(),
    onRemoveRecent: vi.fn(),
    onClearRecent: vi.fn(),
    onPlayNext: vi.fn(),
    onAddToQueue: vi.fn(),
    onClose: vi.fn()
  };

  it('Phải hiển thị "Không tìm thấy kết quả" và icon Search khi danh sách search rỗng và không đang searching', () => {
    const { container } = render(<SearchOverlay {...mockProps} />);
    
    // Kiểm tra xem text "Không tìm thấy kết quả" có xuất hiện không
    const emptyMessage = screen.queryByText(/Không tìm thấy kết quả/i);
    expect(emptyMessage).toBeInTheDocument();

    // Kiểm tra xem có icon Search không (size 48)
    const svg = container.querySelector('svg.lucide-search');
    expect(svg).toBeInTheDocument();
  });
});
