import React, { useState, useCallback, memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Trash2, ListMusic } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { usePlayer } from '@music/hooks';
import { useLanguage, useTheme } from '@hooks';

import type { Song } from '@music/types';

interface QueueItemRowProps {
  item: { uid: string; song: Song };
  index: number;
  isDraggingActive: boolean;
  onRemove: (index: number) => void;
  t: (key: string) => string;
}

const QueueItemRow = memo(({ item, index, isDraggingActive, onRemove, t }: QueueItemRowProps) => {
  return (
    <Draggable key={item.uid} draggableId={item.uid} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
        const child = (
          <div
            className={`queue-item-wrapper ${snapshot.isDragging ? 'is-in-portal' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={provided.draggableProps.style}
          >
            <div 
              className={`queue-item-content ${snapshot.isDragging ? 'is-dragging' : ''} ${isDraggingActive && !snapshot.isDragging ? 'is-dimmed' : ''}`}
            >
              <div className="drag-handle" {...provided.dragHandleProps}>
                <GripVertical size={14} />
              </div>
              
              <div className="queue-item-info">
                <div className="queue-item-title" title={item.song.title}>{item.song.title}</div>
                <div className="queue-item-artist" title={item.song.artist}>{item.song.artist}</div>
              </div>

              <button
                className="remove-queue-btn"
                onClick={() => onRemove(index)}
                title={t('common.remove') || 'Xoá'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );

        if (snapshot.isDragging) {
          return createPortal(child, document.body);
        }

        return child;
      }}
    </Draggable>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the song identity, index, or dragging state changes
  return (
    prevProps.item.uid === nextProps.item.uid &&
    prevProps.index === nextProps.index &&
    prevProps.isDraggingActive === nextProps.isDraggingActive
  );
});

const QueuePanel: React.FC = () => {
  const { queue: globalQueue, reorderQueue, removeFromQueue: originalRemoveFromQueue } = usePlayer();
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [localQueue, setLocalQueue] = useState(globalQueue);

  // Sync local queue with global queue when global updates (but not during drag)
  useEffect(() => {
    if (!isDraggingActive) {
      setLocalQueue(globalQueue);
    }
  }, [globalQueue, isDraggingActive]);

  const onDragStart = useCallback(() => {
    setIsDraggingActive(true);
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
    setIsDraggingActive(false);
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    // Optimistic local update
    const newLocal = Array.from(localQueue);
    const [removed] = newLocal.splice(startIndex, 1);
    newLocal.splice(endIndex, 0, removed);
    setLocalQueue(newLocal);

    // Defer global update to allow animation to finish
    setTimeout(() => {
      reorderQueue(startIndex, endIndex);
    }, 50);
  }, [localQueue, reorderQueue]);

  const handleRemove = useCallback((index: number) => {
    originalRemoveFromQueue(index);
  }, [originalRemoveFromQueue]);

  return (
    <div className="queue-popover">
      <div className="queue-header">
        <div className="header-left">
          <ListMusic size={18} className="header-icon" />
          <h3>{t('playlist.upNext')}</h3>
        </div>
        <span className="queue-total">{localQueue.length} {t('common.songs') || 'tracks'}</span>
      </div>

      <div className="queue-list-container">
        {localQueue.length === 0 ? (
          <div className="queue-empty">
             <img src={appIcon} alt="" className="empty-brand-icon" />
            <p>{t('playlist.queueEmpty')}</p>
          </div>
        ) : (
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <Droppable droppableId="queue-list">
              {(provided: DroppableProvided) => (
                <div
                  className="queue-list"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {localQueue.slice(0, 50).map((item, idx) => (
                    <QueueItemRow
                      key={item.uid}
                      item={item}
                      index={idx}
                      isDraggingActive={isDraggingActive}
                      onRemove={handleRemove}
                      t={t}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default QueuePanel;
