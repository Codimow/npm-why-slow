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
        try {
            const log = JSON.parse(line);

            // pnpm:stage - Overall stages
            // { name: 'pnpm:stage', stage: 'resolution_done', duration: 123 }
            if (log.name === 'pnpm:stage') {
                if (log.stage === 'resolution_done') {
                    metrics.stages.resolution = (metrics.stages.resolution || 0) + (log.duration || 0);
                }
                if (log.stage === 'importing_done') {
                    // "importing" in pnpm covers fetching + linking to virtual store
                    metrics.stages.fetch = (metrics.stages.fetch || 0) + (log.duration || 0);
                    // We can attribute this to IO/Network broadly if granular 'fetching' events aren't captured
                }
            }

            // pnpm:fetching - Individual package download
            // { name: 'pnpm:fetching', status: 'done', pkg: { name, version }, duration: 123 }
            if (log.name === 'pnpm:fetching' && log.status === 'done' && log.duration) {
                const pkgName = log.pkg?.name || log.pkgId;
                const duration = log.duration;

                metrics.networkTime += duration;

                if (pkgName) {
                    if (!metrics.packages[pkgName]) {
                        metrics.packages[pkgName] = { name: pkgName, totalDuration: 0 };
                    }
                    metrics.packages[pkgName].downloadDuration = (metrics.packages[pkgName].downloadDuration || 0) + duration;
                    metrics.packages[pkgName].totalDuration += duration;
                }
            }

            // pnpm:hook - Lifecycle scripts (postinstall, etc)
            // { name: 'pnpm:hook', hook: 'postinstall', pkg: { name }, duration: 123 }
            if (log.name === 'pnpm:hook' && (log.hook === 'postinstall' || log.hook === 'install')) {
                const pkgName = log.pkg?.name;
                const duration = log.duration || 0;

                metrics.cpuTime += duration;
                metrics.scriptDuration = (metrics.scriptDuration || 0) + duration;

                if (pkgName) {
                    if (!metrics.packages[pkgName]) {
                        metrics.packages[pkgName] = { name: pkgName, totalDuration: 0 };
                    }
                    metrics.packages[pkgName].scriptDuration = (metrics.packages[pkgName].scriptDuration || 0) + duration;
                    metrics.packages[pkgName].totalDuration += duration;
                }
            }

        } catch (e) {
            // Fallback for non-JSON lines (e.g. raw stdout from scripts)
            const progressMatch = line.match(/downloaded (\d+)/);
            if (progressMatch) {
                // heuristic fallback if needed
            }
        }
    }
};
