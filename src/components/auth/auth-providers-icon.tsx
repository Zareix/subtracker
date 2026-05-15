import { useState } from "react";

export function AuthProvidersIcon({ providerId }: { providerId: string }) {
	const [error, setError] = useState(false);

	if (error) return null;

	return (
		<img
			alt={`${providerId} icon`}
			width={16}
			height={16}
			src={`https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/${providerId.replace("oauth-", "").toLowerCase()}.webp`}
			onError={() => setError(true)}
		/>
	);
}
