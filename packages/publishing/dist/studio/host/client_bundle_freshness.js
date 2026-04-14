import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const lastBuiltFingerprints = new Map();
class DefaultStudioHostClientFreshnessController {
    constructor(enabled, outputPath, build, watchRoots, lastBuiltFingerprint) {
        this.enabled = enabled;
        this.outputPath = outputPath;
        this.build = build;
        this.watchRoots = watchRoots;
        this.lastBuiltFingerprint = lastBuiltFingerprint;
        this.inFlightRefresh = null;
    }
    ensureFresh() {
        if (!this.enabled) {
            return Promise.resolve(successResult(undefined));
        }
        if (this.inFlightRefresh) {
            return this.inFlightRefresh;
        }
        this.inFlightRefresh = this.refreshIfNeeded().finally(() => {
            this.inFlightRefresh = null;
        });
        return this.inFlightRefresh;
    }
    async refreshIfNeeded() {
        const fingerprint = await computeStudioHostClientFingerprint(this.watchRoots);
        if (!fingerprint.success) {
            return fingerprint;
        }
        const outputArtifact = await inspectStudioHostClientOutput(this.outputPath);
        if (!outputArtifact.success) {
            return outputArtifact;
        }
        if (this.lastBuiltFingerprint !== null &&
            fingerprint.value <= this.lastBuiltFingerprint &&
            outputArtifact.value) {
            return successResult(undefined);
        }
        const rebuilt = await this.buildFingerprint(fingerprint.value);
        if (!rebuilt.success) {
            return rebuilt;
        }
        this.lastBuiltFingerprint = fingerprint.value;
        return successResult(undefined);
    }
    async buildFingerprint(fingerprint) {
        let built;
        try {
            built = await this.build(this.outputPath);
        }
        catch (error) {
            return failureResult({
                tag: "unsupported",
                reason: `Failed to rebuild studio host client bundle '${this.outputPath}': ${formatUnknownError(error)}`,
                path: this.outputPath,
            });
        }
        if (!built.success) {
            return built;
        }
        this.lastBuiltFingerprint = fingerprint;
        return successResult(undefined);
    }
}
export async function createStudioHostClientFreshnessController(options) {
    const entrypoint = options.entrypoint ?? resolveStudioHostClientEntrypoint();
    const env = options.env ?? process.env;
    const enabled = env.NODE_ENV !== "production";
    const watchLayout = resolveStudioHostClientWatchLayout(entrypoint);
    const build = options.build ??
        ((outputPath) => buildStudioHostClient(outputPath, entrypoint));
    let lastBuiltFingerprint = null;
    if (enabled) {
        const cachedFingerprint = lastBuiltFingerprints.get(options.outputPath);
        if (cachedFingerprint !== undefined) {
            lastBuiltFingerprint = cachedFingerprint;
        }
        else {
            const fingerprint = await computeStudioHostClientFingerprint(watchLayout.watchRoots);
            if (!fingerprint.success) {
                return fingerprint;
            }
            lastBuiltFingerprint = fingerprint.value;
        }
    }
    return successResult(new DefaultStudioHostClientFreshnessController(enabled, options.outputPath, build, watchLayout.watchRoots, lastBuiltFingerprint));
}
export async function buildStudioHostClient(outputPath, entrypoint = resolveStudioHostClientEntrypoint()) {
    const watchLayout = resolveStudioHostClientWatchLayout(entrypoint);
    const fingerprint = await computeStudioHostClientFingerprint(watchLayout.watchRoots);
    if (!fingerprint.success) {
        return fingerprint;
    }
    let build;
    try {
        await mkdir(dirname(outputPath), { recursive: true });
        build = await Bun.build({
            entrypoints: [entrypoint],
            outdir: dirname(outputPath),
            root: resolveStudioHostPackageRoot(entrypoint),
            naming: {
                entry: "studio.js",
            },
            target: "browser",
            format: "esm",
            sourcemap: "none",
            minify: true,
        });
    }
    catch (error) {
        return failureResult({
            tag: "unsupported",
            reason: `Failed to build studio host client bundle '${outputPath}': ${formatUnknownError(error)}`,
            path: outputPath,
        });
    }
    if (!build.success) {
        return failureResult({
            tag: "unsupported",
            reason: build.logs
                .map((log) => log.message)
                .join("\n"),
            path: outputPath,
        });
    }
    if (build.outputs.length === 0) {
        return failureResult({
            tag: "unsupported",
            reason: "Studio host build completed without a browser bundle output.",
            path: outputPath,
        });
    }
    lastBuiltFingerprints.set(outputPath, fingerprint.value);
    return successResult(outputPath);
}
export function resolveStudioHostClientEntrypoint() {
    const jsEntrypoint = fileURLToPath(new URL("./client.js", import.meta.url));
    if (existsSync(jsEntrypoint)) {
        return jsEntrypoint;
    }
    return fileURLToPath(new URL("./client.ts", import.meta.url));
}
function resolveStudioHostClientWatchLayout(entrypoint) {
    const packageRoot = resolveStudioHostPackageRoot(entrypoint);
    const watchBase = extname(entrypoint) === ".ts" ? "src" : "dist";
    return {
        watchRoots: [
            join(packageRoot, watchBase),
            join(packageRoot, "package.json"),
        ],
    };
}
function resolveStudioHostPackageRoot(entrypoint) {
    return resolve(dirname(entrypoint), "../../../");
}
async function computeStudioHostClientFingerprint(watchRoots) {
    let fingerprint = 0;
    for (const watchRoot of watchRoots) {
        const pathFingerprint = await computePathFingerprint(watchRoot);
        if (!pathFingerprint.success) {
            return pathFingerprint;
        }
        fingerprint = Math.max(fingerprint, pathFingerprint.value);
    }
    return successResult(fingerprint);
}
async function inspectStudioHostClientOutput(outputPath) {
    try {
        return successResult((await stat(outputPath)).isFile());
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            return successResult(false);
        }
        return failureResult({
            tag: "unsupported",
            reason: `Failed to inspect studio host client output '${outputPath}': ${formatUnknownError(error)}`,
            path: outputPath,
        });
    }
}
async function computePathFingerprint(path) {
    let pathStats;
    try {
        pathStats = await stat(path);
    }
    catch (error) {
        return failureResult({
            tag: "unsupported",
            reason: `Failed to inspect studio host freshness path '${path}': ${formatUnknownError(error)}`,
            path,
        });
    }
    if (pathStats.isFile()) {
        return successResult(pathStats.mtimeMs);
    }
    if (!pathStats.isDirectory()) {
        return successResult(pathStats.mtimeMs);
    }
    let fingerprint = pathStats.mtimeMs;
    let entries;
    try {
        entries = await readdir(path, { withFileTypes: true });
    }
    catch (error) {
        return failureResult({
            tag: "unsupported",
            reason: `Failed to read studio host freshness directory '${path}': ${formatUnknownError(error)}`,
            path,
        });
    }
    for (const entry of entries) {
        const childPath = join(path, entry.name);
        const childFingerprint = await computePathFingerprint(childPath);
        if (!childFingerprint.success) {
            return childFingerprint;
        }
        fingerprint = Math.max(fingerprint, childFingerprint.value);
    }
    return successResult(fingerprint);
}
function successResult(value) {
    return {
        success: true,
        value,
    };
}
function failureResult(error) {
    return {
        success: false,
        error,
    };
}
function formatUnknownError(error) {
    return error instanceof Error ? error.message : String(error);
}
