import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "~/functions/session.functions";

export const Route = createFileRoute("/_public")({
	beforeLoad: async () => {
		const session = await getSession();
		if (session) {
			throw redirect({ to: "/" });
		}
	},
	component: PublicLayout,
});

function PublicLayout() {
	return (
		<main className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
			<Outlet />
		</main>
	);
}
