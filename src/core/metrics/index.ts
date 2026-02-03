export interface PackageMetric {
    name: string;
    version?: string;
    downloadDuration?: number; // ms
    extractDuration?: number; // ms
    scriptDuration?: number; // ms
    totalDuration: number;
}

export interface InstallMetrics {
    timestamp: number;
    packageManager: string;
    totalTime: number;
    networkTime: number;
    ioTime: number;
    cpuTime: number;
    scriptDuration?: number;
    packages: Record<string, PackageMetric>;
    stages: {
        resolution?: number;
        fetch?: number;
        link?: number;
    };
}

export const createEmptyMetrics = (pm: string): InstallMetrics => ({
    timestamp: Date.now(),
    packageManager: pm,
    totalTime: 0,
    networkTime: 0,
    ioTime: 0,
    cpuTime: 0,
    packages: {},
    stages: {}
});
