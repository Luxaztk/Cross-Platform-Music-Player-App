import { useContext } from 'react';
import { LibraryDataContext, LibraryActionsContext } from './LibraryContext';

export const useLibrary = () => {
  const context = useContext(LibraryDataContext);
  const actions = useContext(LibraryActionsContext);
  if (!context || !actions) {
    throw new Error('useLibrary must be used within a SharedLibraryProvider');
  }
  return { ...context, ...actions };
};

export const useLibraryContext = useLibrary;

export const useLibraryActions = () => {
  const actions = useContext(LibraryActionsContext);
  if (!actions) {
    throw new Error('useLibraryActions must be used within a SharedLibraryProvider');
  }
  return actions;
};
