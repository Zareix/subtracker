import { createFileRoute } from "@tanstack/react-router";
import { isAuthenticated } from "~/lib/auth";
import { getFileFromStorage, saveFile } from "~/lib/services/files";

const compressImage = async (blob: Blob): Promise<Blob> => {
	if (blob.type.startsWith("image/svg+xml")) {
		return blob;
	}
	return await new Bun.Image(blob)
		.resize(128, 128, { fit: "inside" })
		.png({ compressionLevel: 6 })
		.blob();
};

export const Route = createFileRoute("/api/files")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const filename = new URL(request.url).searchParams.get("filename");
					const file = await getFileFromStorage(filename);

					if (!file) {
						return Response.json({ error: "File not found" }, { status: 404 });
					}
					if (typeof file === "string") {
						return Response.redirect(file);
					}
					return new Response(await file.arrayBuffer(), {
						headers: {
							"Content-Type": file.type,
							"Content-Disposition": `inline; filename="${filename}"`,
						},
					});
				} catch {
					return Response.json({ error: "File not found" }, { status: 404 });
				}
			},

			POST: async ({ request }) => {
				if (!(await isAuthenticated())) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				try {
					const formData = await request.formData();

					if (!formData.has("file") && !formData.has("imageUrl")) {
						return Response.json(
							{ error: "No file or image URL provided" },
							{ status: 400 },
						);
					}

					if (formData.has("imageUrl")) {
						const imageUrl = formData.get("imageUrl") as string;
						if (!imageUrl) {
							return Response.json(
								{ error: "Image URL is required" },
								{ status: 400 },
							);
						}
						const response = await fetch(imageUrl);
						if (!response.ok) {
							return Response.json(
								{ error: "Error fetching image from URL" },
								{ status: 400 },
							);
						}
						const blob = await response.blob();
						const contentType = response.headers.get("Content-Type");
						if (!contentType?.startsWith("image/")) {
							return Response.json(
								{ error: "Invalid image URL" },
								{ status: 400 },
							);
						}
						const compressed = await compressImage(blob);
						formData.set(
							"file",
							new File([compressed], `image.${contentType.split("/")[1]}`, {
								type: contentType,
							}),
						);
					}

					const file = formData.get("file");
					if (!(file instanceof File)) {
						return Response.json(
							{ error: "Invalid file type" },
							{ status: 400 },
						);
					}

					let fileToSave: File = file;

					if (file.type.startsWith("image/")) {
						const compressed = await compressImage(file);
						fileToSave = new File(
							[compressed],
							file.name.replace(/\.[^/.]+$/, ".png"),
							{
								type: "image/png",
							},
						);
					}

					const url = await saveFile(fileToSave);
					if (!url) {
						return Response.json(
							{ error: "Error uploading file" },
							{ status: 500 },
						);
					}

					return Response.json({ url }, { status: 200 });
				} catch (e) {
					console.error("Error uploading file:", e);
					return Response.json(
						{ error: "Error uploading file" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
