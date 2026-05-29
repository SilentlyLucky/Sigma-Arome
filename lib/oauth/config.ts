/**
 * OAuth Provider Configuration
 *
 * Stub implementation — external OAuth providers are not configured yet.
 * This file satisfies the import in app/api/auth/logout/route.ts.
 * Replace with full implementation when adding external OAuth (see /add-external-oauth skill).
 */

export interface OAuthProviderConfig {
  provider: string;
  logoutUrl?: string;
  logoutRedirectParam?: string;
}

/**
 * Get provider configuration by name.
 * Throws if provider is not configured.
 */
export function getProviderConfig(provider: string): OAuthProviderConfig {
  // No external OAuth providers configured yet
  throw new Error(`OAuth provider '${provider}' is not configured`);
}

/**
 * Build the IdP end-session (logout) URL for a given provider.
 * Returns null if the provider has no logout URL configured.
 */
export function buildLogoutUrl(
  config: OAuthProviderConfig,
  postLogoutRedirectUri: string
): string | null {
  if (!config.logoutUrl) return null;

  const url = new URL(config.logoutUrl);
  const redirectParam = config.logoutRedirectParam ?? 'post_logout_redirect_uri';
  url.searchParams.set(redirectParam, postLogoutRedirectUri);
  return url.toString();
}
