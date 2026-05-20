import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ImageFileUploader } from "~/components/image-uploader";
import { Button } from "~/components/ui/button";
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
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

const schema = z.object({
	id: z.string(),
	name: z.string().min(1),
	email: z.string().email(),
	image: z.string().nullish(),
});

type Props = {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		role: string;
	};
};

export const UserInfoForm = ({ user }: Props) => {
	const queryClient = useQueryClient();

	const editMutation = useMutation({
		mutationFn: async (data: z.infer<typeof schema>) => {
			const results = await Promise.all([
				data.email !== user.email
					? authClient.changeEmail({ newEmail: data.email })
					: Promise.resolve(null),
				authClient.updateUser({ name: data.name, image: data.image }),
			]);
			return results;
		},
		onSuccess: ([emailResult, updateResult]) => {
			if (emailResult?.error) {
				toast.error(emailResult.error.message ?? "Failed to change email");
				return;
			}
			if (updateResult?.error) {
				toast.error(updateResult.error.message ?? "Failed to update profile");
				return;
			}
			toast.success(m.profile_info_updated_success());
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (err) => toast.error(err.message),
	});

	const form = useForm({
		defaultValues: {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image ?? (undefined as string | null | undefined),
		},
		validators: {
			onSubmit: schema,
		},
		onSubmit: async ({ value }) => {
			editMutation.mutate(value);
		},
	});

	return (
		<section>
			<h2 className="mb-4 font-bold text-2xl">{m.profile_info_title()}</h2>
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
										<FieldLabel htmlFor="profile-name">
											{m.settings_form_name()}
										</FieldLabel>
										<Input
											id="profile-name"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Your name"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
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
									<FieldLabel htmlFor="profile-email">
										{m.admin_form_email()}
									</FieldLabel>
									<Input
										id="profile-email"
										name={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										placeholder="your.email@example.com"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
					<Field>
						<FieldLabel htmlFor="profile-role">
							{m.admin_form_role()}
						</FieldLabel>
						<Select value={user.role ?? "user"} disabled>
							<SelectTrigger id="profile-role" className="capitalize">
								<SelectValue placeholder={m.admin_form_role()} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={user.role ?? "user"} className="capitalize">
									{user.role}
								</SelectItem>
							</SelectContent>
						</Select>
					</Field>
					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={editMutation.isPending}
							className="w-full sm:w-auto"
						>
							{editMutation.isPending
								? m.profile_info_updating()
								: m.profile_info_update()}
						</Button>
					</div>
				</FieldGroup>
			</form>
		</section>
	);
};
