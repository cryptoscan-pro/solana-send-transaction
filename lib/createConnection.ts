import { Connection } from "@solana/web3.js";
import type {
  ConnectionConfig,
  Connection as SolanaConnection,
} from "@solana/web3.js";

export const createConnection = (
  url?: string,
  getProxy?: () => string,
  parameters: Partial<ConnectionConfig> = {},
): SolanaConnection => {
  return new Connection(url || "https://api.mainnet-beta.solana.com", {
    disableRetryOnRateLimit: true,
    wsEndpoint: "wss://api.mainnet-beta.solana.com/",
    fetch: getProxy
      ? async (input, options): Promise<Response> => {
          const processedInput =
            typeof input === "string" && input.slice(0, 2) === "//"
              ? "https:" + input
              : input;

          return fetch(processedInput, {
            ...options,
            proxy: getProxy ? getProxy() : undefined,
          });
        }
      : undefined,
    ...parameters,
  });
};
