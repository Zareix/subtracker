import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "~/components/auth/login-form";

const searchSchema = z.object({
  redirect: z.string().optional().default("/"),
});

export const Route = createFileRoute("/_public/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <LoginForm redirect={redirect} />;
}
