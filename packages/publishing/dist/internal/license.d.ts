/**
 * Publishing-owned license adapter contracts.
 *
 * These intentionally mirror the current publishing needs without exposing
 * a sibling package runtime dependency.
 */
export interface PublishingLicenseCachePolicy {
    readonly ttlMs?: number;
}
export interface PublishingLicenseScope {
    readonly scopeId: string;
    readonly scopeType: string;
}
export interface PublishingLicenseSessionEvidence {
    readonly kind: string;
    readonly value: string;
}
export type PublishingLicenseSessionState = "anonymous" | "authenticated" | "invalid";
export interface PublishingLicenseSessionInput {
    readonly scope: PublishingLicenseScope;
    readonly evidence: readonly PublishingLicenseSessionEvidence[];
}
export type PublishingLicenseSessionResult = {
    readonly state: "anonymous";
    readonly scopeId: string;
    readonly scopeType: string;
    readonly cachePolicy?: PublishingLicenseCachePolicy;
} | {
    readonly state: "invalid";
    readonly scopeId: string;
    readonly scopeType: string;
    readonly cachePolicy?: PublishingLicenseCachePolicy;
} | {
    readonly state: "authenticated";
    readonly scopeId: string;
    readonly scopeType: string;
    readonly account: string;
    readonly sessionId?: string;
    readonly issuedAt?: string;
    readonly expiresAt?: string;
    readonly cachePolicy?: PublishingLicenseCachePolicy;
};
export interface PublishingLicenseEntitlementInput {
    readonly scope: PublishingLicenseScope;
    readonly account: string;
}
export interface PublishingLicenseEntitlementResult {
    readonly scopeId: string;
    readonly scopeType: string;
    readonly account: string;
    readonly grantedBundleIds: readonly string[];
    readonly grantedCapabilities: readonly string[];
    readonly matchedTierIds: readonly string[];
    readonly matchedPartnerIds: readonly string[];
    readonly sources: readonly string[];
    readonly resolvedAt: string;
    readonly cachePolicy?: PublishingLicenseCachePolicy;
}
export type PublishingLicenseAccessRequirement = {
    readonly type: "bundle";
    readonly bundleId: string;
} | {
    readonly type: "capability";
    readonly capability: string;
};
export type PublishingLicenseAccessMatchMode = "all" | "any";
export interface PublishingLicenseAccessCheck {
    readonly scope: PublishingLicenseScope;
    readonly account: string;
    readonly requirements: readonly [
        PublishingLicenseAccessRequirement,
        ...PublishingLicenseAccessRequirement[]
    ];
    readonly match?: PublishingLicenseAccessMatchMode;
    readonly entitlements?: PublishingLicenseEntitlementResult;
}
export interface PublishingLicenseResolver {
    resolveSession(input: PublishingLicenseSessionInput): Promise<PublishingLicenseSessionResult>;
    resolveEntitlements(input: PublishingLicenseEntitlementInput): Promise<PublishingLicenseEntitlementResult>;
    hasAccess(input: PublishingLicenseAccessCheck): Promise<boolean>;
}
