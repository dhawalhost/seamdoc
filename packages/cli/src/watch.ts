import fs from 'fs';
import { compileDocument, type CompileOptions } from './compile.js';

export function watchDocument(
  inputPath: string,
  options: CompileOptions,
  onCompileStart?: () => void,
  onCompileEnd?: (outputPath: string) => void,
  onCompileError?: (error: Error) => void,
): fs.FSWatcher {
  let debounceTimer: NodeJS.Timeout | null = null;

  const triggerCompile = async () => {
    if (onCompileStart) {
      onCompileStart();
    }
    try {
      const outPath = await compileDocument(inputPath, options);
      if (onCompileEnd) {
        onCompileEnd(outPath);
      }
    } catch (err) {
      if (onCompileError) {
        onCompileError(err as Error);
      }
    }
  };

  // Initial compile when watch starts
  void triggerCompile();

  const watcher = fs.watch(inputPath, (eventType) => {
    if (eventType === 'change') {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        void triggerCompile();
      }, 150); // 150ms debounce to prevent double-firing during saving
    }
  });

  return watcher;
}
