import { describe, it, expect } from 'vitest';
import { parseLine } from '../../src/core/analyzer/parser.js';
import { createEmptyMetrics } from '../../src/core/metrics/index.js';

describe('Parser', () => {
    it('should parse npm network timing with package name', () => {
        const metrics = createEmptyMetrics('npm');
        const line = 'npm http fetch GET 200 https://registry.npmjs.org/lodash 123ms';
        parseLine('npm', line, metrics);
        expect(metrics.networkTime).toBe(123);
        expect(metrics.packages['lodash']).toBeDefined();
        expect(metrics.packages['lodash'].downloadDuration).toBe(123);
    });

    it('should parse npm extraction timing', () => {
        const metrics = createEmptyMetrics('npm');
        const line = 'npm timing action:extract Completed in 14ms';
        parseLine('npm', line, metrics);
        expect(metrics.ioTime).toBe(14);
    });

    it('should parse npm script timing with package name', () => {
        const metrics = createEmptyMetrics('npm');
        parseLine('npm', 'npm timing action:run-script:postinstall:esbuild Completed in 500ms', metrics);
        expect(metrics.cpuTime).toBe(500);
        expect(metrics.scriptDuration).toBe(500);
        expect(metrics.packages['esbuild']).toBeDefined();
        expect(metrics.packages['esbuild'].scriptDuration).toBe(500);
    });

    it('should ignore irrelevant lines', () => {
        const metrics = createEmptyMetrics('npm');
        parseLine('npm', 'npm info using npm@11.7.0', metrics);
        expect(metrics.networkTime).toBe(0);
        expect(metrics.ioTime).toBe(0);
    });

    it('should accumulate multiple package timings', () => {
        const metrics = createEmptyMetrics('npm');
        parseLine('npm', 'npm http fetch GET 200 https://registry.npmjs.org/lodash 100ms', metrics);
        parseLine('npm', 'npm http fetch GET 200 https://registry.npmjs.org/express 200ms', metrics);
        expect(metrics.networkTime).toBe(300);
        expect(Object.keys(metrics.packages).length).toBe(2);
    });
    it('should split scoped packages name correctly in npm', () => {
        const metrics = createEmptyMetrics('npm');
        const line = 'npm http fetch GET 200 https://registry.npmjs.org/@types%2fnode 50ms';
        parseLine('npm', line, metrics);
        expect(metrics.packages['@types/node']).toBeDefined();
    });

    it('should parse pnpm ndjson events', () => {
        const metrics = createEmptyMetrics('pnpm');

        // Resolution stage
        parseLine('pnpm', '{"name":"pnpm:stage","stage":"resolution_done","duration":500}', metrics);
        expect(metrics.stages.resolution).toBe(500);

        // Fetching
        parseLine('pnpm', '{"name":"pnpm:fetching","status":"done","pkg":{"name":"react","version":"18.0.0"},"duration":200}', metrics);
        expect(metrics.networkTime).toBe(200);
        expect(metrics.packages['react']).toBeDefined();
        expect(metrics.packages['react'].downloadDuration).toBe(200);

        // Hook (postinstall)
        parseLine('pnpm', '{"name":"pnpm:hook","hook":"postinstall","pkg":{"name":"esbuild-linux-64","version":"0.14.0"},"duration":300}', metrics);
        expect(metrics.cpuTime).toBe(300);
        expect(metrics.packages['esbuild-linux-64']).toBeDefined();
        expect(metrics.packages['esbuild-linux-64'].scriptDuration).toBe(300);
    });
});
