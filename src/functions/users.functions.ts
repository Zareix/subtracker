import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { requireAdmin, requireSession } from "~/lib/auth";
import type { AuthProvider } from "~/lib/auth-client";
import { db, runTransaction } from "~/lib/db";
import { subscriptions, users, usersToSubscriptions } from "~/lib/db/schema";
import { takeFirstOrThrow } from "~/lib/utils";

export const getAuthProviders = createServerFn({ method: "GET" }).handler(
	async () => {
		const providers: AuthProvider[] = ["password", "passkey"];
		if (env.OAUTH_ENABLED) {
			providers.push(`oauth-${env.OAUTH_PROVIDER_ID}`);
		}
		return providers;
	},
);

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	await requireSession();
	return db.query.users.findMany({
		columns: { id: true, name: true, email: true, image: true, role: true },
		orderBy: [asc(users.name)],
	});
});

export const editUser = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			name: z.string(),
			email: z.email(),
			image: z.string().nullish(),
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireAdmin();
		if (session.user.id === data.id) {
			throw new Error(
				"You cannot edit your own user information through this endpoint.",
			);
		}
		const user = takeFirstOrThrow(
			await db
				.update(users)
				.set({ name: data.name, email: data.email, image: data.image })
				.where(eq(users.id, data.id))
				.returning({ id: users.id }),
			"Error updating user",
		);
		return { id: user.id };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireAdmin();
		const user = await db.query.users.findFirst({
			where: (tb, { eq }) => eq(tb.id, data.id),
		});
		if (!user) {
			throw new Error("User not found");
		}
		await runTransaction(db, async (tx) => {
			const userToSubs = await tx
				.delete(usersToSubscriptions)
				.where(eq(usersToSubscriptions.userId, data.id))
				.returning({ subscriptionId: usersToSubscriptions.subscriptionId });
			for (const { subscriptionId } of userToSubs) {
				await tx
					.delete(subscriptions)
					.where(eq(subscriptions.id, subscriptionId));
			}
			await tx.delete(users).where(eq(users.id, data.id));
		});
		return { id: user.id, name: user.name, email: user.email };
	});
