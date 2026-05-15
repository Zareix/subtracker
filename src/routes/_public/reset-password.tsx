import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordForm } from "~/components/auth/reset-password-form";

const searchSchema = z.object({
	token: z.string().optional(),
});

export const Route = createFileRoute("/_public/reset-password")({
	validateSearch: searchSchema,
	beforeLoad: ({ search }) => {
		if (!search.token) {
			throw redirect({ to: "/login" });
		}
	},
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	return <ResetPasswordForm token={token} />;
}
