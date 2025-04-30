import { StateCreator } from 'zustand';
import { devtools } from './devtools';
import { logger } from './logger';
import { undoRedo } from './undoRedo';

export type Middleware = <T extends object>(
  fn: StateCreator<T, [], []>
) => StateCreator<T, [], []>;

export { devtools, logger, undoRedo }; 