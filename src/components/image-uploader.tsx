import { useMutation } from "@tanstack/react-query";
import { ImageUpIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
	setFileUrl: (url: string) => void;
	fileUrl?: string | null;
};

export const ImageFileUploader = ({ setFileUrl, fileUrl }: Props) => {
	const uploadFileMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const response = await fetch("/api/files", {
				method: "POST",
				body: formData,
			});
			const data = (await response.json()) as
				| { url: string }
				| { error: string };
			if (!response.ok) {
				throw new Error(
					`Failed to upload file${"error" in data ? `: ${data.error}` : ""}`,
				);
			}
			return data;
		},
		onSuccess: (data) => {
			if ("url" in data) setFileUrl(data.url);
			else toast.error(data.error);
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<div className="group relative col-span-2 grid h-16 cursor-pointer place-content-center">
			{uploadFileMutation.isPending ? (
				<LoaderCircleIcon className="size-8 animate-spin" />
			) : fileUrl ? (
				<img
					src={fileUrl}
					alt="Uploaded"
					width={64}
					height={64}
					className="size-16 object-contain"
				/>
			) : (
				<ImageUpIcon className="size-8 group-hover:text-primary" />
			)}
			<input
				type="file"
				accept="image/*"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) uploadFileMutation.mutate(file);
				}}
				className="absolute inset-0 opacity-0"
			/>
		</div>
	);
};
