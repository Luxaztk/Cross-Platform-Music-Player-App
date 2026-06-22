import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloaderTool } from '../../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool';
import { DOWNLOAD_STATUS } from '@music/types';

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="icon-search" />,
  Clipboard: () => <svg data-testid="icon-clipboard" />,
  Loader2: () => <svg data-testid="icon-loader" />,
  Download: () => <svg data-testid="icon-download" />,
  Edit2: () => <svg data-testid="icon-edit" />,
  Folder: () => <svg data-testid="icon-folder" />,
}));

vi.mock('@components', () => ({
  DownloadPreviewCard: ({ info, onClick }: { info: { id: string; title: string }; onClick?: () => void }) => (
    <div data-testid={`preview-card-${info.id}`} onClick={onClick}>
      Card {info.title}
    </div>
  ),
  DuplicateWarningBanner: ({ duplicateInfo }: { duplicateInfo?: { warning: string | null; resolution: string } }) => duplicateInfo?.warning ? (
    <div data-testid="duplicate-warning">Warning: {duplicateInfo.warning}</div>
  ) : null,
}));

describe('DownloaderTool', () => {
  let mockManager: any;
  let mockOnFetch: () => Promise<void>;
  let mockOnPaste: () => Promise<void>;
  let mockOnEditItem: (item: unknown) => void;
  let mockOnBulkEdit: (val: boolean) => void;
  let mockT: (key: string, options?: unknown) => string;

  beforeEach(() => {
    mockOnFetch = vi.fn().mockResolvedValue(undefined);
    mockOnPaste = vi.fn().mockResolvedValue(undefined);
    mockOnEditItem = vi.fn();
    mockOnBulkEdit = vi.fn();
    mockT = vi.fn((key: string) => key);

    mockManager = {
      url: '',
      setUrl: vi.fn(),
      downloadState: DOWNLOAD_STATUS.IDLE,
      previewItems: [],
      downloads: new Map(),
      duplicateInfo: { warning: null, resolution: 'skip' },
      totalProgress: 0,
      fetchInfo: vi.fn(),
      resetDownload: vi.fn(),
      executeDownload: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).electronAPI = {
      openDownloadsFolder: vi.fn(),
    };
  });

  it('renders nothing if isVisible is false', () => {
    const { container } = render(
      <DownloaderTool
        isVisible={false}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders basic input layout when IDLE', () => {
    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    expect(screen.getByText('downloader.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('downloader.urlPlaceholder')).toBeInTheDocument();
    expect(screen.getByTestId('icon-clipboard')).toBeInTheDocument();
    expect(screen.getByText('downloader.fetchInfo')).toBeInTheDocument();
  });

  it('updates url on input change and triggers fetch on Enter', () => {
    mockManager.url = 'http://test';
    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    const input = screen.getByPlaceholderText('downloader.urlPlaceholder');
    fireEvent.change(input, { target: { value: 'http://new' } });
    expect(mockManager.setUrl).toHaveBeenCalledWith('http://new');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnFetch).toHaveBeenCalled();
  });

  it('calls onPaste when paste button is clicked', () => {
    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    const pasteBtn = screen.getByTitle('downloader.paste');
    fireEvent.click(pasteBtn);
    expect(mockOnPaste).toHaveBeenCalled();
  });

  it('shows mode selection when state is MODE_SELECTION', () => {
    mockManager.downloadState = DOWNLOAD_STATUS.MODE_SELECTION;
    mockManager.url = 'http://test';

    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    expect(screen.getByText('downloader.choiceRequired')).toBeInTheDocument();
    
    screen.getByText('downloader.downloadVideoOnly').click();
    expect(mockManager.fetchInfo).toHaveBeenCalledWith('http://test', 'section', 'video');

    screen.getByText('downloader.downloadPlaylist').click();
    expect(mockManager.fetchInfo).toHaveBeenCalledWith('http://test', 'section', 'playlist');
  });

  it('renders preview items and handles single item edit', () => {
    mockManager.downloadState = DOWNLOAD_STATUS.PREVIEW;
    mockManager.previewItems = [
      { id: '1', title: 'Song 1' }
    ];

    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    const card = screen.getByTestId('preview-card-1');
    expect(card).toBeInTheDocument();
    fireEvent.click(card);
    expect(mockOnEditItem).toHaveBeenCalledWith(mockManager.previewItems[0]);
  });

  it('renders bulk edit button for multiple preview items', () => {
    mockManager.downloadState = DOWNLOAD_STATUS.PREVIEW;
    mockManager.previewItems = [
      { id: '1', title: 'Song 1' },
      { id: '2', title: 'Song 2' }
    ];

    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    const bulkBtn = screen.getByText('downloader.editAll');
    expect(bulkBtn).toBeInTheDocument();
    fireEvent.click(bulkBtn);
    expect(mockOnBulkEdit).toHaveBeenCalledWith(true);
  });

  it('renders duplicate warning banner and action buttons', () => {
    mockManager.downloadState = DOWNLOAD_STATUS.PREVIEW;
    mockManager.previewItems = [{ id: '1', title: 'Song 1' }];
    mockManager.duplicateInfo = { warning: 'Duplicates found', resolution: 'skip' };

    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    expect(screen.getByTestId('duplicate-warning')).toBeInTheDocument();
    
    screen.getByText('common.cancel').click();
    expect(mockManager.resetDownload).toHaveBeenCalled();

    screen.getByText('downloader.downloadAnyway').click();
    expect(mockManager.executeDownload).toHaveBeenCalledWith(true);
  });

  it('renders single download monitor when successfully downloaded', () => {
    mockManager.downloadState = DOWNLOAD_STATUS.SUCCESS;
    mockManager.downloads.set('1', { id: '1', title: 'Song 1' });

    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    expect(screen.getByTestId('preview-card-1')).toBeInTheDocument();
    
    screen.getAllByText('common.openFolder').forEach(node => {
      // Find the one that's inside a button and click it
      if (node.tagName.toLowerCase() === 'span') {
         fireEvent.click(node.closest('button')!);
      }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).electronAPI.openDownloadsFolder).toHaveBeenCalled();

    screen.getByText('common.done').click();
    expect(mockManager.resetDownload).toHaveBeenCalled();
  });

  it('renders multiple download monitor when downloading multiple', () => {
    mockManager.downloadState = DOWNLOAD_STATUS.SUCCESS;
    mockManager.downloads.set('1', { id: '1', title: 'Song 1' });
    mockManager.downloads.set('2', { id: '2', title: 'Song 2' });
    mockManager.totalProgress = 50;

    render(
      <DownloaderTool
        isVisible={true}
        manager={mockManager}
        onFetch={mockOnFetch}
        onPaste={mockOnPaste}
        onEditItem={mockOnEditItem}
        onBulkEdit={mockOnBulkEdit}
        t={mockT}
      />
    );

    expect(screen.getByText('downloader.downloadingCount')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    screen.getByText('common.done').click();
    expect(mockManager.resetDownload).toHaveBeenCalled();
  });
});
