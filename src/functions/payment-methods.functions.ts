import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "~/lib/auth";
import { db, runTransaction } from "~/lib/db";
import {
	paymentMethods,
	subscriptions,
	usersToSubscriptions,
} from "~/lib/db/schema";
import { takeFirstOrThrow } from "~/lib/utils";

export const getPaymentMethods = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireSession();
		return db.query.paymentMethods.findMany({
			orderBy: [asc(paymentMethods.name)],
		});
	},
);

export const createPaymentMethod = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			name: z.string().min(1, "Name cannot be empty"),
			image: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		await requireSession();
		const paymentMethod = takeFirstOrThrow(
			await db
				.insert(paymentMethods)
				.values({ name: data.name, image: data.image })
				.returning({ id: paymentMethods.id }),
			"Error creating payment method",
		);
		return { id: paymentMethod.id };
	});

export const editPaymentMethod = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.number(),
			name: z.string(),
			image: z.string().nullish(),
		}),
	)
	.handler(async ({ data }) => {
		await requireSession();
		const paymentMethod = takeFirstOrThrow(
			await db
				.update(paymentMethods)
				.set({ name: data.name, image: data.image ?? null })
				.where(eq(paymentMethods.id, data.id))
				.returning({ id: paymentMethods.id }),
			"Error updating payment method",
		);
		return { id: paymentMethod.id };
	});

export const deletePaymentMethod = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.number() }))
	.handler(async ({ data }) => {
		await requireSession();
		await runTransaction(db, async (tx) => {
			const subs = await tx
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.paymentMethod, data.id));
			for (const sub of subs) {
				await tx
					.delete(usersToSubscriptions)
					.where(eq(usersToSubscriptions.subscriptionId, sub.id));
				await tx.delete(subscriptions).where(eq(subscriptions.id, sub.id));
			}
			await tx.delete(paymentMethods).where(eq(paymentMethods.id, data.id));
		});
		return { success: true };
	});
