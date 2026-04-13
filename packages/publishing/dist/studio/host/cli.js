/**
 * CLI entrypoint for the local publishing studio host.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/cli
 */
import { startPublishingStudioHost } from "./server.js";
export async function runPublishingStudioHostCli(options) {
    const host = await startPublishingStudioHost(options);
    if (!host.success) {
        console.error("[kit-publishing] Failed to start studio host.");
        console.error(host.error.reason);
        process.exit(1);
    }
    console.log(`[kit-publishing] Studio running at ${host.value.url}`);
    console.log(`[kit-publishing] Content root: ${host.value.root}`);
    await new Promise((resolve) => {
        let shutdownPromise = null;
        const shutdown = () => {
            if (shutdownPromise) {
                return shutdownPromise;
            }
            process.off("SIGINT", handleSigint);
            process.off("SIGTERM", handleSigterm);
            shutdownPromise = (async () => {
                try {
                    await host.value.stop();
                }
                catch (error) {
                    console.error("[kit-publishing] Failed to stop studio host cleanly.");
                    console.error(error instanceof Error ? error.message : String(error));
                    process.exitCode = 1;
                }
                finally {
                    resolve();
                }
            })();
            return shutdownPromise;
        };
        const handleSigint = () => {
            void shutdown();
        };
        const handleSigterm = () => {
            void shutdown();
        };
        process.once("SIGINT", handleSigint);
        process.once("SIGTERM", handleSigterm);
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
async function main() {
    await runPublishingStudioHostCli(parseArguments(Bun.argv.slice(2)));
}
if (import.meta.main) {
    void main();
}
