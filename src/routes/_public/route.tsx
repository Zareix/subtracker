import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
	component: PublicLayout,
});

function PublicLayout() {
	return (
		<main className="container relative mx-auto min-h-screen bg-background px-4 pt-8 pb-20 xl:max-w-5xl">
			<Outlet />
		</main>
	);
}
