import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import {
  Sidebar,
  Header,
  PlayerBar,
  DuplicateResolutionModal,
  LyricsPanel,
  HotkeysModal,
} from '@components'
import { useUI, useLibraryContext } from '@music/hooks'
import { useLanguage, useNotification, useGlobalHotkeys } from '@hooks'
import './MainLayout.scss'

const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false)
  const { duplicateSongs, handleAddSongs, clearDuplicates } = useLibraryContext()
  const { showNotification } = useNotification()
  const { isLyricsOpen } = useUI()
  const { t } = useLanguage()

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  // Global hotkeys
  useGlobalHotkeys({
    onOpenHotkeysModal: () => setIsHotkeysModalOpen(true),
    onCloseHotkeysModal: () => setIsHotkeysModalOpen(false),
    isHotkeysModalOpen,
  })

  // Show notification when duplicates are detected
  useEffect(() => {
    if (duplicateSongs.length > 0) {
      showNotification('info', t('modal.duplicatesFound') || 'Phát hiện bài hát trùng lặp')
    }
  }, [duplicateSongs.length, showNotification, t])

  return (
    <div className={`main-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Header />
      <div className="layout-mid">
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        <main className="main-area">
          <Outlet />
        </main>

        {isLyricsOpen && (
          <aside className="lyrics-sidebar">
            <LyricsPanel />
          </aside>
        )}
      </div>
      <PlayerBar />

      <DuplicateResolutionModal
        isOpen={duplicateSongs.length > 0}
        duplicates={duplicateSongs}
        onClose={clearDuplicates}
        onResolve={handleAddSongs}
      />

      <HotkeysModal isOpen={isHotkeysModalOpen} onClose={() => setIsHotkeysModalOpen(false)} />
    </div>
  )
}

export default MainLayout
