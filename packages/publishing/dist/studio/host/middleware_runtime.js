export async function createPublishingStudioMiddlewareRuntime(options) {
    let hostApp = null;
    let freshnessController = null;
    let initializationError = null;
    let inFlightInitialization = null;
    const getHostState = async () => {
        if (hostApp && freshnessController) {
            return {
                hostApp,
                freshnessController,
            };
        }
        if (inFlightInitialization) {
            return inFlightInitialization;
        }
        inFlightInitialization = (async () => {
            let app;
            try {
                app = await options.createHostApp();
            }
            catch (error) {
                initializationError = formatInitializationError(error, "Failed to initialize publishing studio");
                throw new Error(initializationError);
            }
            if (!app.success) {
                initializationError =
                    app.error.reason ?? "Failed to initialize publishing studio";
                throw new Error(initializationError);
            }
            let controller;
            try {
                controller = await options.createFreshnessController(app.value.clientBundlePath);
            }
            catch (error) {
                initializationError = formatInitializationError(error, "Failed to initialize publishing studio");
                await app.value.dispose?.();
                throw new Error(initializationError);
            }
            if (!controller.success) {
                initializationError =
                    controller.error.reason ?? "Failed to initialize publishing studio";
                await app.value.dispose?.();
                throw new Error(initializationError);
            }
            hostApp = app.value;
            freshnessController = controller.value;
            initializationError = null;
            return {
                hostApp,
                freshnessController,
            };
        })().finally(() => {
            inFlightInitialization = null;
        });
        return inFlightInitialization;
    };
    return async (context, next) => {
        const pathname = context.url.pathname;
        const isStudioPath = pathname === "/studio" || pathname.startsWith("/studio/");
        const isApiPath = pathname === "/api" || pathname.startsWith("/api/");
        const shouldIntercept = isStudioPath || isApiPath || pathname === "/studio.js";
        if (!shouldIntercept) {
            return next();
        }
        let response;
        try {
            const state = await getHostState();
            if (pathname === "/studio.js") {
                let fresh;
                try {
                    fresh = await state.freshnessController.ensureFresh();
                }
                catch (error) {
                    return new Response(`Publishing Studio unavailable: ${formatInitializationError(error, "Failed to refresh the publishing studio client bundle.")}`, {
                        status: 503,
                        headers: {
                            "content-type": "text/plain; charset=utf-8",
                        },
                    });
                }
                if (!fresh.success) {
                    return new Response(`Publishing Studio unavailable: ${fresh.error.reason ?? "Failed to refresh the publishing studio client bundle."}`, {
                        status: 503,
                        headers: {
                            "content-type": "text/plain; charset=utf-8",
                        },
                    });
                }
            }
            response = await state.hostApp.app.handle(context.request);
        }
        catch (error) {
            if (initializationError) {
                return new Response(`Publishing Studio unavailable: ${initializationError}`, {
                    status: 503,
                    headers: {
                        "content-type": "text/plain; charset=utf-8",
                    },
                });
            }
            return new Response(`Publishing Studio unavailable: ${formatInitializationError(error, "Failed to handle the publishing studio request.")}`, {
                status: 503,
                headers: {
                    "content-type": "text/plain; charset=utf-8",
                },
            });
        }
        if (response.status === 404) {
            return next();
        }
        return response;
    };
}
function formatInitializationError(error, fallback) {
    if (error instanceof Error && error.message.length > 0) {
        return error.message;
    }
    const formatted = String(error ?? "");
    if (formatted.length > 0 && formatted !== "[object Object]") {
        return formatted;
    }
    return fallback;
}
