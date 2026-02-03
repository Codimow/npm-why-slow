import { Effect } from 'effect';
import { detectPackageManager } from '../package-managers/detector.js';
import { runPackageManager } from '../package-managers/runner.js';
import { createEmptyMetrics, InstallMetrics } from '../metrics/index.js';
import { parseLine } from './parser.js';

export interface AnalyzeContext {
    metricsRef: { current: InstallMetrics };
    linesRef: { current: string[] };
    onUpdate?: () => void;
}

export const analyzeInstallWithContext = (args: string[], ctx: AnalyzeContext) => Effect.gen(function* (_) {
    const pm = yield* detectPackageManager;
    ctx.metricsRef.current = createEmptyMetrics(pm.type);
    const start = Date.now();

    const handleLine = (line: string) => {
        ctx.linesRef.current.push(line);
        parseLine(pm.type, line, ctx.metricsRef.current);
        ctx.onUpdate?.();
    };

    yield* runPackageManager(pm, ['install', ...args], handleLine);

    const end = Date.now();
    ctx.metricsRef.current.totalTime = end - start;

    return ctx.metricsRef.current;
});

// Legacy function for non-TUI usage
export const analyzeInstall = (args: string[]) => Effect.gen(function* (_) {
    const ctx: AnalyzeContext = {
        metricsRef: { current: createEmptyMetrics('unknown') },
        linesRef: { current: [] },
    };
    return yield* analyzeInstallWithContext(args, ctx);
});
