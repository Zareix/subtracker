import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ImageFileUploader } from "~/components/image-uploader";
import { ImageSearch } from "~/components/subscriptions/image-search";
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
	createPaymentMethod,
	editPaymentMethod,
} from "~/functions/payment-methods.functions";
import { m } from "~/paraglide/messages";

const schema = z.object({
	name: z.string().min(1),
	image: z.string().optional(),
});

type PaymentMethodItem = { id: number; name: string; image: string | null };

export const EditCreateForm = ({
	paymentMethod,
	onFinished,
}: {
	paymentMethod?: PaymentMethodItem;
	onFinished?: () => void;
}) => {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (data: z.infer<typeof schema>) => createPaymentMethod({ data }),
		onSuccess: () => {
			toast.success(m.settings_payment_methods_created());
			queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
			onFinished?.();
		},
		onError: (err) => toast.error(err.message),
	});

	const editMutation = useMutation({
		mutationFn: (data: z.infer<typeof schema> & { id: number }) =>
			editPaymentMethod({ data }),
		onSuccess: () => {
			toast.success(m.settings_payment_methods_edited());
			queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
			onFinished?.();
		},
		onError: (err) => toast.error(err.message),
	});

	const form = useForm({
		defaultValues: {
			name: paymentMethod?.name ?? "",
			image: paymentMethod?.image ?? (undefined as string | undefined),
		},
		onSubmit: async ({ value }) => {
			const parsed = schema.safeParse(value);
			if (!parsed.success) return;
			if (paymentMethod) {
				editMutation.mutate({ ...parsed.data, id: paymentMethod.id });
			} else {
				createMutation.mutate(parsed.data);
			}
		},
	});

	const isPending = createMutation.isPending || editMutation.isPending;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<div className="grid grid-cols-12 items-center gap-2">
					<form.Field name="name">
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="col-span-8"
							>
								<FieldLabel htmlFor="pm-name">
									{m.settings_form_name()}
								</FieldLabel>
								<Input
									id="pm-name"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="PayPal"
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
					</form.Field>
					<form.Field name="image">
						{(field) => (
							<ImageFileUploader
								fileUrl={field.state.value}
								setFileUrl={(url) => field.handleChange(url)}
							/>
						)}
					</form.Field>
					<form.Subscribe selector={(state) => state.values.name}>
						{(name) => (
							<form.Field name="image">
								{(field) => (
									<ImageSearch
										query={name}
										setFileUrl={(url) => field.handleChange(url)}
									/>
								)}
							</form.Field>
						)}
					</form.Subscribe>
				</div>
				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						{isPending ? "..." : m.settings_form_submit()}
					</Button>
				</DialogFooter>
			</FieldGroup>
		</form>
	);
};
