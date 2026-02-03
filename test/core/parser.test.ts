import { describe, it, expect } from 'vitest';
import { parseLine } from '../../src/core/analyzer/parser.js';
import { createEmptyMetrics } from '../../src/core/metrics/index.js';

describe('Parser', () => {
    it('should parse npm network timing', () => {
        const metrics = createEmptyMetrics('npm');
        const line = 'npm http fetch GET 200 https://registry.npmjs.org/pkg 123ms';
        parseLine('npm', line, metrics);
        expect(metrics.networkTime).toBe(123);
    });

    it('should parse npm extraction timing', () => {
        const metrics = createEmptyMetrics('npm');
        const line = 'npm timing action:extract Completed in 14ms';
        parseLine('npm', line, metrics);
        expect(metrics.ioTime).toBe(14);
    });

    it('should ignore irrelevant lines', () => {
        const metrics = createEmptyMetrics('npm');
        parseLine('npm', 'npm info using npm@11.7.0', metrics);
        expect(metrics.networkTime).toBe(0);
        expect(metrics.ioTime).toBe(0);
    });
});
