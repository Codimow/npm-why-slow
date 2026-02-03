import { Effect, Console } from 'effect';
import { detectPackageManager } from '../package-managers/detector.js';
import { runPackageManager } from '../package-managers/runner.js';
import { createEmptyMetrics, InstallMetrics } from '../metrics/index.js';
import { parseLine } from './parser.js';

export const analyzeInstall = (args: string[]) => Effect.gen(function* (_) {
    yield* Console.log('🔍 Detecting package manager...');
    const pm = yield* detectPackageManager;
    yield* Console.log(`✓ Detected: ${pm.type}`);

    yield* Console.log(`🚀 Running ${pm.command} install...`);
    const metrics = createEmptyMetrics(pm.type);
    const start = Date.now();

    // TODO: Pass a stream collector to runPackageManager
    const handleLine = (line: string) => {
        parseLine(pm.type, line, metrics);
    };

    yield* runPackageManager(pm, ['install', ...args], handleLine);

    const end = Date.now();
    metrics.totalTime = end - start;

    return metrics;
});
