import { Connection } from "@solana/web3.js";
import type { ConnectionConfig, Connection as TConnection } from "@solana/web3.js";

export const createConnection = (url?: string, getProxy?: () => string, params: Partial<ConnectionConfig> = {}): TConnection => {
	return new Connection(url || "https://api.mainnet-beta.solana.com", {
		disableRetryOnRateLimit: true,
		wsEndpoint: 'wss://api.mainnet-beta.solana.com/',
		fetch: getProxy ? async (input: any, options: any): Promise<Response> => {
			const processedInput = typeof input === 'string' && input.slice(0, 2) === '//'
				? 'https:' + input
				: input;

			return fetch(processedInput, {
				...options,
				proxy: getProxy ? getProxy() : undefined,
			})
		} : undefined,
		...params,
	});
}
