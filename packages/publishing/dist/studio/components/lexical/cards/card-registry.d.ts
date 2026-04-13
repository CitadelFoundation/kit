import type { SerializedPublishingCardNode, PublishingCardNode } from "./card-node.js";
import type { PublishingCardPayload } from "./card-wrapper.js";
export interface PublishingCardDefinition<TData extends PublishingCardPayload = PublishingCardPayload, TNode extends PublishingCardNode<string, TData> = PublishingCardNode<string, TData>> {
    readonly type: string;
    readonly label: string;
    readonly description?: string;
    readonly create: (data: TData) => TNode;
    readonly importJSON: (serializedNode: SerializedPublishingCardNode<string, TData>) => TNode;
}
export interface PublishingCardMenuItem {
    readonly type: string;
    readonly label: string;
    readonly description: string;
    readonly onSelect?: () => void;
}
declare class PublishingCardRegistryImpl {
    private readonly definitions;
    register<TData extends PublishingCardPayload, TNode extends PublishingCardNode<string, TData>>(definition: PublishingCardDefinition<TData, TNode>): void;
    get(type: string): PublishingCardDefinition | null;
    list(): readonly PublishingCardDefinition[];
    create<TData extends PublishingCardPayload, TNode extends PublishingCardNode<string, TData>>(type: string, data: TData): TNode;
    kgMenu(onSelect?: (type: string) => void): readonly PublishingCardMenuItem[];
}
export declare const publishingCardRegistry: PublishingCardRegistryImpl;
export declare function registerPublishingCardDefinition<TData extends PublishingCardPayload, TNode extends PublishingCardNode<string, TData>>(definition: PublishingCardDefinition<TData, TNode>): void;
export {};
