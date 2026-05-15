import { createServerFn } from "@tanstack/react-start";
import { getAuthSession } from "~/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		return getAuthSession();
	},
);
