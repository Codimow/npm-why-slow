import React, { useState, useEffect } from 'react';
import { render, Text, Box, Static } from 'ink';
import type { InstallMetrics, PackageMetric } from '../core/metrics/index.js';

interface AppProps {
    metricsRef: { current: InstallMetrics };
    linesRef: { current: string[] };
    isRunning: boolean;
}

const ProgressBar: React.FC<{ percent: number; width?: number }> = ({ percent, width = 40 }) => {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return (
        <Text>
            <Text color="green">{'█'.repeat(filled)}</Text>
            <Text color="gray">{'░'.repeat(empty)}</Text>
            <Text> {percent.toFixed(0)}%</Text>
        </Text>
    );
};

const getTopSlowest = (packages: Record<string, PackageMetric>, n = 5): PackageMetric[] => {
    return Object.values(packages)
        .sort((a, b) => b.totalDuration - a.totalDuration)
        .slice(0, n);
};

export const App: React.FC<AppProps> = ({ metricsRef, linesRef, isRunning }) => {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => forceUpdate(n => n + 1), 100);
        return () => clearInterval(interval);
    }, [isRunning]);

    const metrics = metricsRef.current;
    const lines = linesRef.current;
    const slowest = getTopSlowest(metrics.packages);

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text bold color="cyan">📦 npm-why-slow</Text>
            </Box>

            {isRunning && (
                <Box marginBottom={1}>
                    <Text>Installing... </Text>
                    <ProgressBar percent={Math.min(100, (lines.length / 50) * 100)} />
                </Box>
            )}

            <Static items={lines.slice(-10)}>
                {(line, i) => (
                    <Text key={i} dimColor>{line.slice(0, 80)}</Text>
                )}
            </Static>

            {!isRunning && (
                <Box flexDirection="column" marginTop={1}>
                    <Text bold>📊 Results</Text>
                    <Text>Total: <Text color="green">{(metrics.totalTime / 1000).toFixed(2)}s</Text></Text>
                    <Text>Network: <Text color="blue">{(metrics.networkTime / 1000).toFixed(2)}s</Text></Text>
                    <Text>I/O: <Text color="yellow">{(metrics.ioTime / 1000).toFixed(2)}s</Text></Text>

                    {slowest.length > 0 && (
                        <Box flexDirection="column" marginTop={1}>
                            <Text bold color="red">🐢 Slowest Packages:</Text>
                            {slowest.map((pkg, i) => (
                                <Text key={i}>
                                    {i + 1}. <Text color="white">{pkg.name}</Text> - {pkg.totalDuration}ms
                                </Text>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export const renderTUI = (
    metricsRef: { current: InstallMetrics },
    linesRef: { current: string[] },
    isRunningRef: { current: boolean }
) => {
    const { rerender, unmount, waitUntilExit } = render(
        <App metricsRef={metricsRef} linesRef={linesRef} isRunning={isRunningRef.current} />
    );

    const update = () => {
        rerender(<App metricsRef={metricsRef} linesRef={linesRef} isRunning={isRunningRef.current} />);
    };

    return { update, unmount, waitUntilExit };
};
