/**
 * Domain-agnostic publication workspace helpers.
 *
 * @module @citadelfoundation/kit-publishing/workspace
 */
const defaultContentKinds = [
    "site_settings",
    "navigation",
    "homepage",
    "tag",
    "post",
    "page",
    "doc_section",
    "doc_page",
    "asset",
];
const defaultPublicationCapabilities = [
    "content:read",
    "content:draft:write",
    "content:preview:read",
    "content:review:read",
    "content:publish:write",
    "content:config:write",
    "publication:deploy:read",
    "publication:deploy:write",
];
const defaultRemotePublicationCapabilities = [
    "content:read",
];
/**
 * Create a resolved publication workspace with safe local-first defaults.
 */
export function createPublicationWorkspace(options) {
    const inferredTitle = options.title ?? humanizeWorkspaceName(basenameFromPath(options.root));
    const profile = {
        title: options.profile?.title ?? inferredTitle,
        brand: options.profile?.brand ?? inferredTitle,
        language: options.profile?.language ?? "en",
        description: options.profile?.description,
        canonicalSiteUrl: options.profile?.canonicalSiteUrl,
        canonicalDocsUrl: options.profile?.canonicalDocsUrl,
        navigationLabel: options.profile?.navigationLabel ?? "Site",
        docsLabel: options.profile?.docsLabel ?? "Docs",
    };
    const capabilitySet = {
        contentKinds: options.capabilities?.contentKinds ?? defaultContentKinds,
        actions: uniqueCapabilities(options.capabilities?.actions ?? defaultPublicationCapabilities),
    };
    const defaultPrincipalSource = options.policy?.defaultPrincipal ?? options.principal;
    const defaultPrincipal = {
        id: defaultPrincipalSource?.id ?? "local-editor",
        displayName: defaultPrincipalSource?.displayName ?? "Local Editor",
        authMethod: defaultPrincipalSource?.authMethod ?? "local",
        walletAddress: normalizeWalletAddress(defaultPrincipalSource?.walletAddress),
        capabilities: uniqueCapabilities((defaultPrincipalSource?.capabilities ?? capabilitySet.actions).filter((capability) => capabilitySet.actions.includes(capability))),
    };
    const identityProviders = options.policy?.identityProviders && options.policy.identityProviders.length > 0
        ? options.policy.identityProviders
        : options.identityProviders && options.identityProviders.length > 0
            ? options.identityProviders
            : [
                {
                    id: "local-session",
                    label: "Local Studio Session",
                    kind: "local",
                },
            ];
    const policy = {
        identityProviders,
        defaultPrincipal,
        adminPrincipalIds: options.policy?.adminPrincipalIds ?? [],
        adminWalletAddresses: normalizeWalletAddresses(options.policy?.adminWalletAddresses) ?? [],
        groups: (options.policy?.groups ?? []).map((group) => normalizePublicationPolicyGroup(group, capabilitySet.actions)),
        grants: (options.policy?.grants ?? []).map((grant) => normalizePublicationPolicyGrant(grant, capabilitySet.actions)),
        license: normalizePublicationLicensePolicy(options.policy?.license, capabilitySet.actions),
    };
    return {
        id: options.id ?? slugifyWorkspaceId(profile.title),
        title: inferredTitle,
        root: options.root,
        contentRoot: options.contentRoot ?? joinWorkspacePath(options.root, "content"),
        profile,
        deployTargets: options.deployTargets ?? [],
        capabilities: capabilitySet,
        policy,
    };
}
/**
 * Resolve a request-scoped publication session from a workspace and provider hint.
 */
export function createPublicationSession(workspace, options = {}) {
    const provider = resolveIdentityProvider(workspace, options.providerId);
    const policy = workspace.policy;
    const walletAddress = normalizeWalletAddress(options.principal?.walletAddress ?? options.walletAddress);
    const fallbackAuthMethod = provider.kind === "wallet"
        ? "wallet"
        : provider.kind === "oidc"
            ? "token"
            : "local";
    const providerCapabilities = provider.defaultCapabilities ?? workspace.capabilities.actions;
    const policyResolution = resolvePolicyCapabilities(workspace, provider.id, options.principal?.id, walletAddress);
    const principalCapabilities = uniqueCapabilities((options.principal?.capabilities ??
        (policyResolution.matched
            ? policyResolution.capabilities
            : provider.kind === "local"
                ? policy.defaultPrincipal.capabilities
                : defaultRemotePublicationCapabilities)).filter((capability) => workspace.capabilities.actions.includes(capability)));
    return {
        providerId: provider.id,
        principal: {
            id: options.principal?.id ?? policy.defaultPrincipal.id,
            displayName: options.principal?.displayName ??
                policyResolution.displayName ??
                (walletAddress
                    ? abbreviateWalletAddress(walletAddress)
                    : policy.defaultPrincipal.displayName),
            authMethod: options.principal?.authMethod ?? provider.authMethod ?? fallbackAuthMethod,
            walletAddress,
            capabilities: uniqueCapabilities(principalCapabilities.filter((capability) => providerCapabilities.includes(capability))),
        },
        license: createDisabledPublicationLicenseSession(),
    };
}
export async function resolvePublicationSession(workspace, options = {}) {
    const baseSession = createPublicationSession(workspace, options);
    const licensePolicy = workspace.policy.license;
    if (!licensePolicy || licensePolicy.mode === "disabled") {
        return baseSession;
    }
    const provider = resolveIdentityProvider(workspace, options.providerId);
    const providerDeniedReason = "Select one of the configured licensed identity providers to continue.";
    if (licensePolicy.providerIds &&
        licensePolicy.providerIds.length > 0 &&
        !licensePolicy.providerIds.includes(provider.id)) {
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(baseSession, licensePolicy, "provider-denied", providerDeniedReason)
            : createFallbackLicenseSession(baseSession, licensePolicy, "provider-denied", providerDeniedReason);
    }
    const scope = licensePolicy.scope;
    const resolver = options.license?.resolver;
    if (!scope || !resolver) {
        const reason = "License verification is required before this workspace can load.";
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(baseSession, licensePolicy, "unavailable", reason)
            : createFallbackLicenseSession(baseSession, licensePolicy, "unavailable");
    }
    let sessionResult;
    try {
        sessionResult = await resolver.resolveSession({
            scope,
            evidence: options.license?.evidence ?? [],
        });
    }
    catch {
        const reason = "License verification is required before this workspace can load.";
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(baseSession, licensePolicy, "unavailable", reason)
            : createFallbackLicenseSession(baseSession, licensePolicy, "unavailable");
    }
    if (sessionResult.state === "anonymous") {
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(baseSession, licensePolicy, "anonymous", "A licensed sign-in is required before this workspace can load.")
            : createFallbackLicenseSession(baseSession, licensePolicy, "anonymous");
    }
    if (sessionResult.state === "invalid") {
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(baseSession, licensePolicy, "invalid", "A valid licensed sign-in is required before this workspace can load.")
            : createFallbackLicenseSession(baseSession, licensePolicy, "invalid");
    }
    const authenticatedAccount = normalizeWalletAddress(sessionResult.account);
    if (!authenticatedAccount) {
        const reason = "License verification is required before this workspace can load.";
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(baseSession, licensePolicy, "unavailable", reason)
            : createFallbackLicenseSession(baseSession, licensePolicy, "unavailable");
    }
    const policySession = createPublicationSession(workspace, {
        ...options,
        walletAddress: authenticatedAccount,
        principal: {
            ...options.principal,
            walletAddress: authenticatedAccount,
        },
    });
    let entitlements;
    try {
        entitlements = await resolver.resolveEntitlements({
            scope,
            account: authenticatedAccount,
        });
    }
    catch {
        const reason = "License verification is required before this workspace can load.";
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(policySession, licensePolicy, "unavailable", reason)
            : createFallbackLicenseSession(policySession, licensePolicy, "unavailable");
    }
    let mappedCapabilities = [];
    try {
        mappedCapabilities = await mapPublicationLicenseCapabilities(resolver, licensePolicy, authenticatedAccount, entitlements);
    }
    catch {
        const reason = "License verification is required before this workspace can load.";
        return licensePolicy.mode === "required"
            ? createBlockedLicenseSession(policySession, licensePolicy, "unavailable", reason)
            : createFallbackLicenseSession(policySession, licensePolicy, "unavailable");
    }
    const principalCapabilities = licensePolicy.capabilityRules && licensePolicy.capabilityRules.length > 0
        ? intersectCapabilities(policySession.principal.capabilities, mappedCapabilities)
        : policySession.principal.capabilities;
    return {
        ...policySession,
        principal: {
            ...policySession.principal,
            walletAddress: authenticatedAccount,
            capabilities: principalCapabilities,
        },
        license: {
            enabled: true,
            mode: licensePolicy.mode,
            evaluation: "authenticated",
            sessionState: "authenticated",
            scope,
            account: authenticatedAccount,
            grantedBundleIds: entitlements.grantedBundleIds,
            grantedCapabilityIds: entitlements.grantedCapabilities,
            mappedCapabilities,
            matchedTierIds: entitlements.matchedTierIds,
            matchedPartnerIds: entitlements.matchedPartnerIds,
            sources: entitlements.sources,
        },
    };
}
/**
 * Check whether a session can perform a capability-bound action.
 */
export function hasPublicationCapability(session, capability) {
    return session.principal.capabilities.includes(capability);
}
function uniqueCapabilities(capabilities) {
    return [...new Set(capabilities)];
}
function createDisabledPublicationLicenseSession() {
    return {
        enabled: false,
        mode: "disabled",
        evaluation: "disabled",
        sessionState: "disabled",
        grantedBundleIds: [],
        grantedCapabilityIds: [],
        mappedCapabilities: [],
        matchedTierIds: [],
        matchedPartnerIds: [],
        sources: [],
    };
}
function createFallbackLicenseSession(session, licensePolicy, sessionState, reason) {
    return createResolvedLicenseSession(session, licensePolicy, "fallback", sessionState, reason);
}
function createBlockedLicenseSession(session, licensePolicy, sessionState, reason) {
    return createResolvedLicenseSession({
        ...session,
        principal: {
            ...session.principal,
            capabilities: [],
        },
    }, licensePolicy, "blocked", sessionState, reason);
}
function createResolvedLicenseSession(session, licensePolicy, evaluation, sessionState, reason) {
    return {
        ...session,
        license: {
            enabled: true,
            mode: licensePolicy.mode,
            evaluation,
            sessionState,
            scope: licensePolicy.scope,
            grantedBundleIds: [],
            grantedCapabilityIds: [],
            mappedCapabilities: [],
            matchedTierIds: [],
            matchedPartnerIds: [],
            sources: [],
            reason,
        },
    };
}
function normalizePublicationLicensePolicy(policy, availableCapabilities) {
    if (!policy) {
        return undefined;
    }
    return {
        ...policy,
        capabilityRules: policy.capabilityRules?.filter((rule) => availableCapabilities.includes(rule.capability)),
    };
}
async function mapPublicationLicenseCapabilities(resolver, licensePolicy, account, entitlements) {
    const rules = licensePolicy.capabilityRules;
    if (!licensePolicy.scope || !rules || rules.length === 0) {
        return [];
    }
    const mappedCapabilities = [];
    for (const rule of rules) {
        const hasAccess = await resolver.hasAccess({
            scope: licensePolicy.scope,
            account,
            requirements: rule.requirements,
            match: rule.match,
            entitlements,
        });
        if (hasAccess) {
            mappedCapabilities.push(rule.capability);
        }
    }
    return uniqueCapabilities(mappedCapabilities);
}
function intersectCapabilities(baseCapabilities, mappedCapabilities) {
    const allowed = new Set(mappedCapabilities);
    return baseCapabilities.filter((capability) => allowed.has(capability));
}
function resolveIdentityProvider(workspace, providerId) {
    if (providerId) {
        const matchedProvider = workspace.policy.identityProviders.find((candidate) => candidate.id === providerId);
        if (matchedProvider) {
            return matchedProvider;
        }
    }
    return (workspace.policy.identityProviders.find((candidate) => candidate.kind === "local") ??
        workspace.policy.identityProviders[0] ?? {
        id: "local-session",
        label: "Local Studio Session",
        kind: "local",
        authMethod: "local",
    });
}
function resolvePolicyCapabilities(workspace, providerId, principalId, walletAddress) {
    const matchedGrants = (workspace.policy.grants ?? []).filter((grant) => grantMatches(grant, providerId, principalId, walletAddress));
    const matchedGroups = (workspace.policy.groups ?? []).filter((group) => groupMatches(group, principalId, walletAddress));
    const isAdmin = isPublicationAdmin(workspace.policy, principalId, walletAddress);
    const adminCapabilities = isAdmin ? workspace.capabilities.actions : [];
    return {
        capabilities: uniqueCapabilities([
            ...adminCapabilities,
            ...matchedGroups.flatMap((group) => group.capabilities),
            ...matchedGrants.flatMap((grant) => grant.capabilities),
        ]),
        displayName: matchedGrants.find((grant) => grant.displayName)?.displayName,
        matched: isAdmin || matchedGroups.length > 0 || matchedGrants.length > 0,
    };
}
function normalizePublicationPolicyGroup(group, availableCapabilities) {
    return {
        ...group,
        capabilities: uniqueCapabilities(group.capabilities.filter((capability) => availableCapabilities.includes(capability))),
        walletAddresses: normalizeWalletAddresses(group.walletAddresses),
    };
}
function normalizePublicationPolicyGrant(grant, availableCapabilities) {
    return {
        ...grant,
        capabilities: uniqueCapabilities(grant.capabilities.filter((capability) => availableCapabilities.includes(capability))),
        walletAddress: normalizeWalletAddress(grant.walletAddress),
    };
}
function grantMatches(grant, providerId, principalId, walletAddress) {
    const hasSelector = typeof grant.principalId === "string" ||
        typeof grant.walletAddress === "string" ||
        typeof grant.providerId === "string";
    if (!hasSelector) {
        return false;
    }
    if (grant.providerId && grant.providerId !== providerId) {
        return false;
    }
    if (grant.principalId && grant.principalId !== principalId) {
        return false;
    }
    if (grant.walletAddress && grant.walletAddress !== walletAddress) {
        return false;
    }
    return true;
}
function groupMatches(group, principalId, walletAddress) {
    const matchesPrincipal = principalId !== undefined &&
        (group.principalIds ?? []).includes(principalId);
    const matchesWallet = walletAddress !== undefined &&
        (group.walletAddresses ?? []).includes(walletAddress);
    return matchesPrincipal || matchesWallet;
}
function isPublicationAdmin(policy, principalId, walletAddress) {
    const isPrincipalAdmin = principalId !== undefined &&
        (policy.adminPrincipalIds ?? []).includes(principalId);
    const isWalletAdmin = walletAddress !== undefined &&
        (policy.adminWalletAddresses ?? []).includes(walletAddress);
    return isPrincipalAdmin || isWalletAdmin;
}
function humanizeWorkspaceName(value) {
    const normalized = value.replace(/[-_]+/gu, " ").trim();
    if (normalized.length === 0) {
        return "Publishing Workspace";
    }
    return normalized.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}
function slugifyWorkspaceId(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, "-")
        .replace(/^-+|-+$/gu, "") || "publication-workspace";
}
function basenameFromPath(value) {
    const normalized = value.replace(/\\/gu, "/").replace(/\/+$/gu, "");
    const segments = normalized.split("/");
    return segments.at(-1) ?? normalized;
}
function joinWorkspacePath(root, segment) {
    const normalizedRoot = root.replace(/[\\/]+$/gu, "");
    return `${normalizedRoot}/${segment}`;
}
function abbreviateWalletAddress(value) {
    const trimmed = value.trim();
    if (trimmed.length <= 12) {
        return trimmed;
    }
    return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}
function normalizeWalletAddress(value) {
    const normalized = value?.trim().toLowerCase();
    return normalized && normalized.length > 0 ? normalized : undefined;
}
function normalizeWalletAddresses(values) {
    if (!values || values.length === 0) {
        return undefined;
    }
    return values
        .map((value) => normalizeWalletAddress(value))
        .filter((value) => typeof value === "string");
}
