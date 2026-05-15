import { useMutation, useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { searchSubscriptionImages } from "~/functions/subscriptions.functions";
import { m } from "~/paraglide/messages";

export const ImageSearch = ({
  query,
  setFileUrl,
}: {
  query: string;
  setFileUrl: (url: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["subscription-images", query],
    queryFn: () => searchSubscriptionImages({ data: { query } }),
    enabled: enabled && !!query,
  });

  const uploadMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const formData = new FormData();
      formData.append("imageUrl", imageUrl);
      const response = await fetch("/api/files", { method: "POST", body: formData });
      const data = (await response.json()) as { url: string } | { error: string };
      if (!response.ok) throw new Error("Failed to upload");
      return data;
    },
    onSuccess: (data) => {
      if ("url" in data) {
        setFileUrl(data.url);
        setIsOpen(false);
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSearch = () => {
    if (!query) {
      toast.error(m.image_search_error());
      return;
    }
    setEnabled(true);
    setIsOpen(true);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="group hover:bg-transparent"
            onClick={handleSearch}
          >
            <SearchIcon className="size-8 group-hover:text-primary" />
          </Button>
        }
      />
      <PopoverContent align="start" className="relative grid grid-cols-4 gap-2">
        {searchQuery.data?.map((image) => (
          <Button
            key={image.imageLink}
            type="button"
            variant="ghost"
            onClick={() => uploadMutation.mutate(image.imageLink)}
            className="h-full w-full"
          >
            <img
              src={image.thumbnailLink}
              alt={image.title}
              width={64}
              height={70}
              className="max-h-17.5 max-w-16 object-contain"
            />
          </Button>
        ))}
        {searchQuery.isLoading && (
          <div className="col-span-4">{m.image_search_loading()}</div>
        )}
        {searchQuery.isError && (
          <div className="col-span-4">{m.image_search_search_error()}</div>
        )}
        {uploadMutation.isPending && (
          <div className="absolute inset-0 flex animate-in items-center justify-center bg-white/50 backdrop-blur-xs">
            {m.image_search_uploading()}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
