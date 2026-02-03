import { Effect, Console } from 'effect';
import { InstallMetrics } from '../metrics/index.js';
import picocolors from 'picocolors';

export const generateReport = (metrics: InstallMetrics) => Effect.gen(function* (_) {
    yield* Console.log('\n📊 Analysis Report');
    yield* Console.log('-------------------');
    yield* Console.log(`Package Manager: ${picocolors.cyan(metrics.packageManager)}`);
    yield* Console.log(`Total Time:      ${picocolors.green((metrics.totalTime / 1000).toFixed(2) + 's')}`);
    yield* Console.log(`Network Time:    ${picocolors.blue((metrics.networkTime / 1000).toFixed(2) + 's')}`);
    yield* Console.log(`IO/Extract Time: ${picocolors.yellow((metrics.ioTime / 1000).toFixed(2) + 's')}`);

    if (metrics.networkTime > metrics.totalTime * 0.5) {
        yield* Console.log(picocolors.red('\n! High network usage detected. Check your connection or registry proxy.'));
    }
    if (metrics.ioTime > metrics.totalTime * 0.5) {
        yield* Console.log(picocolors.yellow('\n! High disk I/O detected. Anti-virus scanning node_modules?'));
    }
});
