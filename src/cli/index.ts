import { Command } from 'commander';
import { Effect, Console } from 'effect';
import { analyzeInstallWithContext, AnalyzeContext } from '../core/analyzer/index.js';
import { createEmptyMetrics } from '../core/metrics/index.js';
import { renderTUI } from '../tui/index.js';
import pkg from '../../package.json';

export const run = Effect.gen(function* (_) {
    const program = new Command();

    program
        .name('npm-why-slow')
        .description(pkg.description)
        .version(pkg.version);

    program
        .command('install')
        .description('Run install with full instrumentation')
        .allowUnknownOption()
        .option('--no-tui', 'Disable TUI mode')
        .argument('[args...]', 'Arguments to pass to the package manager')
        .action(async (args, options) => {
            const useTUI = options.tui !== false;

            if (useTUI) {
                const ctx: AnalyzeContext = {
                    metricsRef: { current: createEmptyMetrics('detecting...') },
                    linesRef: { current: [] },
                };
                const isRunningRef = { current: true };

                const { update, unmount, waitUntilExit } = renderTUI(ctx.metricsRef, ctx.linesRef, isRunningRef);
                ctx.onUpdate = update;

                try {
                    await Effect.runPromise(analyzeInstallWithContext(args || [], ctx));
                } finally {
                    isRunningRef.current = false;
                    update();
                    // Keep TUI visible for a moment to show results
                    await new Promise(r => setTimeout(r, 100));
                }

                await waitUntilExit();
            } else {
                // Fallback to simple console output
                await Effect.runPromise(Effect.gen(function* (_) {
                    yield* Console.log('🔍 Detecting package manager...');
                    const ctx: AnalyzeContext = {
                        metricsRef: { current: createEmptyMetrics('unknown') },
                        linesRef: { current: [] },
                        onUpdate: () => { },
                    };
                    const metrics = yield* analyzeInstallWithContext(args || [], ctx);
                    yield* Console.log(`\n📊 Total: ${(metrics.totalTime / 1000).toFixed(2)}s`);
                }));
            }
        });

    program
        .command('report')
        .description('Generate detailed report from last run')
        .action(async () => {
            console.log('Generating report...');
        });

    program
        .command('compare')
        .description('Compare with previous runs')
        .action(async () => {
            console.log('Comparing runs...');
        });

    yield* Effect.try({
        try: () => program.parse(process.argv),
        catch: (err) => new Error(`CLI Parse Error: ${err}`)
    });
});
