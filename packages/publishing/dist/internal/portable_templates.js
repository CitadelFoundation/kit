import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync, } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { SUPPORTED_PUBLISHING_DEPLOY_PRESETS } from "../types/starter-catalog.js";
const PACKAGE_ROOT = resolve(import.meta.dir, "..", "..");
const TEMPLATE_ROOT = join(PACKAGE_ROOT, "templates");
const TEXT_EXTENSIONS = new Set([
    ".astro",
    ".cjs",
    ".css",
    ".gitignore",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mdx",
    ".mjs",
    ".npmrc",
    ".svg",
    ".toml",
    ".ts",
    ".txt",
    ".yaml",
    ".yml",
]);
const FORBIDDEN_WORKSPACE_DIRECTORIES = [
    ".astro",
    "dist",
    "node_modules",
];
const IGNORED_COPY_ENTRIES = new Set([".git", ".DS_Store"]);
const KIT_SCOPE_PREFIX = "@citadelfoundation/kit-";
const INTERNAL_TEMPLATE_DEP_PREFIX = `${KIT_SCOPE_PREFIX}template-`;
const LEGACY_STARTER_DEP_PREFIX = `${KIT_SCOPE_PREFIX}publishing-starter-`;
const SUPPORTED_DEPLOY_PRESET_SET = new Set(SUPPORTED_PUBLISHING_DEPLOY_PRESETS);
function isTextFile(path) {
    return (TEXT_EXTENSIONS.has(path.slice(path.lastIndexOf("."))) ||
        basename(path).startsWith("."));
}
function isPathWithinRoot(root, path) {
    const resolvedRoot = resolve(root);
    const resolvedPath = resolve(path);
    return (resolvedPath === resolvedRoot ||
        resolvedPath.startsWith(`${resolvedRoot}${sep}`));
}
function resolveContainedPath(root, relativePath, label) {
    const resolvedRoot = resolve(root);
    const resolvedPath = resolve(resolvedRoot, relativePath);
    if (!isPathWithinRoot(resolvedRoot, resolvedPath)) {
        throw new Error(`${label} must stay within ${resolvedRoot}: ${relativePath}`);
    }
    return resolvedPath;
}
function assertRealPathWithinRoot(root, path, label) {
    const resolvedRoot = realpathSync(root);
    const resolvedPath = realpathSync(path);
    if (!isPathWithinRoot(resolvedRoot, resolvedPath)) {
        throw new Error(`${label} must stay within ${resolvedRoot}: ${path}`);
    }
    return resolvedPath;
}
function normalizeRelativePath(path) {
    return path.replaceAll("\\", "/");
}
function isAllowedNestedRootMetadataPath(relativePath, screenshotPath) {
    const normalizedRelativePath = normalizeRelativePath(relativePath);
    const normalizedScreenshotPath = normalizeRelativePath(screenshotPath);
    return (normalizedRelativePath === "kit-publishing.template.json" ||
        normalizedRelativePath === normalizedScreenshotPath ||
        normalizedScreenshotPath.startsWith(`${normalizedRelativePath}/`));
}
function validateNestedWorkspaceWrapper(root, screenshotPath) {
    const visit = (currentRoot, relativeRoot = "") => {
        for (const entry of readdirSync(currentRoot).sort()) {
            if (IGNORED_COPY_ENTRIES.has(entry)) {
                continue;
            }
            const relativePath = relativeRoot ? join(relativeRoot, entry) : entry;
            if (relativePath === "workspace") {
                continue;
            }
            if (!isAllowedNestedRootMetadataPath(relativePath, screenshotPath)) {
                throw new Error(`Nested portable template roots may only contain workspace/, kit-publishing.template.json, and the screenshot path: ${join(root, relativePath)}`);
            }
            const sourcePath = join(root, relativePath);
            if (statSync(sourcePath).isDirectory()) {
                visit(sourcePath, relativePath);
            }
        }
    };
    visit(root);
}
function assertNoSymlinks(root) {
    const visit = (currentRoot) => {
        for (const entry of readdirSync(currentRoot).sort()) {
            if (IGNORED_COPY_ENTRIES.has(entry)) {
                continue;
            }
            const sourcePath = join(currentRoot, entry);
            const linkState = lstatSync(sourcePath);
            if (linkState.isSymbolicLink()) {
                throw new Error(`Portable templates must not contain symlinks: ${sourcePath}`);
            }
            if (linkState.isDirectory()) {
                visit(sourcePath);
            }
        }
    };
    visit(root);
}
function inferSiteTitle(projectName) {
    return projectName
        .replace(/[-_]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
}
export { inferSiteTitle };
export function readPublishingPackageVersion() {
    const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"));
    return manifest.version;
}
function readTemplateManifest(root) {
    const manifestPath = join(root, "kit-publishing.template.json");
    if (!existsSync(manifestPath)) {
        throw new Error(`Missing kit-publishing.template.json in ${root}`);
    }
    if (lstatSync(manifestPath).isSymbolicLink()) {
        throw new Error(`Portable template manifest must not be a symlink: ${manifestPath}`);
    }
    const rawManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!rawManifest.id ||
        !rawManifest.label ||
        !rawManifest.summary ||
        !rawManifest.audience ||
        !rawManifest.screenshot ||
        !rawManifest.kitPublishingVersion ||
        !Array.isArray(rawManifest.supportedDeployPresets)) {
        throw new Error(`Invalid portable template manifest in ${manifestPath}`);
    }
    const supportedDeployPresets = rawManifest.supportedDeployPresets;
    const seenDeployPresets = new Set();
    for (const preset of supportedDeployPresets) {
        if (!SUPPORTED_DEPLOY_PRESET_SET.has(preset)) {
            throw new Error(`Unsupported deploy preset \"${preset}\" in ${manifestPath}`);
        }
        if (seenDeployPresets.has(preset)) {
            throw new Error(`Duplicate deploy preset \"${preset}\" in ${manifestPath}`);
        }
        seenDeployPresets.add(preset);
    }
    if (!seenDeployPresets.has("none")) {
        throw new Error(`Portable template manifest must include deploy preset \"none\" in ${manifestPath}`);
    }
    return {
        id: rawManifest.id,
        label: rawManifest.label,
        summary: rawManifest.summary,
        audience: rawManifest.audience,
        screenshot: rawManifest.screenshot,
        supportedDeployPresets,
        kitPublishingVersion: rawManifest.kitPublishingVersion,
    };
}
function validateWorkspacePackage(workspaceRoot) {
    const manifestPath = join(workspaceRoot, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!manifest.scripts?.build || !manifest.scripts?.check) {
        throw new Error(`Portable template workspace is missing build/check scripts in ${manifestPath}`);
    }
    if (!manifest.scripts?.dev || !manifest.scripts?.["studio:dev"]) {
        throw new Error(`Portable template workspace is missing dev/studio:dev scripts in ${manifestPath}`);
    }
    if (!manifest.dependencies?.["@citadelfoundation/kit-publishing"]) {
        throw new Error(`Portable template workspace must depend on @citadelfoundation/kit-publishing in ${manifestPath}`);
    }
    if (!manifest.dependencies?.astro) {
        throw new Error(`Portable template workspace must depend on astro in ${manifestPath}`);
    }
    const dependencySections = [
        manifest.dependencies ?? {},
        manifest.devDependencies ?? {},
    ];
    for (const section of dependencySections) {
        for (const [name, version] of Object.entries(section)) {
            if (version.startsWith("workspace:") || version.startsWith("file:")) {
                throw new Error(`Portable template workspace contains unsupported dependency ref ${name}=${version}`);
            }
            if (name.startsWith(INTERNAL_TEMPLATE_DEP_PREFIX) ||
                name.startsWith(LEGACY_STARTER_DEP_PREFIX)) {
                throw new Error(`Portable template workspace contains unsupported dependency ${name}`);
            }
        }
    }
}
function resolveWorkspaceRoot(root) {
    const direct = existsSync(join(root, "package.json")) &&
        existsSync(join(root, "publication.config.ts"));
    if (direct) {
        return root;
    }
    const nestedRoot = join(root, "workspace");
    if (existsSync(nestedRoot) && lstatSync(nestedRoot).isSymbolicLink()) {
        throw new Error(`Portable template workspace root must not be a symlink: ${nestedRoot}`);
    }
    const nested = existsSync(join(nestedRoot, "package.json")) &&
        existsSync(join(nestedRoot, "publication.config.ts"));
    if (nested) {
        if (!isPathWithinRoot(realpathSync(root), realpathSync(nestedRoot))) {
            throw new Error(`Portable template workspace root must stay within the template root: ${nestedRoot}`);
        }
        return nestedRoot;
    }
    throw new Error(`Portable template source must contain package.json and publication.config.ts, or a workspace/ subdirectory that does: ${root}`);
}
function validateResolvedTemplate(root, packageVersion, cleanup) {
    const manifest = readTemplateManifest(root);
    const workspaceRoot = resolveWorkspaceRoot(root);
    const screenshotPath = resolveContainedPath(root, manifest.screenshot, "Portable template screenshot path");
    if (manifest.kitPublishingVersion !== packageVersion &&
        manifest.kitPublishingVersion !== "*") {
        throw new Error(`Portable template ${manifest.id} targets kit-publishing ${manifest.kitPublishingVersion}, expected ${packageVersion}`);
    }
    if (!existsSync(screenshotPath)) {
        throw new Error(`Portable template screenshot path is missing: ${screenshotPath}`);
    }
    if (lstatSync(screenshotPath).isSymbolicLink()) {
        throw new Error(`Portable template screenshot must not be a symlink: ${screenshotPath}`);
    }
    const realScreenshotPath = assertRealPathWithinRoot(root, screenshotPath, "Portable template screenshot path");
    if (root !== workspaceRoot &&
        isPathWithinRoot(realpathSync(workspaceRoot), realScreenshotPath)) {
        throw new Error(`Portable template screenshot path must stay outside workspace/ for nested workspace layouts: ${manifest.screenshot}`);
    }
    if (!statSync(screenshotPath).isFile()) {
        throw new Error(`Portable template screenshot path must point to a file: ${screenshotPath}`);
    }
    if (root !== workspaceRoot) {
        validateNestedWorkspaceWrapper(root, manifest.screenshot);
        for (const reservedPath of [
            "kit-publishing.template.json",
            manifest.screenshot,
        ]) {
            const workspaceCollisionPath = join(workspaceRoot, reservedPath);
            if (existsSync(workspaceCollisionPath)) {
                throw new Error(`Nested portable template workspace must not redefine reserved root metadata path: ${workspaceCollisionPath}`);
            }
        }
    }
    const requiredFiles = [
        "astro.config.mjs",
        "package.json",
        "publication.config.ts",
        "tsconfig.json",
    ];
    for (const file of requiredFiles) {
        if (!existsSync(join(workspaceRoot, file))) {
            throw new Error(`Portable template workspace is missing ${file}: ${workspaceRoot}`);
        }
    }
    if (!existsSync(join(workspaceRoot, "src"))) {
        throw new Error(`Portable template workspace is missing src/: ${workspaceRoot}`);
    }
    for (const directoryName of FORBIDDEN_WORKSPACE_DIRECTORIES) {
        if (existsSync(join(workspaceRoot, directoryName))) {
            throw new Error(`Portable template workspace must not include ${directoryName}/: ${workspaceRoot}`);
        }
    }
    assertNoSymlinks(root);
    validateWorkspacePackage(workspaceRoot);
    return { root, workspaceRoot, manifest, cleanup };
}
export function resolveBuiltInTemplate(templateId, packageVersion) {
    const resolved = validateResolvedTemplate(join(TEMPLATE_ROOT, templateId), packageVersion);
    if (resolved.manifest.id !== templateId) {
        throw new Error(`Built-in template manifest id mismatch: expected \"${templateId}\", received \"${resolved.manifest.id}\"`);
    }
    return resolved;
}
function looksLikeGitSource(source) {
    return (source.startsWith("file://") ||
        source.startsWith("git@") ||
        source.startsWith("git://") ||
        source.startsWith("http://") ||
        source.startsWith("https://") ||
        source.endsWith(".git"));
}
function unpackNpmTemplateSource(source) {
    const tempRoot = mkdtempSync(join(tmpdir(), "kit-publishing-template-npm-"));
    const spec = source.slice("npm:".length);
    const pack = spawnSync("npm", ["pack", spec, "--json"], {
        cwd: tempRoot,
        encoding: "utf8",
    });
    if ((pack.status ?? 1) !== 0) {
        rmSync(tempRoot, { force: true, recursive: true });
        throw new Error(pack.stderr?.trim() || `npm pack failed for ${spec}`);
    }
    const [result] = JSON.parse(pack.stdout || "[]");
    const tarballPath = join(tempRoot, result.filename);
    const untar = spawnSync("tar", ["-xzf", tarballPath], {
        cwd: tempRoot,
        encoding: "utf8",
    });
    if ((untar.status ?? 1) !== 0) {
        rmSync(tempRoot, { force: true, recursive: true });
        throw new Error(untar.stderr?.trim() || `tar extraction failed for ${tarballPath}`);
    }
    return {
        root: join(tempRoot, "package"),
        cleanup: () => rmSync(tempRoot, { force: true, recursive: true }),
    };
}
function cloneGitTemplateSource(source) {
    const tempRoot = mkdtempSync(join(tmpdir(), "kit-publishing-template-git-"));
    const cloneRoot = join(tempRoot, "repo");
    const clone = spawnSync("git", ["clone", "--depth", "1", source, cloneRoot], {
        encoding: "utf8",
    });
    if ((clone.status ?? 1) !== 0) {
        rmSync(tempRoot, { force: true, recursive: true });
        throw new Error(clone.stderr?.trim() || `git clone failed for ${source}`);
    }
    return {
        root: cloneRoot,
        cleanup: () => rmSync(tempRoot, { force: true, recursive: true }),
    };
}
export function resolveImportedTemplate(source, packageVersion, subdir) {
    const resolveSubdir = (root) => subdir
        ? (() => {
            const resolvedSubdir = resolveContainedPath(root, subdir, "Portable template --subdir");
            if (existsSync(resolvedSubdir)) {
                assertRealPathWithinRoot(root, resolvedSubdir, "Portable template --subdir");
            }
            return resolvedSubdir;
        })()
        : root;
    if (source.startsWith("npm:")) {
        const resolved = unpackNpmTemplateSource(source);
        try {
            return validateResolvedTemplate(resolveSubdir(resolved.root), packageVersion, resolved.cleanup);
        }
        catch (error) {
            resolved.cleanup();
            throw error;
        }
    }
    if (looksLikeGitSource(source)) {
        const resolved = cloneGitTemplateSource(source);
        try {
            return validateResolvedTemplate(resolveSubdir(resolved.root), packageVersion, resolved.cleanup);
        }
        catch (error) {
            resolved.cleanup();
            throw error;
        }
    }
    if (existsSync(source) || existsSync(resolve(source))) {
        const root = existsSync(source) ? source : resolve(source);
        return validateResolvedTemplate(resolveSubdir(root), packageVersion);
    }
    throw new Error(`Unsupported template source: ${source}`);
}
function interpolateText(content, projectName, siteTitle, packageVersion) {
    return content
        .replaceAll("{{projectName}}", projectName)
        .replaceAll("{{siteTitle}}", siteTitle)
        .replaceAll("<inferred-by-cli>", projectName)
        .replaceAll("<kit-publishing-version>", packageVersion);
}
function copyTemplateFile(sourcePath, targetPath, projectName, siteTitle, packageVersion) {
    mkdirSync(dirname(targetPath), { recursive: true });
    if (isTextFile(sourcePath)) {
        const source = readFileSync(sourcePath, "utf8");
        writeFileSync(targetPath, interpolateText(source, projectName, siteTitle, packageVersion), "utf8");
        return;
    }
    copyFileSync(sourcePath, targetPath);
}
function copyDirectory(sourceRoot, targetRoot, projectName, siteTitle, packageVersion) {
    let copied = 0;
    for (const entry of readdirSync(sourceRoot).sort()) {
        if (IGNORED_COPY_ENTRIES.has(entry)) {
            continue;
        }
        const sourcePath = join(sourceRoot, entry);
        const targetPath = join(targetRoot, entry);
        const linkState = lstatSync(sourcePath);
        if (linkState.isSymbolicLink()) {
            throw new Error(`Portable templates must not contain symlinks: ${sourcePath}`);
        }
        const stat = statSync(sourcePath);
        if (stat.isDirectory()) {
            mkdirSync(targetPath, { recursive: true });
            copied += copyDirectory(sourcePath, targetPath, projectName, siteTitle, packageVersion);
            continue;
        }
        copyTemplateFile(sourcePath, targetPath, projectName, siteTitle, packageVersion);
        copied += 1;
    }
    return copied;
}
function copyTemplateRootMetadata(source, targetRoot, projectName, siteTitle, packageVersion) {
    if (source.root === source.workspaceRoot) {
        return 0;
    }
    const relativePaths = new Set([
        "kit-publishing.template.json",
        source.manifest.screenshot,
    ]);
    let copied = 0;
    for (const relativePath of relativePaths) {
        const sourcePath = resolveContainedPath(source.root, relativePath, "Portable template root asset path");
        if (!existsSync(sourcePath)) {
            throw new Error(`Portable template root asset is missing: ${sourcePath}`);
        }
        const assetLinkState = lstatSync(sourcePath);
        if (assetLinkState.isSymbolicLink()) {
            throw new Error(`Portable template root asset must not be a symlink: ${sourcePath}`);
        }
        if (statSync(sourcePath).isDirectory()) {
            throw new Error(`Portable template root asset must be a file: ${sourcePath}`);
        }
        assertRealPathWithinRoot(source.root, sourcePath, "Portable template root asset path");
        copyTemplateFile(sourcePath, resolveContainedPath(targetRoot, relativePath, "Portable template target asset path"), projectName, siteTitle, packageVersion);
        copied += 1;
    }
    return copied;
}
function writeWranglerConfig(targetDir, projectName) {
    writeFileSync(join(targetDir, "wrangler.toml"), `name = "${projectName}"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./dist"
`, "utf8");
}
export function scaffoldPortableTemplate(options) {
    if (existsSync(options.targetDir)) {
        const existingEntries = readdirSync(options.targetDir);
        if (existingEntries.length > 0) {
            throw new Error(`Target directory is not empty: ${options.targetDir}`);
        }
    }
    try {
        mkdirSync(options.targetDir, { recursive: true });
        const copiedFileCount = copyTemplateRootMetadata(options.source, options.targetDir, options.projectName, options.siteTitle, options.packageVersion) +
            copyDirectory(options.source.workspaceRoot, options.targetDir, options.projectName, options.siteTitle, options.packageVersion);
        if (options.deployPreset === "cloudflare-pages" &&
            !existsSync(join(options.targetDir, "wrangler.toml"))) {
            writeWranglerConfig(options.targetDir, options.projectName);
        }
        return { copiedFileCount };
    }
    catch (error) {
        rmSync(options.targetDir, { force: true, recursive: true });
        throw error;
    }
    finally {
        options.source.cleanup?.();
    }
}
