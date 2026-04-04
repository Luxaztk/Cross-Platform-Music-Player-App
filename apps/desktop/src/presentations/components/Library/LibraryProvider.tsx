import React, { type ReactNode } from 'react';
import { LibraryProvider as SharedLibraryProvider } from '@music/hooks';
import { ElectronLibraryRepository } from '../../../infrastructure/repositories';

const repo = new ElectronLibraryRepository();

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SharedLibraryProvider repository={repo}>
      {children}
    </SharedLibraryProvider>
  );
};

export { useLibraryContext } from '@music/hooks';
