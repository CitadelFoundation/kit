export type PublishingCardPayload = Readonly<Record<string, unknown>>;
export interface PublishingCardWrapperConfig {
    readonly cardType: string;
    readonly data: PublishingCardPayload;
    readonly selected?: boolean;
    readonly title?: string;
}
export declare function createCardWrapperElement(config: PublishingCardWrapperConfig): HTMLElement;
