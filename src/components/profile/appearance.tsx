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

	const themes = THEMES.map((t) => ({
		value: t,
		label: (
			<div className="flex items-center gap-2">
				<ThemeIcon theme={t} />

				{m[`nav_theme_${t}`]()}
			</div>
		),
	}));

	return (
		<section>
			<h2 className="mb-4 font-bold text-2xl">{m.profile_appearance()}</h2>
			<Select
				value={theme}
				onValueChange={(value) => setTheme(value ?? "system")}
				items={themes}
			>
				<SelectTrigger className="min-w-42.5 capitalize">
					<SelectValue placeholder={m.nav_theme()} />
				</SelectTrigger>
				<SelectContent>
					{themes.map((t) => (
						<SelectItem key={t.value} value={t.value}>
							{t.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</section>
	);
};
