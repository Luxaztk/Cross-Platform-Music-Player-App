import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QueuePanel from '../../../../presentations/components/PlayerBar/QueuePanel';
import { usePlayer } from '@music/hooks';

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  GripVertical: () => <div data-testid="icon-grip" />,
  Trash2: () => <div data-testid="icon-trash" />,
  ListMusic: () => <div data-testid="icon-list" />,
}));

// Mock @hello-pangea/dnd
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragStart, onDragEnd }: { children: React.ReactNode, onDragStart: () => void, onDragEnd: (result: unknown) => void }) => (
    <div data-testid="dnd-context">
      <button data-testid="trigger-drag-start" onClick={() => onDragStart()} />
      <button data-testid="trigger-drag-end" onClick={(e) => {
        const src = Number(e.currentTarget.dataset.src);
        const destStr = e.currentTarget.dataset.dest;
        const dest = destStr ? Number(destStr) : null;
        onDragEnd({
          source: { index: src },
          destination: dest !== null ? { index: dest } : null
        });
      }} />
      {children}
    </div>
  ),
  Droppable: ({ children }: { children: (provided: unknown) => React.ReactNode }) => children({
    droppableProps: {},
    innerRef: vi.fn(),
    placeholder: <div data-testid="dnd-placeholder" />
  }),
  Draggable: ({ children, index }: { children: (provided: unknown, snapshot: unknown) => React.ReactNode, index: number }) => {
    const isDragging = (window as unknown as Record<string, unknown>).__mockIsDragging === index;
    return children({
      draggableProps: { 'data-testid': `draggable-props-${index}` },
      dragHandleProps: { 'data-testid': `drag-handle-${index}` },
      innerRef: vi.fn()
    }, {
      isDragging
    });
  }
}));

// Mock internal hooks
vi.mock('@hooks', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
  useTheme: () => ({ appIcon: 'mock-app-icon.png' }),
}));

// Mock @music/hooks
vi.mock('@music/hooks', () => ({
  usePlayer: vi.fn(),
}));

describe('QueuePanel', () => {
  const mockReorderQueue = vi.fn();
  const mockRemoveFromQueue = vi.fn();

  beforeEach(() => {
    delete (window as unknown as Record<string, unknown>).__mockIsDragging;
    vi.mocked(usePlayer).mockReturnValue({
      queue: [],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when queue is empty', () => {
    const { container } = render(<QueuePanel />);
    expect(screen.getByText('playlist.queueEmpty')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', 'mock-app-icon.png');
  });

  it('renders queue items correctly when queue has items', () => {
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
        { uid: 'u2', song: { title: 'Song 2', artist: 'Artist 2' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    render(<QueuePanel />);
    expect(screen.getByText('playlist.upNext')).toBeInTheDocument();
    expect(screen.getByText('2 common.songs')).toBeInTheDocument();
    
    expect(screen.getByText('Song 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Song 2')).toBeInTheDocument();
    expect(screen.getByText('Artist 2')).toBeInTheDocument();
  });

  it('calls removeFromQueue when remove button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    render(<QueuePanel />);
    const removeBtn = screen.getByTitle('common.remove');
    await user.click(removeBtn);

    expect(mockRemoveFromQueue).toHaveBeenCalledWith(0);
  });

  it('handles drag start and changes state correctly', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
        { uid: 'u2', song: { title: 'Song 2', artist: 'Artist 2' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    const { container } = render(<QueuePanel />);
    
    // Trigger onDragStart
    const dragStartBtn = screen.getByTestId('trigger-drag-start');
    await user.click(dragStartBtn);

    // After drag start, the non-dragged items should have 'is-dimmed' class
    // We didn't set __mockIsDragging, so isDragging is false for both.
    // Since isDraggingActive is true, both should have 'is-dimmed'
    const itemContents = container.querySelectorAll('.queue-item-content');
    expect(itemContents[0]).toHaveClass('is-dimmed');
    expect(itemContents[1]).toHaveClass('is-dimmed');
  });

  it('handles drag end with valid destination', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
        { uid: 'u2', song: { title: 'Song 2', artist: 'Artist 2' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    render(<QueuePanel />);
    
    // Trigger onDragEnd (move item 0 to 1)
    const dragEndBtn = screen.getByTestId('trigger-drag-end');
    dragEndBtn.dataset.src = '0';
    dragEndBtn.dataset.dest = '1';
    
    await user.click(dragEndBtn);

    // Check optimistic local update (Song 2 should now be before Song 1)
    // Actually the DOM order reflects localQueue. Song 2 will be first.
    const titles = screen.getAllByText(/Song [12]/);
    expect(titles[0]).toHaveTextContent('Song 2');
    expect(titles[1]).toHaveTextContent('Song 1');

    // reorderQueue is deferred by setTimeout 50ms
    expect(mockReorderQueue).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockReorderQueue).toHaveBeenCalledWith(0, 1);
    });
  });

  it('ignores drag end with invalid destination', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    render(<QueuePanel />);
    const dragEndBtn = screen.getByTestId('trigger-drag-end');
    dragEndBtn.dataset.src = '0';
    // omitting dest makes it null
    
    await user.click(dragEndBtn);

    expect(mockReorderQueue).not.toHaveBeenCalled();
    await new Promise(r => setTimeout(r, 60));
    expect(mockReorderQueue).not.toHaveBeenCalled();
  });

  it('ignores drag end with same index', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    render(<QueuePanel />);
    const dragEndBtn = screen.getByTestId('trigger-drag-end');
    dragEndBtn.dataset.src = '0';
    dragEndBtn.dataset.dest = '0';
    
    await user.click(dragEndBtn);

    expect(mockReorderQueue).not.toHaveBeenCalled();
    await new Promise(r => setTimeout(r, 60));
    expect(mockReorderQueue).not.toHaveBeenCalled();
  });

  it('renders correctly when item is dragging via portal', () => {
    (window as unknown as Record<string, unknown>).__mockIsDragging = 0; // The first item is dragging
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'Song 1', artist: 'Artist 1' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    const { baseElement } = render(<QueuePanel />);
    
    // When isDragging is true, it uses createPortal to document.body
    // So the element should be appended to body (baseElement in RTL)
    const draggedItem = baseElement.querySelector('.queue-item-wrapper.is-in-portal');
    expect(draggedItem).toBeInTheDocument();
    
    const content = baseElement.querySelector('.queue-item-content.is-dragging');
    expect(content).toBeInTheDocument();
  });

  it('updates localQueue when globalQueue changes if not dragging', () => {
    const { rerender } = render(<QueuePanel />);
    expect(screen.getByText('playlist.queueEmpty')).toBeInTheDocument();

    // Now update the hook return value
    vi.mocked(usePlayer).mockReturnValue({
      queue: [
        { uid: 'u1', song: { title: 'New Song', artist: 'Artist' } },
      ],
      reorderQueue: mockReorderQueue,
      removeFromQueue: mockRemoveFromQueue,
    } as unknown as ReturnType<typeof usePlayer>);

    // Re-render to pick up new hook values
    rerender(<QueuePanel />);

    expect(screen.getByText('New Song')).toBeInTheDocument();
  });
});
