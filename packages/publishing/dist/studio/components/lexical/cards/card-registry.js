class PublishingCardRegistryImpl {
    constructor() {
        this.definitions = new Map();
    }
    register(definition) {
        this.definitions.set(definition.type, definition);
    }
    get(type) {
        return (this.definitions.get(type) ??
            null);
    }
    list() {
        return [
            ...this.definitions.values(),
        ];
    }
    create(type, data) {
        const definition = this.definitions.get(type);
        if (definition === undefined) {
            throw new Error(`Unknown card type: ${type}`);
        }
        return definition.create(data);
    }
    kgMenu(onSelect) {
        return this.list().map((definition) => ({
            type: definition.type,
            label: definition.label,
            description: definition.description ?? definition.label,
            onSelect: onSelect ? () => onSelect(definition.type) : undefined,
        }));
    }
}
export const publishingCardRegistry = new PublishingCardRegistryImpl();
export function registerPublishingCardDefinition(definition) {
    publishingCardRegistry.register(definition);
}
