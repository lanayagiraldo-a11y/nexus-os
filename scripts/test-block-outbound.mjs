// Loaded only by the local security test server, never by the application.
import http from "node:http";
import https from "node:https";

function blocked() {
  console.error("[outbound-blocked] A route attempted an external side effect");
  throw new Error("Outbound network is disabled in the access regression test");
}

globalThis.fetch = blocked;
http.request = blocked;
http.get = blocked;
https.request = blocked;
https.get = blocked;
