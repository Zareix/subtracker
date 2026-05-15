import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CreateUserDialog } from "~/components/admin/users/create";
import { DeleteUserDialog } from "~/components/admin/users/delete";
import { EditUserDialog } from "~/components/admin/users/edit";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	adminCleanUpFiles,
	adminExportData,
	adminImportData,
	adminMigrateImagesToS3,
	adminUpdateExchangeRates,
} from "~/functions/admin.functions";
import { getUsers } from "~/functions/users.functions";
import { authClient } from "~/lib/auth-client";
import type { UserRole } from "~/lib/constant";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_private/admin")({
	component: AdminPage,
});

function AdminPage() {
	const session = authClient.useSession();

	const usersQuery = useQuery({
		queryKey: ["users"],
		queryFn: () => getUsers(),
	});
	const cleanUpFilesMutation = useMutation({
		mutationFn: () => adminCleanUpFiles(),
		onSuccess: () => toast.success(m.admin_misc_clean_up_files_success()),
		onError: (err) => toast.error(err.message),
	});
	const migrateToS3Mutation = useMutation({
		mutationFn: () => adminMigrateImagesToS3(),
		onSuccess: (data) =>
			toast.success(
				m.admin_misc_migrate_to_s3_success({
					subscriptions: String(data.migratedSubscriptions),
					paymentMethods: String(data.migratedPaymentMethods),
				}),
			),
		onError: (err) => toast.error(err.message),
	});
	const updateExchangeRatesMutation = useMutation({
		mutationFn: () => adminUpdateExchangeRates(),
		onSuccess: () =>
			toast.success(m.admin_misc_update_exchange_rates_success()),
		onError: (err) => toast.error(err.message),
	});
	const exportDataMutation = useMutation({
		mutationFn: () => adminExportData(),
		onSuccess: (data) => {
			const blob = new Blob([JSON.stringify(data)], {
				type: "application/json",
			});
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = "data.json";
			link.click();
			toast.success(m.admin_misc_export_data_success());
		},
		onError: (err) => toast.error(err.message),
	});
	const importDataMutation = useMutation({
		mutationFn: (data: Parameters<typeof adminImportData>[0]["data"]) =>
			adminImportData({ data }),
		onSuccess: () => toast.success(m.admin_misc_import_data_success()),
		onError: (err) => toast.error(err.message),
	});

	if (usersQuery.isError) {
		return (
			<div>
				{m.settings_error()}: {usersQuery.error?.message}
			</div>
		);
	}

	return (
		<div className="grid max-w-[100vw] items-start gap-4">
			<section>
				<header className="flex flex-wrap items-center justify-between">
					<h1 className="font-bold text-3xl">{m.admin_users_title()}</h1>
					<CreateUserDialog />
				</header>
				<div className="mt-2 max-w-[calc(100vw-2rem)]">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-17.5">
									{m.settings_form_image()}
								</TableHead>
								<TableHead className="w-25">{m.settings_form_name()}</TableHead>
								<TableHead>{m.admin_form_email()}</TableHead>
								<TableHead>{m.admin_form_role()}</TableHead>
								<TableHead className="text-end">
									{m.settings_actions_label()}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{usersQuery.isLoading && (
								<TableRow>
									<TableCell>
										<Avatar className="size-8 rounded-lg">
											<AvatarFallback className="rounded-lg">
												...
											</AvatarFallback>
										</Avatar>
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-28" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-20" />
									</TableCell>
									<TableCell />
								</TableRow>
							)}
							{usersQuery.data?.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<Avatar className="size-8 rounded-lg">
											<AvatarImage
												src={user.image ?? undefined}
												alt={user.name}
											/>
											<AvatarFallback className="rounded-lg">
												{user.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</TableCell>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell className="capitalize">{user.role}</TableCell>
									<TableCell className="flex items-center justify-end gap-2">
										{user.id !== session.data?.user.id && (
											<>
												<DeleteUserDialog user={user} />
												<EditUserDialog
													user={{ ...user, role: user.role as UserRole }}
												/>
											</>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</section>

			<section>
				<header className="flex items-center justify-between">
					<h1 className="font-bold text-3xl">{m.admin_misc_title()}</h1>
				</header>
				<div className="mt-2 flex flex-wrap items-center gap-2">
					<Button
						onClick={() => cleanUpFilesMutation.mutate()}
						disabled={cleanUpFilesMutation.isPending}
					>
						{m.admin_misc_clean_up_files()}
					</Button>
					<Button
						onClick={() => migrateToS3Mutation.mutate()}
						disabled={migrateToS3Mutation.isPending}
					>
						{m.admin_misc_migrate_to_s3()}
					</Button>
					<Button
						onClick={() => updateExchangeRatesMutation.mutate()}
						disabled={updateExchangeRatesMutation.isPending}
					>
						{m.admin_misc_update_exchange_rates()}
					</Button>
					<Button
						onClick={() => exportDataMutation.mutate()}
						disabled={exportDataMutation.isPending}
					>
						{m.admin_misc_export_data()}
					</Button>
					<div className="relative">
						<Button disabled={importDataMutation.isPending}>
							{m.admin_misc_import_data()}
						</Button>
						<Input
							className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer opacity-0 disabled:opacity-0"
							disabled={importDataMutation.isPending}
							onChange={async (e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								const text = await file.text();
								importDataMutation.mutate(
									JSON.parse(text) as Parameters<
										typeof adminImportData
									>[0]["data"],
								);
							}}
							type="file"
							accept=".json"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
