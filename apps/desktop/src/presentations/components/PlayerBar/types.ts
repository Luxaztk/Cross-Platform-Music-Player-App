import type { Song, SongChapter } from '@music/types';
import type { RepeatMode, QueueItem } from '@music/hooks/types';

export interface PlayerBarProps {
    className?: string;
}

export interface UsePlayerBarReturn {
    state: {
        currentSong: Song | null;
        currentChapter: SongChapter | null;
        isPlaying: boolean;
        progress: number;
        duration: number;
        volume: number;
        isShuffle: boolean;
        repeatMode: RepeatMode;
        isQueueOpen: boolean;
        isLyricsOpen: boolean;
        isChapterEditorOpen: boolean;
        isSeeking: boolean;
        localProgress: number;
        lastVolume: number;
        queue: QueueItem[];
    };
    refs: {
        queueContainerRef: React.RefObject<HTMLDivElement | null>;
        toggleBtnRef: React.RefObject<HTMLButtonElement | null>;
    };
    actions: {
        play: () => void;
        pause: () => void;
        next: () => void;
        prev: () => void;
        handleSeekStart: () => void;
        handleSeekChange: (val: number) => void;
        handleSeekEnd: (val: number) => void;
        handleVolumeChange: (val: number) => void;
        toggleMute: () => void;
        toggleShuffle: () => void;
        toggleRepeat: () => void;
        toggleQueue: () => void;
        toggleLyrics: () => void;
        setIsQueueOpen: (open: boolean) => void;
        seekToChapter: (chapter: SongChapter) => void;
        nextChapter: () => void;
        prevChapter: () => void;
        setIsChapterEditorOpen: (open: boolean) => void;
    };
    utils: {
        displayProgress: number;
        progressPercent: number;
        volumePercent: number;
        formatTime: (s: number) => string;
        appIcon: string;
        t: (key: string) => string;
    };
}

export interface BasePlayerSectionProps {
    isVisible: boolean;
}

export interface NowPlayingProps extends BasePlayerSectionProps {
    song: Song | null;
    currentChapter?: SongChapter | null;
    appIcon: string;
    onOpenChapters?: () => void;
    t: (key: string) => string;
}

export interface PlaybackControlsProps extends BasePlayerSectionProps {
    isPlaying: boolean;
    isShuffle: boolean;
    repeatMode: RepeatMode;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onToggleShuffle: () => void;
    onToggleRepeat: () => void;
    disabled: boolean;
    t: (key: string) => string;
}

export interface ProgressBarProps extends BasePlayerSectionProps {
    progress: number;
    duration: number;
    percent: number;
    chapters?: SongChapter[];
    onSeekStart: () => void;
    onSeekChange: (val: number) => void;
    onSeekEnd: (val: number) => void;
    formatTime: (s: number) => string;
    disabled: boolean;
}

export interface VolumeControlProps extends BasePlayerSectionProps {
    volume: number;
    percent: number;
    onVolumeChange: (val: number) => void;
    onToggleMute: () => void;
}

