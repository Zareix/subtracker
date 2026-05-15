import { useTheme } from "next-themes";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { THEMES, ThemeIcon } from "~/components/ui/theme-provider";
import { m } from "~/paraglide/messages";

export const AppearanceSettings = () => {
	const { setTheme, theme } = useTheme();

	return (
		<section>
			<h2 className="mb-4 font-bold text-2xl">{m.profile_appearance()}</h2>
			<Select
				value={theme}
				onValueChange={(value) => setTheme(value ?? "system")}
			>
				<SelectTrigger className="min-w-42.5 capitalize">
					<SelectValue placeholder={m.nav_theme()} />
				</SelectTrigger>
				<SelectContent>
					{THEMES.map((t) => (
						<SelectItem key={t} value={t}>
							<div className="flex items-center gap-2">
								<ThemeIcon theme={t} />
								{t === "light"
									? m.nav_theme_light()
									: t === "dark"
										? m.nav_theme_dark()
										: m.nav_theme_system()}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</section>
	);
};
