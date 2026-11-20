import type { Playlist, Song } from '@music/types';

export interface EditModalProps<TData extends Song | Playlist = Song | Playlist> {
  type: 'playlist' | 'song';
  data: TData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: TData) => void | Promise<void>;
  isBulk?: boolean;
}

export interface CreatableMetadataInputProps {
  id: string;
  label: string;
  placeholder: string;
  options: string[];
  values: string[];
  multiple?: boolean;
  createLabel: string;
  noResultsLabel: string;
  removeValueLabel: string;
  parseValue?: (value: string) => string[];
  onChange: (values: string[]) => void;
}
