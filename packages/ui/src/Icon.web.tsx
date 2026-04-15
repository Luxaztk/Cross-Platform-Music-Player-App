import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName =
  | 'Play' | 'Pause' | 'SkipBack' | 'SkipForward'
  | 'Volume' | 'VolumeMute' | 'Music' | 'Library'
  | 'Shuffle' | 'Repeat' | 'RepeatOne' | 'Search'
  | 'More' | 'Edit' | 'Trash' | 'Plus' | 'List';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
  className?: string;
}

const map: Record<IconName, keyof typeof LucideIcons> = {
  Play: 'Play',
  Pause: 'Pause',
  SkipBack: 'SkipBack',
  SkipForward: 'SkipForward',
  Volume: 'Volume2',
  VolumeMute: 'VolumeX',
  Music: 'Music',
  Library: 'ListMusic',
  Shuffle: 'Shuffle',
  Repeat: 'Repeat',
  RepeatOne: 'Repeat1',
  Search: 'Search',
  More: 'MoreVertical',
  Edit: 'Edit2',
  Trash: 'Trash2',
  Plus: 'Plus',
  List: 'ListPlus'
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'currentColor', fill = 'none', className }) => {
  const LucideIcon = LucideIcons[map[name]] as React.FC<{ size?: number; color?: string; fill?: string; className?: string }>;
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} fill={fill} className={className} />;
};
