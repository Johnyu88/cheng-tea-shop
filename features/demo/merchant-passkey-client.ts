"use client";
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
// Same-origin official client, reused from sandboxes/passkey-lock.
export const merchantPasskeyClient = createAuthClient({ plugins: [passkeyClient()] });

