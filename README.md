# npm-why-slow

> 🔍 Diagnose slow npm/pnpm/yarn installations

A CLI tool that instruments your package manager to identify installation bottlenecks. Find out if your slow installs are caused by network latency, disk I/O, or postinstall scripts.

## Installation

```bash
npm i @codimow/npm-why-slow
```

## Usage

```bash
# Analyze your next install
npm-why-slow install

# Pass flags to the underlying package manager
npm-why-slow install -- --dry-run

# View help
npm-why-slow --help
```

## Example Output

```
🔍 Detecting package manager...
✓ Detected: npm
🚀 Running npm install...

📊 Analysis Report
-------------------
Package Manager: npm
Total Time:      12.34s
Network Time:    8.21s
IO/Extract Time: 2.45s

! High network usage detected. Check your connection or registry proxy.
```

## Features

- **Auto-detection** of npm, pnpm, yarn, or bun
- **Timing breakdown** for network, extraction, and script phases
- **Actionable warnings** when bottlenecks are detected
- **Effect-TS** powered for robust async handling

## How It Works

1. Detects your package manager from lockfiles
2. Runs install with verbose logging enabled
3. Parses output in real-time to extract timing data
4. Generates a summary report with actionable insights

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run locally
node dist/bin.js install
```

## Tech Stack

- TypeScript 5.x with strict mode
- Effect-TS for functional programming
- Commander.js for CLI
- Vitest for testing
- tsup for bundling

## License

ISC
