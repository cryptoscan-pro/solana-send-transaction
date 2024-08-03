import { describe, it, expect, vi } from "vitest";
import { createConnection } from "../lib/createConnection";
import { Connection } from "@solana/web3.js";

// Mock fetch for proxy testing
const fetch = vi.fn(
  () => Promise.resolve({ json: () => Promise.resolve({}) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any;

describe("createConnection", () => {
  it("should create a connection with default parameters", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection: any = createConnection();
    expect(connection).toBeInstanceOf(Connection);
    expect(connection._rpcEndpoint).toBe("https://api.mainnet-beta.solana.com");
    expect(connection._config.wsEndpoint).toBe(
      "wss://api.mainnet-beta.solana.com/",
    );
    expect(connection._config.disableRetryOnRateLimit).toBe(true);
  });

  it("should create a connection with a custom URL", () => {
    const customUrl = "https://custom.rpc.endpoint";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection: any = createConnection(customUrl);
    expect(connection).toBeInstanceOf(Connection);
    expect(connection._rpcEndpoint).toBe(customUrl);
  });

  it("should create a connection with a custom proxy", async () => {
    const customProxy = "https://custom.proxy";
    const getProxy = () => customProxy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection: any = createConnection(undefined, getProxy);

    // Ensure fetch is called with the proxy
    await connection._rpcRequest("getVersion", []);
    expect(global.fetch).toHaveBeenCalled();
    const fetchCallArguments = fetch.mock.calls[0];
    expect(fetchCallArguments[1].proxy).toBe(customProxy);
  });

  it("should create a connection with additional connection config parameters", () => {
    const parameters = { httpHeaders: { "Custom-Header": "value" } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection: any = createConnection(undefined, undefined, parameters);
    expect(connection._config.httpHeaders).toEqual(parameters.httpHeaders);
  });
});
