import { useState, useEffect, useCallback } from 'react';
import type { Song, Playlist } from '@music/types';
import { useLanguage, useTheme } from '@hooks';
import { splitArtists } from '@music/core';

export const useEditModal = (
  type: 'playlist' | 'song',
  data: Song | Playlist | null,
  isOpen: boolean,
  onClose: () => void,
  onSave: (updatedData: any) => void,
  isBulk: boolean
) => {
  const { t } = useLanguage();
  const { appIcon } = useTheme();

  // Playlist states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  // Song states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [coverArt, setCoverArt] = useState('');

  const [prevData, setPrevData] = useState<Song | Playlist | null>(null);

  // Sync props to state (manual implementation because of the complex data union)
  if (data !== prevData) {
    setPrevData(data);
    if (data) {
      if (type === 'playlist') {
        const p = data as Playlist;
        setName(p.name || '');
        setDescription(p.description || '');
        setThumbnail(p.thumbnail || '');
      } else {
        const s = data as Song;
        setTitle(s.title || '');
        setArtist(s.artist || '');
        setAlbum(s.album || '');
        setCoverArt(s.coverArt || '');
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChooseImage = useCallback(async () => {
    try {
      const path = await window.electronAPI.pickImage();
      if (path) {
        if (type === 'playlist') {
          setThumbnail(path);
        } else {
          setCoverArt(path);
        }
      }
    } catch (err) {
      console.error('Failed to pick image:', err as Error);
    }
  }, [type]);

  const handleSave = useCallback(() => {
    if (type === 'playlist') {
      if (!name.trim()) return;
      onSave({
        ...data,
        name: name.trim(),
        description: description.trim(),
        thumbnail,
      });
    } else {
      if (!isBulk && !title.trim()) return;
      onSave({
        ...data,
        title: title.trim(),
        artist: artist.trim(),
        artists: splitArtists(artist.trim()),
        album: album.trim(),
        coverArt,
      });
    }
    onClose();
  }, [type, data, name, description, thumbnail, title, artist, album, coverArt, isBulk, onSave, onClose]);

  const modalTitle = isBulk ? t('downloader.bulkEditTitle') : (type === 'playlist' ? t('modal.editPlaylist') : t('modal.editSong'));
  const currentImage = type === 'playlist' ? thumbnail : coverArt;

  return {
    state: {
      name,
      description,
      thumbnail,
      title,
      artist,
      album,
      coverArt,
      modalTitle,
      currentImage,
      appIcon
    },
    actions: {
      setName,
      setDescription,
      setThumbnail,
      setTitle,
      setArtist,
      setAlbum,
      setCoverArt,
      handleChooseImage,
      handleSave,
      onClose
    },
    utils: {
      t
    }
  };
};
