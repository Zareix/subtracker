import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth, lastLoginMethod } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "~/env";
import { Currencies, UserRoles } from "~/lib/constant";
import { db } from "~/lib/db";
import {
	account,
	apiKey as apiKeySchema,
	passkey as passkeySchema,
	session,
	users,
	verification,
} from "~/lib/db/schema";
import { sendResetPasswordEmail } from "~/lib/email";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: users,
			session,
			account,
			verification,
			passkey: passkeySchema,
			apikey: apiKeySchema,
		},
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }) => {
			void sendResetPasswordEmail({
				to: user.email,
				url,
			});
		},
		resetPasswordTokenExpiresIn: 6 * 60 * 60, // 6 hour
		password: {
			hash: Bun.password.hash,
			verify: ({ password, hash }) => {
				return Bun.password.verify(password, hash);
			},
		},
	},
	advanced: {
		database: { generateId: false },
	},
	user: {
		changeEmail: {
			enabled: true,
		},
		additionalFields: {
			role: {
				type: [...UserRoles],
				required: true,
				input: false,
			},
			baseCurrency: {
				type: [...Currencies],
				required: true,
				defaultValue: "EUR",
			},
		},
	},
	trustedOrigins: [env.BETTER_AUTH_URL].concat(
		env.NODE_ENV === "development"
			? ["http://localhost:3000", "http://192.168.31.6:3000"]
			: [],
	),
	plugins: [
		env.OAUTH_ENABLED && env.OAUTH_PROVIDER_ID && env.OAUTH_CLIENT_ID
			? genericOAuth({
					config: [
						{
							// biome-ignore lint/style/noNonNullAssertion : OAUTH_ENABLED
							providerId: env.OAUTH_PROVIDER_ID!,
							// biome-ignore lint/style/noNonNullAssertion : OAUTH_ENABLED
							clientId: env.OAUTH_CLIENT_ID!,
							clientSecret: env.OAUTH_CLIENT_SECRET,
							discoveryUrl: env.OAUTH_DISCOVERY_URL,
							scopes: ["openid", "email", "profile"],
						},
					],
				})
			: null,
		passkey({
			rpID:
				env.NODE_ENV === "production" && env.BETTER_AUTH_URL
					? new URL(env.BETTER_AUTH_URL).host
					: "localhost",
			rpName: "Subtracker",
			origin: env.BETTER_AUTH_URL,
		}),
		apiKey({
			references: "user",
			rateLimit: {
				enabled: env.NODE_ENV === "production",
				maxRequests: 100,
				timeWindow: 1000,
			},
		}),
		lastLoginMethod(),
		admin(),
		tanstackStartCookies(),
	].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;

export const getAuthSession = async () =>
	auth.api.getSession({
		headers: getRequestHeaders(),
	});

export const isAuthenticated = async () => !!(await getAuthSession())?.user;

export const requireSession = async () => {
	const session = await getAuthSession();
	if (!session) throw new Error("Unauthorized");
	return session;
};

export const requireAdmin = async () => {
	const session = await requireSession();
	if (session.user.role !== "admin") throw new Error("Forbidden");
	return session;
};

export const verifyApiKey = async (req: Request) => {
	const url = new URL(req.url);
	const apiKey = req.headers.get("x-api-key") ?? url.searchParams.get("apiKey");
	if (!apiKey) {
		throw new Error("No API key provided");
	}

	const { valid, key } = await auth.api.verifyApiKey({
		body: { key: apiKey },
	});
	if (!valid || !key) {
		throw new Error("Invalid API key");
	}

	return await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, key.referenceId),
	});
};
