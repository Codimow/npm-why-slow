import { InstallMetrics } from '../metrics/index.js';

export const parseLine = (pmType: string, line: string, metrics: InstallMetrics) => {
    // Simple heuristic parsing for npm verbose logs
    if (pmType === 'npm') {
        // npm http fetch GET 200 https://registry.npmjs.org/pkg 123ms
        if (line.includes('npm http fetch')) {
            const match = line.match(/(\d+)ms/);
            if (match) {
                metrics.networkTime += parseInt(match[1], 10);
            }
        }

        // npm timing action:extract Completed in 14ms
        if (line.includes('timing action:extract')) {
            const match = line.match(/Completed in (\d+)ms/);
            if (match) {
                metrics.ioTime += parseInt(match[1], 10);
            }
        }

        // npm timing action:run-script Completed in 200ms
        // npm timing stage:run-script Completed in 200ms
        // Note: npm logs vary by version, covering common patterns
        if (line.includes('timing action:run-script') || line.includes('timing stage:run-script') || line.includes('timing action:postinstall')) {
            const match = line.match(/Completed in (\d+)ms/);
            if (match) {
                metrics.cpuTime += parseInt(match[1], 10);
                metrics.scriptDuration = (metrics.scriptDuration || 0) + parseInt(match[1], 10);
            }
        }
    }
};
