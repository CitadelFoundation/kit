/**
 * CLI entrypoint for the local publishing studio host.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/cli
 */
import { startPublishingStudioHost } from "./server.js";
async function main() {
    const options = parseArguments(Bun.argv.slice(2));
    const host = await startPublishingStudioHost(options);
    if (!host.success) {
        console.error("[kit-publishing] Failed to start studio host.");
        console.error(host.error.reason);
        process.exitCode = 1;
        return;
    }
    console.log(`[kit-publishing] Studio running at ${host.value.url}`);
    console.log(`[kit-publishing] Content root: ${host.value.root}`);
    const shutdown = async () => {
        await host.value.stop();
        process.exit(0);
    };
    process.once("SIGINT", () => {
        void shutdown();
    });
    process.once("SIGTERM", () => {
        void shutdown();
    });
}
function parseArguments(args) {
    let root = process.cwd();
    let host;
    let port;
    for (let index = 0; index < args.length; index += 1) {
        const current = args[index];
        const next = args[index + 1];
        switch (current) {
            case "--root":
                if (next) {
                    root = next;
                    index += 1;
                }
                break;
            case "--host":
                if (next) {
                    host = next;
                    index += 1;
                }
                break;
            case "--port":
                if (next) {
                    port = Number.parseInt(next, 10);
                    index += 1;
                }
                break;
            default:
                break;
        }
    }
    return { root, host, port };
}
void main();
