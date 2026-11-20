import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Song, Playlist } from '@music/types';
import { useLanguage, useTheme } from '@hooks';
import { useLibraryContext } from '@music/hooks';
import { canonicalizeArtistCredits, canonicalizeArtists } from '@music/core';
import { compareVietnameseText } from '@music/utils';

const uniqueMetadataValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  return values.reduce<string[]>((result, rawValue) => {
    const value = rawValue.trim();
    const key = value.toLocaleLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
    return result;
  }, []);
};

const getSongArtists = (song: Song): string[] => {
  return canonicalizeArtistCredits(song.artist, song.artists);
};

export const useEditModal = <TData extends Song | Playlist>(
  type: 'playlist' | 'song',
  data: TData | null,
  isOpen: boolean,
  onClose: () => void,
  onSave: (updatedData: TData) => void | Promise<void>,
  isBulk: boolean
) => {
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const { songs } = useLibraryContext();

  // Playlist states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  // Song states
  const [title, setTitle] = useState('');
  const [artists, setArtists] = useState<string[]>([]);
  const [album, setAlbum] = useState('');
  const [coverArt, setCoverArt] = useState('');

  const [prevData, setPrevData] = useState<TData | null>(null);

  const artistOptions = useMemo(
    () => uniqueMetadataValues(songs.flatMap(getSongArtists)).sort(compareVietnameseText),
    [songs]
  );
  const albumOptions = useMemo(
    () => uniqueMetadataValues(songs.map((song) => song.album || '')).sort(compareVietnameseText),
    [songs]
  );

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
        setArtists(getSongArtists(s));
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

  const parseArtistInput = useCallback((value: string) => canonicalizeArtists([value]), []);

  const handleSave = useCallback(() => {
    if (type === 'playlist') {
      if (!name.trim()) return;
      void onSave({
        ...data,
        name: name.trim(),
        description: description.trim(),
        thumbnail,
      } as TData);
    } else {
      if (!isBulk && !title.trim()) return;
      const normalizedArtists = canonicalizeArtists(artists);
      void onSave({
        ...data,
        title: title.trim(),
        artist: normalizedArtists.join(', '),
        artists: normalizedArtists,
        album: album.trim(),
        coverArt,
      } as TData);
    }
    onClose();
  }, [type, data, name, description, thumbnail, title, artists, album, coverArt, isBulk, onSave, onClose]);

  const modalTitle = isBulk ? t('downloader.bulkEditTitle') : (type === 'playlist' ? t('modal.editPlaylist') : t('modal.editSong'));
  const currentImage = type === 'playlist' ? thumbnail : coverArt;

  return {
    state: {
      name,
      description,
      thumbnail,
      title,
      artists,
      artistOptions,
      albumOptions,
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
      setArtists,
      setAlbum,
      setCoverArt,
      handleChooseImage,
      parseArtistInput,
      handleSave,
      onClose
    },
    utils: {
      t
    }
  };
};
