import { describe, it, expect, vi } from 'vitest';
import { createConnection } from '../lib/createConnection';
import { Connection } from '@solana/web3.js';

// Mock fetch for proxy testing
global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

describe('createConnection', () => {
  it('should create a connection with default parameters', () => {
    const connection = createConnection();
    expect(connection).toBeInstanceOf(Connection);
    expect(connection._rpcEndpoint).toBe("https://api.mainnet-beta.solana.com");
    expect(connection._config.wsEndpoint).toBe("wss://api.mainnet-beta.solana.com/");
    expect(connection._config.disableRetryOnRateLimit).toBe(true);
  });

  it('should create a connection with a custom URL', () => {
    const customUrl = "https://custom.rpc.endpoint";
    const connection = createConnection(customUrl);
    expect(connection).toBeInstanceOf(Connection);
    expect(connection._rpcEndpoint).toBe(customUrl);
  });

  it('should create a connection with a custom proxy', async () => {
    const customProxy = "https://custom.proxy";
    const getProxy = () => customProxy;
    const connection = createConnection(undefined, getProxy);

    // Ensure fetch is called with the proxy
    await connection._rpcRequest("getVersion", []);
    expect(global.fetch).toHaveBeenCalled();
    const fetchCallArgs = global.fetch.mock.calls[0];
    expect(fetchCallArgs[1].proxy).toBe(customProxy);
  });

  it('should create a connection with additional connection config parameters', () => {
    const params = { httpHeaders: { 'Custom-Header': 'value' } };
    const connection = createConnection(undefined, undefined, params);
    expect(connection._config.httpHeaders).toEqual(params.httpHeaders);
  });
});
