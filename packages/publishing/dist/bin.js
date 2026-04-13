#!/usr/bin/env bun
/**
 * Public CLI entrypoint for `@citadelfoundation/kit-publishing`.
 *
 * @module @citadelfoundation/kit-publishing/bin
 */
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { SUPPORTED_PUBLISHING_DEPLOY_PRESETS, BUILT_IN_TEMPLATE_CATALOG, } from "./catalog.js";
import { inferSiteTitle, readPublishingPackageVersion, resolveBuiltInTemplate, resolveImportedTemplate, scaffoldPortableTemplate, } from "./internal/portable_templates.js";
import { runPublishingStudioHostCli } from "./studio/host/cli.js";
const HELP_TEXT = `kit-publishing

Usage:
  kit-publishing <command> [options]

Commands:
  create              Create a new site from a built-in or imported template
  studio              Start the local publishing studio host
  template validate   Validate a portable template source

Use "kit-publishing <command> --help" for command-specific help.

Note: This CLI runs on Bun.`;
const CREATE_HELP_TEXT = `Usage:
  kit-publishing create <directory> --template <blank|starter|publication> [--deploy <none|cloudflare-pages>]
  kit-publishing create <directory> --from <source> [--subdir <path>] [--deploy <none|cloudflare-pages>]

Sources for --from:
  - local directory path
  - Git URL or path ending in .git
  - npm package spec prefixed with npm:

Examples:
  bunx @citadelfoundation/kit-publishing create my-site --template publication
  bunx @citadelfoundation/kit-publishing create my-site --from ./my-template
  bunx @citadelfoundation/kit-publishing create my-site --from npm:@scope/my-template
`;
const STUDIO_HELP_TEXT = `Usage:
  kit-publishing studio --root <directory> [--host <host>] [--port <port>]

Examples:
  bunx @citadelfoundation/kit-publishing studio --root ./my-site
  bunx @citadelfoundation/kit-publishing studio --root ./my-site --port 4711
`;
const TEMPLATE_VALIDATE_HELP_TEXT = `Usage:
  kit-publishing template validate <source> [--subdir <path>]

Examples:
  bunx @citadelfoundation/kit-publishing template validate ./my-template
  bunx @citadelfoundation/kit-publishing template validate https://github.com/example/repo.git --subdir templates/blog
`;
const BUILT_IN_TEMPLATE_IDS = BUILT_IN_TEMPLATE_CATALOG.map((entry) => entry.manifest.id);
const DEPLOY_PRESETS = SUPPORTED_PUBLISHING_DEPLOY_PRESETS;
class PublishingCliError extends Error {
    constructor(message) {
        super(message);
        this.name = "PublishingCliError";
    }
}
function printHelp(text = HELP_TEXT) {
    console.log(text.trim());
}
function exitError(message) {
    throw new PublishingCliError(message);
}
function parseArguments(args, options) {
    const allowedValueFlags = new Set(options.valueFlags);
    const allowedBooleanFlags = new Set(options.booleanFlags ?? []);
    const valueFlags = new Map();
    const booleanFlags = new Set();
    const positional = [];
    for (let index = 0; index < args.length; index += 1) {
        const current = args[index];
        if (!current.startsWith("--")) {
            positional.push(current);
            continue;
        }
        const flagName = current.slice(2);
        if (allowedBooleanFlags.has(flagName)) {
            booleanFlags.add(flagName);
            continue;
        }
        if (!allowedValueFlags.has(flagName)) {
            exitError(`Unknown option: ${current}`);
        }
        const next = args[index + 1];
        if (!next || next.startsWith("--")) {
            exitError(`Missing value for option: ${current}`);
        }
        valueFlags.set(flagName, next);
        index += 1;
    }
    return {
        positional,
        valueFlags,
        booleanFlags,
    };
}
function inferProjectName(input) {
    const normalized = input
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return normalized.length > 0 ? normalized : "kit-publishing-site";
}
async function loadWorkspaceConfig(root) {
    const configPath = resolve(root, "publication.config.ts");
    if (!existsSync(configPath)) {
        exitError(`publication.config.ts not found in ${root}`);
    }
    const module = await import(__rewriteRelativeImportExtension(`file://${configPath}`));
    const config = module.publicationWorkspaceConfig;
    if (!config || typeof config !== "object") {
        exitError("publication.config.ts must export a named publicationWorkspaceConfig object.");
    }
    return config;
}
async function runCreate(args) {
    const parsed = parseArguments(args, {
        valueFlags: ["template", "from", "subdir", "deploy"],
        booleanFlags: ["help"],
    });
    if (parsed.booleanFlags.has("help")) {
        printHelp(CREATE_HELP_TEXT);
        return;
    }
    const directory = parsed.positional[0];
    if (!directory) {
        exitError("create requires a target <directory>.");
    }
    const templateId = parsed.valueFlags.get("template");
    const fromSource = parsed.valueFlags.get("from");
    if ((templateId ? 1 : 0) + (fromSource ? 1 : 0) !== 1) {
        exitError("create requires exactly one of --template or --from.");
    }
    const deployPreset = (parsed.valueFlags.get("deploy") ??
        "none");
    if (!DEPLOY_PRESETS.includes(deployPreset)) {
        exitError(`Unknown deploy preset: ${deployPreset}. Available: ${DEPLOY_PRESETS.join(", ")}`);
    }
    const targetDir = resolve(directory);
    const rawDirectoryName = basename(targetDir);
    const projectName = inferProjectName(rawDirectoryName);
    const siteTitle = inferSiteTitle(rawDirectoryName);
    const packageVersion = readPublishingPackageVersion();
    const subdir = parsed.valueFlags.get("subdir");
    let resolvedTemplate;
    if (templateId) {
        if (!BUILT_IN_TEMPLATE_IDS.includes(templateId)) {
            exitError(`Unknown template: ${templateId}. Available: ${BUILT_IN_TEMPLATE_IDS.join(", ")}`);
        }
        if (subdir) {
            exitError("--subdir is only supported with --from.");
        }
        resolvedTemplate = resolveBuiltInTemplate(templateId, packageVersion);
    }
    else {
        resolvedTemplate = resolveImportedTemplate(fromSource, packageVersion, subdir);
    }
    try {
        if (!resolvedTemplate.manifest.supportedDeployPresets.includes(deployPreset)) {
            exitError(`Template ${resolvedTemplate.manifest.id} does not support deploy preset: ${deployPreset}. Supported presets: ${resolvedTemplate.manifest.supportedDeployPresets.join(", ")}`);
        }
        const result = scaffoldPortableTemplate({
            source: resolvedTemplate,
            targetDir,
            projectName,
            siteTitle,
            packageVersion,
            deployPreset,
        });
        console.log(`Created ${resolvedTemplate.manifest.label} template in ${targetDir}`);
        console.log(`Copied ${result.copiedFileCount} files.`);
        console.log("");
        console.log("Next steps:");
        console.log(`  cd ${basename(targetDir)}`);
        console.log("  bun install");
        console.log("  bun run studio:dev");
    }
    finally {
        resolvedTemplate.cleanup?.();
    }
}
async function runStudio(args) {
    const parsed = parseArguments(args, {
        valueFlags: ["root", "host", "port"],
        booleanFlags: ["help"],
    });
    if (parsed.booleanFlags.has("help")) {
        printHelp(STUDIO_HELP_TEXT);
        return;
    }
    const root = parsed.valueFlags.get("root");
    if (!root) {
        exitError("studio requires --root <directory>.");
    }
    const config = await loadWorkspaceConfig(root);
    const portLabel = parsed.valueFlags.get("port");
    const port = portLabel === undefined ? undefined : Number.parseInt(portLabel, 10);
    if (portLabel !== undefined && Number.isNaN(port)) {
        exitError(`Invalid --port value: ${portLabel}`);
    }
    await runPublishingStudioHostCli({
        root: resolve(root),
        host: parsed.valueFlags.get("host"),
        port,
        workspace: config,
    });
}
async function runTemplateValidate(args) {
    const parsed = parseArguments(args, {
        valueFlags: ["subdir"],
        booleanFlags: ["help"],
    });
    if (parsed.booleanFlags.has("help")) {
        printHelp(TEMPLATE_VALIDATE_HELP_TEXT);
        return;
    }
    const source = parsed.positional[0];
    if (!source) {
        exitError("template validate requires a <source> path, Git URL, or npm: spec.");
    }
    const packageVersion = readPublishingPackageVersion();
    const template = resolveImportedTemplate(source, packageVersion, parsed.valueFlags.get("subdir"));
    try {
        console.log(`Template validated: ${template.manifest.label}`);
        console.log(`- id: ${template.manifest.id}`);
        console.log(`- source: ${template.root}`);
        console.log(`- workspace: ${template.workspaceRoot}`);
        console.log(`- deploy presets: ${template.manifest.supportedDeployPresets.join(", ")}`);
    }
    finally {
        template.cleanup?.();
    }
}
async function main() {
    try {
        const args = process.argv.slice(2);
        const command = args[0];
        if (!command || command === "--help") {
            printHelp();
            return;
        }
        switch (command) {
            case "create":
                await runCreate(args.slice(1));
                return;
            case "studio":
                await runStudio(args.slice(1));
                return;
            case "template": {
                const subcommand = args[1];
                if (subcommand !== "validate") {
                    exitError(`Unknown template subcommand: ${subcommand ?? "(missing)"}`);
                }
                await runTemplateValidate(args.slice(2));
                return;
            }
            default:
                exitError(`Unknown command: ${command}`);
        }
    }
    catch (error) {
        if (error instanceof PublishingCliError) {
            console.error(error.message);
            process.exitCode = 1;
            return;
        }
        throw error;
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
