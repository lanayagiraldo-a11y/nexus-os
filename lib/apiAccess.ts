/**
 * Temporary containment while NEXUS has no user authentication provider.
 *
 * Call at the start of every sensitive route, before reading request bodies,
 * private files, provider configuration, or invoking paid/external services.
 * Nothing supplied by a caller (cookies, headers, or a provider API key) can
 * bypass this gate. Replace this only with verified, authorized user sessions;
 * see docs/security-access.md for the activation requirements.
 */
export function getApiAccessDenial(): Response | null {
  return Response.json(
    {
      code: "AUTH_SETUP_REQUIRED",
      error:
        "Las funciones privadas de NEXUS están temporalmente pausadas. Es necesario configurar un inicio de sesión autorizado antes de reactivarlas.",
    },
    {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
