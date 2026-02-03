import { Effect, Console } from 'effect';
import { InstallMetrics } from '../metrics/index.js';
import picocolors from 'picocolors';

export const generateReport = (metrics: InstallMetrics) => Effect.gen(function* (_) {
    yield* Console.log('\n📊 Analysis Report');
    yield* Console.log('-------------------');
    yield* Console.log(`Package Manager: ${picocolors.cyan(metrics.packageManager)}`);
    yield* Console.log(`Total Time:      ${picocolors.green((metrics.totalTime / 1000).toFixed(2) + 's')}`);

    yield* Console.log('\n(Detailed breakdown not yet implemented)');
});
