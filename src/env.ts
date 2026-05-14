import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z._default(
			z.enum(["development", "test", "production"]),
			"development",
		),
		BETTER_AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.optional(z.string()),
		BETTER_AUTH_URL: z.url(),
		ADMIN_EMAIL: z.string(),
		DATABASE_PATH: z._default(z.string(), "./db.sqlite"),
		UPLOADS_FOLDER: z._default(z.string(), "./temp/uploads"),

		FRANKFURTER_API_URL: z._default(z.string(), "https://api.frankfurter.dev"),

		S3_ENABLED: z._default(
			z.boolean(),
			!!process.env.S3_BUCKET &&
				!!process.env.S3_ACCESS_KEY_ID &&
				!!process.env.S3_SECRET_ACCESS_KEY &&
				!!process.env.S3_REGION &&
				!!process.env.S3_ENDPOINT,
		),
		S3_BUCKET: z.optional(z.string()),
		S3_ACCESS_KEY_ID: z.optional(z.string()),
		S3_SECRET_ACCESS_KEY: z.optional(z.string()),
		S3_REGION: z.optional(z.string()),
		S3_ENDPOINT: z.optional(z.string()),

		GOOGLE_SEARCH_ID: z.optional(z.string()),
		GOOGLE_SEARCH_KEY: z.optional(z.string()),

		EMAIL_SERVER: z.optional(z.string()),
		EMAIL_FROM: z.optional(z.email()),

		OAUTH_ENABLED: z._default(
			z.boolean(),
			!!process.env.OAUTH_PROVIDER_ID &&
				!!process.env.OAUTH_CLIENT_ID &&
				!!process.env.OAUTH_CLIENT_SECRET &&
				!!process.env.OAUTH_DISCOVERY_URL,
		),
		OAUTH_PROVIDER_ID: z.optional(z.string()),
		OAUTH_CLIENT_ID: z.optional(z.string()),
		OAUTH_CLIENT_SECRET: z.optional(z.string()),
		OAUTH_DISCOVERY_URL: z.optional(z.string()),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `process.env`.
	 */
	runtimeEnv: process.env,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
