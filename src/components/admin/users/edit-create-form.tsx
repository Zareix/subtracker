import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ImageFileUploader } from "~/components/image-uploader";
import { Button } from "~/components/ui/button";
import { DialogFooter } from "~/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { editUser } from "~/functions/users.functions";
import { authClient } from "~/lib/auth-client";
import { type UserRole, UserRoles } from "~/lib/constant";
import { m } from "~/paraglide/messages";

const schema = z.object({
	image: z.string().nullish(),
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().optional(),
	role: z.enum(UserRoles),
});

type UserItem = {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role: UserRole;
};

export const EditCreateForm = ({
	user,
	onFinished,
}: {
	user?: UserItem;
	onFinished?: () => void;
}) => {
	const queryClient = useQueryClient();
	const session = authClient.useSession();

	const createMutation = useMutation({
		mutationFn: async (data: z.infer<typeof schema>) => {
			if (!data.password || data.password.length < 8) {
				throw new Error(m.admin_users_password_min_length());
			}
			const result = await authClient.admin.createUser({
				name: data.name,
				email: data.email,
				password: data.password,
				role: data.role,
				data: { image: data.image },
			});
			if (result.error) throw new Error(result.error.message);
		},
		onSuccess: () => {
			toast.success(m.admin_users_created());
			queryClient.invalidateQueries({ queryKey: ["users"] });
			onFinished?.();
		},
		onError: (err) => toast.error(err.message),
	});

	const editMutation = useMutation({
		mutationFn: async (data: z.infer<typeof schema> & { id: string }) => {
			if (data.password && data.password.length > 0) {
				await authClient.admin.setUserPassword({
					userId: data.id,
					newPassword: data.password,
				});
			}
			if (data.role !== user?.role) {
				await authClient.admin.setRole({
					userId: data.id,
					role: data.role,
				});
			}
			await editUser({
				data: {
					id: data.id,
					name: data.name,
					email: data.email,
					image: data.image,
				},
			});
		},
		onSuccess: () => {
			toast.success(m.admin_users_edited());
			queryClient.invalidateQueries({ queryKey: ["users"] });
			onFinished?.();
		},
		onError: (err) => toast.error(err.message),
	});

	const form = useForm({
		defaultValues: {
			name: user?.name ?? "",
			email: user?.email ?? "",
			image: user?.image ?? (undefined as string | null | undefined),
			password: "",
			role: (user?.role ?? "user") as UserRole,
		},
		validators: {
			onSubmit: schema,
		},
		onSubmit: async ({ value }) => {
			if (user) {
				editMutation.mutate({ ...value, id: user.id });
			} else {
				createMutation.mutate(value);
			}
		},
	});

	const isPending = createMutation.isPending || editMutation.isPending;
	const isCurrentUser = session.data?.user.id === user?.id;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<div className="grid grid-cols-12 gap-2">
					<form.Field name="image">
						{(field) => (
							<ImageFileUploader
								fileUrl={field.state.value ?? undefined}
								setFileUrl={(url) => field.handleChange(url)}
							/>
						)}
					</form.Field>
					<form.Field name="name">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid} className="col-span-10">
									<FieldLabel htmlFor="user-name">
										{m.settings_form_name()}
									</FieldLabel>
									<Input
										id="user-name"
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										placeholder="Raphael"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</div>
				<form.Field name="email">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="user-email">
									{m.admin_form_email()}
								</FieldLabel>
								<Input
									id="user-email"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="raphael@example.com"
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
				<form.Field name="password">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="user-password">
									{m.admin_form_password()}
								</FieldLabel>
								<Input
									id="user-password"
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="***"
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
				<form.Field name="role">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="user-role">
									{m.admin_form_role()}
								</FieldLabel>
								<Select
									name={field.name}
									value={field.state.value}
									onValueChange={(v) => field.handleChange(v as UserRole)}
									disabled={isCurrentUser}
								>
									<SelectTrigger
										id="user-role"
										aria-invalid={isInvalid}
										className="min-w-42.5 capitalize"
									>
										<SelectValue placeholder={m.admin_form_select_role()} />
									</SelectTrigger>
									<SelectContent>
										{UserRoles.map((role) => (
											<SelectItem
												value={role}
												key={role}
												className="capitalize"
											>
												{role}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						{isPending ? "..." : m.settings_form_submit()}
					</Button>
				</DialogFooter>
			</FieldGroup>
		</form>
	);
};
