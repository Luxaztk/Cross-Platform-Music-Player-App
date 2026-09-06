import React from 'react';
import { type ProgressBarProps } from '../types';

export const ProgressBar: React.FC<ProgressBarProps> = ({
    isVisible,
    progress,
    duration,
    percent,
    chapters,
    onSeekStart,
    onSeekChange,
    onSeekEnd,
    formatTime,
    disabled
}) => {
    const [hoverPos, setHoverPos] = React.useState<{ xPercent: number; time: number; chapterTitle?: string; isSkipped?: boolean } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    if (!isVisible) return null;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || duration <= 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const xPercent = (x / rect.width) * 100;
        const time = (x / rect.width) * duration;

        let chapterTitle: string | undefined;
        let isSkipped = false;
        if (chapters && chapters.length > 0) {
            for (let i = chapters.length - 1; i >= 0; i--) {
                if (time >= chapters[i].startTime) {
                    chapterTitle = chapters[i].title;
                    isSkipped = !!chapters[i].skip;
                    break;
                }
            }
        }

        setHoverPos({ xPercent, time, chapterTitle, isSkipped });
    };

    const handleMouseLeave = () => {
        setHoverPos(null);
    };

    return (
        <div className="playback-bar">
            <span className="time">{formatTime(progress)}</span>
            <div
                className="progress-container"
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {hoverPos && (
                    <div
                        className="chapter-hover-tooltip"
                        style={{ left: `${hoverPos.xPercent}%` }}
                    >
                        {hoverPos.chapterTitle 
                            ? `📌 ${hoverPos.chapterTitle}${hoverPos.isSkipped ? ' (Skip)' : ''} (${formatTime(hoverPos.time)})` 
                            : formatTime(hoverPos.time)}
                    </div>
                )}
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={progress}
                    onPointerDown={onSeekStart}
                    onChange={(e) => onSeekChange(parseFloat(e.target.value))}
                    onPointerUp={(e) => onSeekEnd(parseFloat((e.target as HTMLInputElement).value))}
                    className="styled-range progress-range"
                    placeholder="Player"
                    style={{ '--range-progress': `${percent}%` } as React.CSSProperties}
                    disabled={disabled}
                />
                {duration > 0 && chapters && chapters.map((ch, idx) => {
                    const startPercent = Math.max(0, (ch.startTime / duration) * 100);
                    const endPercent = ch.endTime ? Math.min(100, (ch.endTime / duration) * 100) : 100;
                    const widthPercent = Math.max(0, endPercent - startPercent);

                    return (
                        <React.Fragment key={ch.id || idx}>
                            {ch.skip && widthPercent > 0 && (
                                <div
                                    className="chapter-skipped-region"
                                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                    title={`${ch.title} (Skip)`}
                                />
                            )}
                            {ch.startTime > 0 && startPercent <= 100 && (
                                <div
                                    className={`chapter-divider ${ch.skip ? 'skipped' : ''}`}
                                    style={{ left: `${startPercent}%` }}
                                    title={`${ch.title} (${formatTime(ch.startTime)})${ch.skip ? ' [Skip]' : ''}`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <span className="time">{formatTime(duration)}</span>
        </div>
    );
};
