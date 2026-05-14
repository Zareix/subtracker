import { createFileRoute } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">{m.home_page()}</h1>
		</div>
	);
}
