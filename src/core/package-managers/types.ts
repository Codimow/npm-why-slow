export type PackageManagerType = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface PackageManager {
    type: PackageManagerType;
    command: string;
    lockfile: string;
    args: string[];
}
