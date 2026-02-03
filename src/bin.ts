#!/usr/bin/env node
import { run } from './cli/index.js';
import { Effect } from 'effect';

// Run the main effect
Effect.runPromise(run).catch((error) => {
    console.error('Fatal Error:', error);
    process.exit(1);
});
