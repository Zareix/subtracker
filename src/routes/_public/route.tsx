import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
	component: PublicLayout,
});

function PublicLayout() {
	return (
		<main className="flex h-full min-h-svh items-center justify-center">
			<Outlet />
		</main>
	);
}
