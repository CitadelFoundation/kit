export function createCardWrapperElement(config) {
    const wrapper = document.createElement("article");
    wrapper.className = "publishing-card-wrapper";
    wrapper.dataset.cardType = config.cardType;
    wrapper.dataset.selected = config.selected ? "true" : "false";
    const header = document.createElement("header");
    header.className = "publishing-card-wrapper__header";
    const title = document.createElement("h3");
    title.className = "publishing-card-wrapper__title";
    title.textContent = config.title ?? config.cardType;
    const type = document.createElement("span");
    type.className = "publishing-card-wrapper__type";
    type.textContent = config.cardType;
    header.append(title, type);
    const body = document.createElement("div");
    body.className = "publishing-card-wrapper__body";
    const summary = document.createElement("p");
    summary.className = "publishing-card-wrapper__summary";
    summary.textContent = renderCardDataSummary(config.data);
    body.append(summary);
    wrapper.append(header, body);
    return wrapper;
}
function renderCardDataSummary(data) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
        return "{}";
    }
    const body = data.body;
    if (typeof body === "string" && body.length > 0) {
        return body;
    }
    return JSON.stringify(data, null, 2);
}
