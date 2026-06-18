import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
	adminClient,
	genericOAuthClient,
	inferAdditionalFields,
	lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "~/lib/auth";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		passkeyClient(),
		apiKeyClient(),
		adminClient(),
		genericOAuthClient(),
		lastLoginMethodClient(),
	],
});
