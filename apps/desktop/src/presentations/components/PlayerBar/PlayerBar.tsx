import React from 'react';
import { ListMusic, MicVocal } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { usePlayerBar } from './usePlayerBar';
import { NowPlaying } from './components/NowPlaying';
import { PlaybackControls } from './components/PlaybackControls';
import { ProgressBar } from './components/ProgressBar';
import { VolumeControl } from './components/VolumeControl';
import QueuePanel from './QueuePanel';
import './PlayerBar.scss';


export const PlayerBar: React.FC = () => {
    const {
        state,
        refs,
        actions,
        utils
    } = usePlayerBar();

    const { t, formatTime, appIcon } = utils;
    const isDisabled = !state.currentSong;

    return (
        <footer className="player-bar">
            <div className="player-left">
                <NowPlaying
                    isVisible={true}
                    song={state.currentSong}
                    appIcon={appIcon}
                    t={t}
                />
            </div>


            <div className="player-center">
                <div className="player-controls">
                    <PlaybackControls
                        isVisible={true}
                        isPlaying={state.isPlaying}
                        isShuffle={state.isShuffle}
                        repeatMode={state.repeatMode}
                        onPlay={actions.play}
                        onPause={actions.pause}
                        onNext={actions.next}
                        onPrev={actions.prev}
                        onToggleShuffle={actions.toggleShuffle}
                        onToggleRepeat={actions.toggleRepeat}
                        disabled={isDisabled}
                        t={t}
                    />
                </div>

                <ProgressBar
                    isVisible={true}
                    progress={utils.displayProgress}
                    duration={state.duration}
                    percent={utils.progressPercent}
                    onSeekStart={actions.handleSeekStart}
                    onSeekChange={actions.handleSeekChange}
                    onSeekEnd={actions.handleSeekEnd}
                    formatTime={formatTime}
                    disabled={isDisabled}
                />

            </div>


            <div className="player-right">
                <button
                    ref={refs.toggleBtnRef}
                    className={`queue-info ${state.isQueueOpen ? 'active' : ''}`}
                    title={t('player.queue')}
                    onClick={actions.toggleQueue}
                >
                    <ListMusic size={ICON_SIZES.SMALL} />
                    <span className="queue-count">{state.queue.length}</span>
                </button>

                <VolumeControl
                    isVisible={true}
                    volume={state.volume}
                    percent={utils.volumePercent}
                    onVolumeChange={actions.handleVolumeChange}
                    onToggleMute={actions.toggleMute}
                />

                <button
                    className={`control-btn lyrics-toggle ${state.isLyricsOpen ? 'active' : ''}`}
                    onClick={actions.toggleLyrics}
                    title={t('player.lyrics')}
                >
                    <MicVocal size={ICON_SIZES.SMALL} />
                </button>

                {state.isQueueOpen && (
                    <div className="queue-popover-container" ref={refs.queueContainerRef}>
                        <QueuePanel />
                    </div>
                )}
            </div>
        </footer>
    );
};

export default PlayerBar;
