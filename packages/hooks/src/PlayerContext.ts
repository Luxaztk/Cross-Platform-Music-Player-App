import { createContext } from 'react';
import type { PlayerContextProps } from './types/index';



export const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

