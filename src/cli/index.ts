import { Command } from 'commander';
import { Effect } from 'effect';
import { analyzeInstall } from '../core/analyzer/index.js';
import { generateReport } from '../core/reporter/index.js';
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
        .argument('[args...]', 'Arguments to pass to the package manager')
        .action(async (args) => {
            await Effect.runPromise(Effect.gen(function* (_) {
                const metrics = yield* analyzeInstall(args || []);
                yield* generateReport(metrics);
            }));
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
