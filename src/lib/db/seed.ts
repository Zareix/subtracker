import { env } from "~/env";
import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import * as schema from "./schema";

export const seed = async () => {
	console.log("Seeding database...");

	const users = await db.query.users.findMany();
	if (users.length === 0) {
		console.log("Creating admin user...");
		const res = await auth.api.createUser({
			body: {
				name: "Admin",
				email: env.ADMIN_EMAIL,
				password: "password",
				role: "admin",
			},
		});
		console.log(
			"Admin user created with id",
			res.user.id,
			"and email",
			res.user.email,
			"and default password is 'password'. Please change the password after logging in.",
		);
	}

	const cat = await db.query.categories.findMany();
	if (cat.length === 0) {
		console.log("Creating default category...");
		const insertedCatRes = await db
			.insert(schema.categories)
			.values({
				id: 1,
				name: "Misc",
				icon: "circle-ellipsis",
			})
			.returning();
		const insertedCat = insertedCatRes[0];
		if (!insertedCat) {
			throw new Error("Failed to create default category");
		}
		console.log("Default category created with id", insertedCat.id);
	}

	const pm = await db.query.paymentMethods.findMany();
	if (pm.length === 0) {
		console.log("Creating default payment method...");
		const insertedPmRes = await db
			.insert(schema.paymentMethods)
			.values({
				id: 1,
				name: "Credit Card",
			})
			.returning();
		const insertedPm = insertedPmRes[0];
		if (!insertedPm) {
			throw new Error("Failed to create default payment method");
		}
		console.log("Default payment method created with id", insertedPm.id);
	}

	console.log("Database seeded");
};
