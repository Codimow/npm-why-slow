import { InstallMetrics } from '../metrics/index.js';

export const parseLine = (pmType: string, line: string, metrics: InstallMetrics) => {
    if (pmType === 'npm') {
        // npm http fetch GET 200 https://registry.npmjs.org/lodash 123ms
        const fetchMatch = line.match(/npm http fetch \w+ \d+ (https?:\/\/[^\s]+\/([^\/\s]+))\s+(\d+)ms/);
        if (fetchMatch) {
            const pkgName = fetchMatch[2].replace(/%2f/gi, '/'); // Handle scoped packages
            const duration = parseInt(fetchMatch[3], 10);
            metrics.networkTime += duration;

            if (!metrics.packages[pkgName]) {
                metrics.packages[pkgName] = { name: pkgName, totalDuration: 0 };
            }
            metrics.packages[pkgName].downloadDuration = (metrics.packages[pkgName].downloadDuration || 0) + duration;
            metrics.packages[pkgName].totalDuration += duration;
        }

        // npm timing reify:loadBundles Completed in 14ms
        // npm timing action:extract Completed in 14ms
        if (line.includes('timing') && line.includes('extract')) {
            const match = line.match(/Completed in (\d+)ms/);
            if (match) {
                metrics.ioTime += parseInt(match[1], 10);
            }
        }

        // npm timing action:run-script:postinstall:pkg-name Completed in 200ms
        const scriptMatch = line.match(/timing (?:action|stage):run-script(?::postinstall)?:([^\s]+)\s+Completed in (\d+)ms/);
        if (scriptMatch) {
            const pkgName = scriptMatch[1];
            const duration = parseInt(scriptMatch[2], 10);
            metrics.cpuTime += duration;
            metrics.scriptDuration = (metrics.scriptDuration || 0) + duration;

            if (!metrics.packages[pkgName]) {
                metrics.packages[pkgName] = { name: pkgName, totalDuration: 0 };
            }
            metrics.packages[pkgName].scriptDuration = (metrics.packages[pkgName].scriptDuration || 0) + duration;
            metrics.packages[pkgName].totalDuration += duration;
        }

        // Fallback: generic timing for run-script without package name
        if ((line.includes('timing action:run-script') || line.includes('timing stage:run-script') || line.includes('timing action:postinstall')) && !scriptMatch) {
            const match = line.match(/Completed in (\d+)ms/);
            if (match) {
                metrics.cpuTime += parseInt(match[1], 10);
                metrics.scriptDuration = (metrics.scriptDuration || 0) + parseInt(match[1], 10);
            }
        }
    }

    // pnpm support: pnpm verbose logs are different
    if (pmType === 'pnpm') {
        // pnpm: Progress: resolved X, reused Y, downloaded Z, added W
        const progressMatch = line.match(/downloaded (\d+)/);
        if (progressMatch) {
            // Track download count, timing is harder with pnpm
        }
    }
};
