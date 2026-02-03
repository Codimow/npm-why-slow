import { Effect } from 'effect';
import * as fs from 'node:fs/promises';
import { PackageManager } from './types.js';

const checkFile = (file: string) => Effect.tryPromise({
    try: () => fs.access(file).then(() => true).catch(() => false),
    catch: () => false
});

export const detectPackageManager = Effect.gen(function* (_) {
    const hasPnpm = yield* checkFile('pnpm-lock.yaml');
    if (hasPnpm) return { type: 'pnpm', command: 'pnpm', lockfile: 'pnpm-lock.yaml', args: [] } as PackageManager;

    const hasYarn = yield* checkFile('yarn.lock');
    if (hasYarn) return { type: 'yarn', command: 'yarn', lockfile: 'yarn.lock', args: [] } as PackageManager;

    const hasBun = yield* checkFile('bun.lockb');
    if (hasBun) return { type: 'bun', command: 'bun', lockfile: 'bun.lockb', args: [] } as PackageManager;

    // Default to npm
    return { type: 'npm', command: 'npm', lockfile: 'package-lock.json', args: [] } as PackageManager;
});
