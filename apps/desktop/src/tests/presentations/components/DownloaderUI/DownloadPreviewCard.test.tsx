// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DownloadPreviewCard } from '../../../../presentations/components/DownloaderUI/DownloadPreviewCard';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'downloader.status.downloading': 'Đang tải...',
        'downloader.status.converting': 'Đang chuyển đổi...',
        'downloader.status.success': 'Thành công',
        'downloader.status.pending': 'Đang chờ...',
        'common.edit': 'Chỉnh sửa'
      };
      return map[key] || key;
    }
  }),
}));

describe('DownloadPreviewCard', () => {
  const baseItem: DownloadItem = {
    id: 'mock-song-id',
    url: 'https://youtube.com/watch?v=mock',
    title: 'Bài Hát Test',
    artist: 'Nghệ Sĩ Test',
    album: 'Album Test',
    thumbnail: 'https://example.com/thumb.jpg',
    status: DOWNLOAD_STATUS.DOWNLOADING,
    progress: 45
  };

  it('renders downloading state with percentage and progress bar', () => {
    const { container } = render(<DownloadPreviewCard info={baseItem} />);
    
    expect(screen.getByText('Bài Hát Test')).toBeInTheDocument();
    expect(screen.getByText('Nghệ Sĩ Test')).toBeInTheDocument();
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    
    const videoCard = container.querySelector('.video-card');
    expect(videoCard).toHaveClass('status-downloading');

    const fillBar = container.querySelector('.card-progress-bar .fill');
    expect(fillBar).toBeInTheDocument();
    expect(fillBar).toHaveStyle('width: 45%');
    expect(fillBar).not.toHaveClass('converting');
  });

  it('renders converting state with converting badge and shimmer fill bar', () => {
    const convertingItem: DownloadItem = {
      ...baseItem,
      status: DOWNLOAD_STATUS.CONVERTING,
      progress: 100
    };

    const { container } = render(<DownloadPreviewCard info={convertingItem} />);

    expect(screen.getByText('Đang chuyển đổi...')).toBeInTheDocument();
    expect(screen.getByText('FFmpeg...')).toBeInTheDocument();

    const videoCard = container.querySelector('.video-card');
    expect(videoCard).toHaveClass('status-converting');

    const fillBar = container.querySelector('.card-progress-bar .fill');
    expect(fillBar).toBeInTheDocument();
    expect(fillBar).toHaveClass('converting');
    expect(fillBar).toHaveStyle('width: 100%');
  });

  it('renders success state with check icon and success badge', () => {
    const successItem: DownloadItem = {
      ...baseItem,
      status: DOWNLOAD_STATUS.SUCCESS,
      progress: 100
    };

    const { container } = render(<DownloadPreviewCard info={successItem} />);

    expect(screen.getByText('Thành công')).toBeInTheDocument();
    expect(container.querySelector('.status-overlay-icon .success')).toBeInTheDocument();
    expect(container.querySelector('.card-progress-bar')).not.toBeInTheDocument();
  });

  it('allows click interaction when in PREVIEW mode', async () => {
    const user = userEvent.setup();
    const previewItem: DownloadItem = {
      ...baseItem,
      status: DOWNLOAD_STATUS.PREVIEW,
      progress: 0
    };

    const onClickMock = vi.fn();
    const { container } = render(<DownloadPreviewCard info={previewItem} onClick={onClickMock} />);

    const card = container.querySelector('.video-card');
    expect(card).toHaveClass('clickable');

    await user.click(card!);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
