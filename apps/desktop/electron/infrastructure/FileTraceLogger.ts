import { logger } from '@music/utils';
import path from 'node:path';

export type FileTraceStatus = 'SUCCESS' | 'FAIL' | 'EMPTY_BUFFER';

export function logFileTrace(fnName: string, filePath: string | undefined, status: FileTraceStatus, details?: string) {
  const absolutePath = filePath ? path.resolve(filePath) : 'N/A';
  const detailText = details ? ` | ${details}` : '';
  const message = `[FILE_TRACE] ${fnName} | ${absolutePath} | ${status}${detailText}`;

  if (status === 'FAIL') {
    logger.error(message);
  } else {
    logger.info(message);
  }
}

export function logIpcTrace(fnName: string, payload: unknown, status: FileTraceStatus, details?: string) {
  const detailText = details ? ` | ${details}` : '';
  console.log(`[FILE_TRACE] ${fnName} | ${JSON.stringify(payload)} | ${status}${detailText}`);
}
