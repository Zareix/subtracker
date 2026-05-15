import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ApiKeys } from "~/components/profile/api-keys";
import { Button } from "~/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1),
		newPassword: z.string().min(8),
		confirmPassword: z.string().min(1),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "no_match",
		path: ["confirmPassword"],
	});

const passkeySchema = z.object({ name: z.string().min(1) });

type Props = { userId: string };

export const CredentialsForm = ({ userId }: Props) => {
	const queryClient = useQueryClient();

	const changePasswordMutation = useMutation({
		mutationFn: (data: z.infer<typeof passwordSchema>) =>
			authClient.changePassword({
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
			}),
		onSuccess: () => {
			toast.success(m.profile_password_changed_success());
			passwordForm.reset();
		},
		onError: (err) => toast.error(err.message),
	});

	const registerPasskeyMutation = useMutation({
		mutationFn: (data: z.infer<typeof passkeySchema>) =>
			authClient.passkey.addPasskey({ name: data.name }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["passkeys", userId] });
			passkeyForm.reset();
			toast.success(m.profile_passkey_registered_success());
		},
		onError: (err) => toast.error(err.message),
	});

	const removePasskeyMutation = useMutation({
		mutationFn: (passkeyId: string) =>
			authClient.passkey.deletePasskey({ id: passkeyId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["passkeys", userId] });
			toast.success(m.profile_passkey_removed_success());
		},
		onError: (err) => toast.error(err.message),
	});

	const passKeysQuery = useQuery({
		queryKey: ["passkeys", userId],
		queryFn: () => authClient.passkey.listUserPasskeys(),
		select: (data) => data.data,
	});

	const passwordForm = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			const parsed = passwordSchema.safeParse(value);
			if (!parsed.success) {
				const confirmErr = parsed.error.flatten().fieldErrors.confirmPassword;
				if (confirmErr?.includes("no_match")) {
					toast.error(m.profile_password_no_match());
				}
				return;
			}
			changePasswordMutation.mutate(parsed.data);
		},
	});

	const passkeyForm = useForm({
		defaultValues: { name: "" },
		onSubmit: async ({ value }) => {
			const parsed = passkeySchema.safeParse(value);
			if (!parsed.success) return;
			registerPasskeyMutation.mutate(parsed.data);
		},
	});

	return (
		<section>
			<h2 className="mb-4 font-bold text-2xl">{m.profile_credentials()}</h2>
			<div>
				<h3 className="mb-2 font-semibold text-lg">
					{m.profile_passkey_title()}
				</h3>
				{passKeysQuery.isLoading ? (
					<p>{m.profile_passkey_loading()}</p>
				) : !passKeysQuery.data ||
					passKeysQuery.isError ||
					passKeysQuery.data.length === 0 ? (
					<p className="text-muted-foreground">
						{m.profile_passkey_no_registered()}
					</p>
				) : (
					<ul>
						{passKeysQuery.data.map((passkey) => (
							<li
								key={passkey.id}
								className="flex items-center gap-2 rounded-lg border px-4 py-2"
							>
								<span className="font-medium">{passkey.name}</span>
								<span className="text-muted-foreground text-xs">
									{m.common_created_on({
										date: new Date(passkey.createdAt).toLocaleDateString(),
									})}
								</span>
								<Button
									variant="ghost"
									className="ml-auto"
									size="icon"
									onClick={() => removePasskeyMutation.mutate(passkey.id)}
									disabled={removePasskeyMutation.isPending}
								>
									{removePasskeyMutation.isPending ? (
										<LoaderCircleIcon className="animate-spin" size={20} />
									) : (
										<TrashIcon size={20} className="text-destructive" />
									)}
								</Button>
							</li>
						))}
					</ul>
				)}
				<form
					className="mt-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						passkeyForm.handleSubmit();
					}}
				>
					<FieldGroup>
						<passkeyForm.Field name="name">
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor="passkey-name">
										{m.profile_passkey_name()}
									</FieldLabel>
									<Input
										id="passkey-name"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={m.profile_passkey_placeholder()}
									/>
									{field.state.meta.errors.length > 0 && (
										<FieldError
											errors={field.state.meta.errors.map((e) => ({
												message: String(e),
											}))}
										/>
									)}
								</Field>
							)}
						</passkeyForm.Field>
						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={registerPasskeyMutation.isPending}
							>
								{m.profile_passkey_register()}
							</Button>
						</div>
					</FieldGroup>
				</form>
			</div>

			<Separator className="my-8" />
			<ApiKeys userId={userId} />
			<Separator className="my-8" />

			<h3 className="font-semibold text-lg">{m.profile_password_change()}</h3>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					passwordForm.handleSubmit();
				}}
			>
				<FieldGroup>
					<passwordForm.Field name="currentPassword">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor="password-current">
									{m.profile_password_current()}
								</FieldLabel>
								<Input
									id="password-current"
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.profile_password_current_placeholder()}
									autoComplete="current-password"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: String(e),
										}))}
									/>
								)}
							</Field>
						)}
					</passwordForm.Field>
					<passwordForm.Field name="newPassword">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor="password-new">
									{m.profile_password_new()}
								</FieldLabel>
								<Input
									id="password-new"
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.profile_password_new_placeholder()}
									autoComplete="new-password"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: String(e),
										}))}
									/>
								)}
							</Field>
						)}
					</passwordForm.Field>
					<passwordForm.Field name="confirmPassword">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor="password-confirm">
									{m.profile_password_confirm()}
								</FieldLabel>
								<Input
									id="password-confirm"
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.profile_password_confirm_placeholder()}
									autoComplete="new-password"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: String(e),
										}))}
									/>
								)}
							</Field>
						)}
					</passwordForm.Field>
					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={changePasswordMutation.isPending}
							className="w-full sm:w-auto"
						>
							{changePasswordMutation.isPending
								? m.profile_password_changing()
								: m.profile_password_change()}
						</Button>
					</div>
				</FieldGroup>
			</form>
		</section>
	);
};
