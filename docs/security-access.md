# NEXUS access containment and activation

The API is temporarily disabled because this application has no user identity or
session mechanism. `lib/apiAccess.ts` returns `503 AUTH_SETUP_REQUIRED` from every
sensitive route before request parsing or side effects. The dashboard remains
viewable with a notice. This is containment, **not completed user authentication**.
There is no environment flag, shared password, bearer API key, header, cookie, or
development shortcut that reopens these routes.

## Platform containment

In the **owning Vercel team's** NEXUS project, enable Vercel Authentication for
**all deployments**, including the production domain and historical deployment
URLs. Check access with a signed-out browser. Preview-only protection is not
sufficient. Do not assume repository ownership implies Vercel team membership.

Application checks remain necessary on every sensitive route even after platform
protection is enabled. Never trust caller-supplied `x-vercel-*` headers as a user
identity or use automation bypass tokens as a login mechanism.

## User authentication design to complete before reopening

1. Register a dedicated GitHub OAuth application under the owner's account. Use
   the confirmed production origin and an exact callback URL. Registration and
   consent must be completed by the account owner. Request identity only; do not
   request repository access for user login.
2. Integrate a maintained authentication library (for example Auth.js's GitHub
   provider). Verify its current supported stable release and Next.js compatibility
   at implementation time. Do not hand-roll OAuth, session cryptography, or a
   client-side password prompt.
3. Configure the library's documented client ID, client secret, session secret,
   and canonical origin as server-only environment variables. A GitHub service
   token or AI provider key is not a user credential and must never substitute
   for them. Keep production and preview credentials/redirects separate.
4. Limit sign-in to explicitly approved stable GitHub account IDs. Validate
   the ID at sign-in and on every server session check; usernames/emails from
   request bodies and browser storage are not evidence of identity.
5. Replace `getApiAccessDenial()` with server-side session verification and owner
   authorization. Return 401 for missing/invalid/expired sessions and 403 for
   authenticated users outside the allowlist. Missing configuration must continue
   to fail closed. Apply checks before parsing uploads, reading files, calling AI,
   or accessing GitHub. Protect provider health checks too: they can incur costs.
6. Add a real sign-in/sign-out flow and remove the temporary dashboard notice only
   after an authorized login succeeds. All mutation routes need same-origin/CSRF
   protection in addition to the session check; enable secure HttpOnly SameSite
   cookies and reject untrusted origins. Use the library's native protections.
7. Test absent/forged/expired sessions, a denied account, authorized reads,
   authorized mutations against mocks, logout, CSRF, and configuration failure.
   Do not use real GitHub issues, document stores, or paid AI calls for tests.
8. Deploy to a protected preview, verify the deployed commit and both allowed and
   denied flows, then promote to production. Retain route-level checks; optional
   `proxy.ts` redirects and client UI gates are not the authorization boundary.

## Dependency repair

- Next.js and eslint-config-next: 16.4.3 (October security minimum: 16.4.1).
- React and react-dom: 19.2.9.
- Next's resolved sharp: 0.35.5.
- Compatible transitive fixes: xmldom 0.8.15, zod 4.6.7, source-map-js 1.2.2,
  baseline-browser-mapping 2.11.34, brace-expansion 1.1.21/5.0.12,
  browserslist 4.29.5, and js-yaml 4.3.2.
- SheetJS: 0.20.3 from its official CDN, pinned in the lockfile with integrity.
  The npm registry's `xlsx` 0.18.5 is not a maintained update source.

Sources: [Next.js October security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026),
[SheetJS installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/),
[Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication),
[Auth.js](https://authjs.dev/getting-started).
