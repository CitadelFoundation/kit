/**
 * Lightweight logger facade owned by the publishing package.
 */
function shouldLog() {
    return (process.env.KIT_PUBLISHING_DEBUG === "1" ||
        process.env.KIT_PUBLISHING_DEBUG === "true");
}
function writeLog(level, scope, message, metadata) {
    if (!shouldLog()) {
        return;
    }
    const prefix = `[kit-publishing:${scope}]`;
    const args = metadata === undefined ? [prefix, message] : [prefix, message, metadata];
    switch (level) {
        case "warn":
            console.warn(...args);
            break;
        case "error":
            console.error(...args);
            break;
        default:
            console.info(...args);
            break;
    }
}
export function createLogger(scope) {
    return {
        info(message, metadata) {
            writeLog("info", scope, message, metadata);
        },
        warn(message, metadata) {
            writeLog("warn", scope, message, metadata);
        },
        error(message, metadata) {
            writeLog("error", scope, message, metadata);
        },
        perf(message, metadata) {
            writeLog("perf", scope, message, metadata);
        },
    };
}
