import { Effect, Console } from 'effect';
import { spawn } from 'node:child_process';

interface RegistryResult {
    name: string;
    url: string;
    latency: number | null; // ms, null if failed
    isCurrent: boolean;
}

const REGISTRIES = [
    { name: 'npm', url: 'https://registry.npmjs.org' },
    { name: 'yarn', url: 'https://registry.yarnpkg.com' },
    { name: 'taobao', url: 'https://registry.npmmirror.com' },
];

const getCurrentRegistry = Effect.async<string, Error>((resume) => {
    const child = spawn('npm', ['config', 'get', 'registry'], { shell: true });
    let output = '';
    child.stdout.on('data', (d) => output += d.toString());
    child.on('close', (code) => {
        if (code === 0) resume(Effect.succeed(output.trim()));
        else resume(Effect.fail(new Error(`Failed to get registry: code ${code}`)));
    });
    child.on('error', (err) => resume(Effect.fail(err)));
});

const measureLatency = (url: string) => Effect.tryPromise({
    try: async () => {
        const start = Date.now();
        // Check a tiny package metadata for realistic response time, or just root
        // Root is safer/lighter usually, but some mirrors redirect.
        // Let's use a simple HEAD request to root or favicon if possible, but fetch is easy.
        try {
            await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        } catch {
            // fallback to GET if HEAD fails (some proxies block HEAD)
            await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
        }
        return Date.now() - start;
    },
    catch: () => null // Return null on failure
});

export const benchmarkRegistries = Effect.gen(function* (_) {
    yield* Console.log('🔍 Detecting current registry...');
    const currentUrl = yield* getCurrentRegistry;
    yield* Console.log(`   Current: ${currentUrl}\n`);

    yield* Console.log('⏱️  Benchmarking registries (3 samples each)...');

    const results: RegistryResult[] = [];

    // Ensure current registry is in the list
    const targetRegistries = [...REGISTRIES];
    if (!REGISTRIES.some(r => currentUrl.includes(r.url.replace('https://', '')))) {
        targetRegistries.push({ name: 'current', url: currentUrl });
    }

    for (const reg of targetRegistries) {
        process.stdout.write(`   Testing ${reg.name} (${reg.url})... `);

        let sum = 0;
        let successfulSamples = 0;

        for (let i = 0; i < 3; i++) {
            const lat = yield* measureLatency(reg.url);
            if (lat !== null) {
                sum += lat;
                successfulSamples++;
            }
            yield* Effect.sleep(200); // small delay
        }

        const avg = successfulSamples > 0 ? Math.round(sum / successfulSamples) : null;
        results.push({
            name: reg.name,
            url: reg.url,
            latency: avg,
            isCurrent: currentUrl.includes(reg.url) || (reg.url === currentUrl)
        });

        console.log(avg !== null ? `${avg}ms` : 'Failed');
    }

    // Sort by latency
    results.sort((a, b) => {
        if (a.latency === null) return 1;
        if (b.latency === null) return -1;
        return a.latency - b.latency;
    });

    yield* Console.log('\n📊 Results:');
    results.forEach((r, i) => {
        const prefix = r.isCurrent ? '👉' : '  ';
        const latencyStr = r.latency !== null ? `${r.latency}ms` : 'Timed out';
        const color = i === 0 ? '\x1b[32m' : (r.latency && r.latency > 500 ? '\x1b[31m' : '\x1b[0m'); // Green if fastest, Red if slow
        console.log(`${prefix} ${i + 1}. ${color}${r.name.padEnd(10)} ${latencyStr.padEnd(10)} ${r.url}\x1b[0m`);
    });

    const fastest = results[0];
    const current = results.find(r => r.isCurrent);

    if (fastest && current && !fastest.isCurrent && fastest.latency !== null && current.latency !== null) {
        if (current.latency - fastest.latency > 100) {
            yield* Console.log(`\n💡 Recommendation: Switch to ${fastest.name} to save ~${current.latency - fastest.latency}ms per request.`);
            yield* Console.log(`   Command: npm config set registry ${fastest.url}`);
        }
    }
});
