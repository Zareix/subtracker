import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AppSidebar, Navbar } from "~/components/nav";
import { SCHEDULES, SORTS } from "~/lib/constant";
import { getSession } from "~/functions/session.functions";
import { SidebarProvider } from "~/components/ui/sidebar";

const searchSchema = z.object({
  schedule: z.enum(SCHEDULES).optional(),
  paymentMethods: z.array(z.number()).optional(),
  users: z.string().optional(),
  categories: z.array(z.number()).optional(),
  search: z.string().optional(),
  sort: z.enum(SORTS.map((s) => s.key) as [string, ...string[]]).optional(),
});

export const Route = createFileRoute("/_private")({
  validateSearch: searchSchema,
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
    <SidebarProvider>
      <AppSidebar />
      <main
        className="container relative mx-auto min-h-screen bg-background px-4 pt-8 pb-20 xl:max-w-5xl"
        data-vaul-drawer-wrapper
      >
        <Outlet />
      </main>
      <Navbar />
    </SidebarProvider>
  );
}
