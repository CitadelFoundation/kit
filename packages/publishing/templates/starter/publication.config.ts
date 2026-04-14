import type { PublicationWorkspaceConfig } from "@citadelfoundation/kit-publishing";

export const publicationWorkspaceConfig: PublicationWorkspaceConfig = {
  title: "{{siteTitle}}",
  profile: {
    title: "{{siteTitle}}",
    brand: "{{siteTitle}}",
    language: "en",
    description: "A local-first publishing site for {{siteTitle}}.",
    navigationLabel: "Site",
    docsLabel: "Docs",
  },
};
