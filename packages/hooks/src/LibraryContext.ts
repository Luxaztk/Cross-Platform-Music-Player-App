import { createContext } from 'react';
import type { LibraryDataContextType, LibraryActionsContextType } from './types/index';



export const LibraryDataContext = createContext<LibraryDataContextType | undefined>(undefined);
export const LibraryActionsContext = createContext<LibraryActionsContextType | undefined>(undefined);

