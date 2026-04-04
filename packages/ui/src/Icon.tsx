import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = 
  | 'Play' | 'Pause' | 'SkipBack' | 'SkipForward' 
  | 'Volume' | 'VolumeMute' | 'Music' | 'Library' 
  | 'Shuffle' | 'Repeat' | 'RepeatOne' | 'Search' 
  | 'More' | 'Edit' | 'Trash' | 'Plus' | 'List';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const map: Record<IconName, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Play: 'play',
  Pause: 'pause',
  SkipBack: 'skip-previous',
  SkipForward: 'skip-next',
  Volume: 'volume-high',
  VolumeMute: 'volume-off',
  Music: 'music',
  Library: 'library',

  Shuffle: 'shuffle',
  Repeat: 'repeat',
  RepeatOne: 'repeat-once',
  Search: 'magnify',
  More: 'dots-vertical',
  Edit: 'pencil',
  Trash: 'delete',
  Plus: 'plus',
  List: 'playlist-music'
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#fff' }) => {
  const iconName = map[name];
  if (!iconName) return null;
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};
