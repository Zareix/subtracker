import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar, Navbar } from "~/components/nav";
import { getSession } from "~/functions/session.functions";

export const Route = createFileRoute("/_private")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: PrivateLayout,
});

function PrivateLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main
        className="container relative mx-auto min-h-screen bg-background px-4 pt-8 pb-20 xl:max-w-5xl"
        data-vaul-drawer-wrapper
      >
        <Outlet />
      </main>
      <Navbar />
    </div>
  );
}
