import { Effect } from 'effect';
import { spawn } from 'node:child_process';
import * as readline from 'node:readline';
import { PackageManager } from './types.js';
import { InstallMetrics } from '../metrics/index.js';

export const runPackageManager = (pm: PackageManager, args: string[], updateMetrics: (line: string) => void) => Effect.gen(function* (_) {
    return yield* Effect.async<void, Error>((resume) => {
        // Force verbose mode based on PM type to get better metrics
        const extraArgs = [...pm.args, ...args];
        if (pm.type === 'npm' && !extraArgs.includes('--verbose')) {
            extraArgs.push('--verbose');
        }
        // TODO: Add pnpm/yarn specifics
        if (pm.type === 'pnpm' && !extraArgs.includes('--reporter=ndjson')) {
            extraArgs.push('--reporter=ndjson');
        }

        const child = spawn(pm.command, extraArgs, {
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: true
        });

        if (child.stdout) {
            const rl = readline.createInterface({ input: child.stdout });
            rl.on('line', (line) => {
                // Pass line to parser/updater
                updateMetrics(line);
                console.log(`[${pm.command}] ${line}`); // echo back to user for now
            });
        }

        if (child.stderr) {
            const rl = readline.createInterface({ input: child.stderr });
            rl.on('line', (line) => {
                // npm often logs interesting stuff to stderr in verbose mode
                updateMetrics(line);
                console.error(`[${pm.command}] ${line}`);
            });
        }

        child.on('error', (err) => resume(Effect.fail(err)));
        child.on('close', (code) => {
            if (code === 0) resume(Effect.void);
            else resume(Effect.fail(new Error(`Process exited with code ${code}`)));
        });
    });
});
