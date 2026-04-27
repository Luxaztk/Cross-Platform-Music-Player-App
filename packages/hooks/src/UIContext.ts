import { createContext } from 'react';
import type { UIContextType } from './types/index';



export const UIContext = createContext<UIContextType | undefined>(undefined);

