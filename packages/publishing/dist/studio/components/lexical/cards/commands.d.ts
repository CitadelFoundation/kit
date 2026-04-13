import { type LexicalCommand } from "lexical";
import type { PublishingCardPayload } from "./card-wrapper.js";
export interface InsertCardCommandPayload<TType extends string = string, TData extends PublishingCardPayload = PublishingCardPayload> {
    readonly type: TType;
    readonly data: TData;
    readonly position?: "before" | "after" | "replace";
}
export interface DeleteCardCommandPayload {
    readonly key: string;
    readonly hardDelete?: boolean;
}
export declare const INSERT_CARD_COMMAND: LexicalCommand<InsertCardCommandPayload>;
export declare const DELETE_CARD_COMMAND: LexicalCommand<DeleteCardCommandPayload>;
