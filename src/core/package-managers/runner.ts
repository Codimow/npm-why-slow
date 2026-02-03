import { Effect } from 'effect';
import { spawn } from 'node:child_process';
import { PackageManager } from './types.js';

export const runPackageManager = (pm: PackageManager, args: string[]) => Effect.gen(function* (_) {
    // This is a placeholder for the actual execution logic
    // which will need to stream output and parse it
    return yield* Effect.async<void, Error>((resume) => {
        const child = spawn(pm.command, [...pm.args, ...args], {
            stdio: 'inherit', // For now, just inherit
            shell: true
        });

        child.on('error', (err) => resume(Effect.fail(err)));
        child.on('close', (code) => {
            if (code === 0) resume(Effect.void);
            else resume(Effect.fail(new Error(`Process exited with code ${code}`)));
        });
    });
});
