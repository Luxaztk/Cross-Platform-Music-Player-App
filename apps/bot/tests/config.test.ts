import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/config/env.js';

describe('Bot Config Loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws an error if DISCORD_TOKEN is missing', () => {
    delete process.env.DISCORD_TOKEN;
    process.env.CLIENT_ID = '123456789';

    expect(() => loadConfig()).toThrowError(/Thiếu DISCORD_TOKEN/);
  });

  it('throws an error if CLIENT_ID is missing', () => {
    process.env.DISCORD_TOKEN = 'test_token';
    delete process.env.CLIENT_ID;

    expect(() => loadConfig()).toThrowError(/Thiếu CLIENT_ID/);
  });

  it('loads valid configuration successfully', () => {
    process.env.DISCORD_TOKEN = 'valid_token_123';
    process.env.CLIENT_ID = '987654321';
    process.env.GUILD_ID = '1122334455';
    process.env.DEFAULT_VOLUME = '80';
    process.env.MAX_QUEUE_SIZE = '200';

    const config = loadConfig();

    expect(config.token).toBe('valid_token_123');
    expect(config.clientId).toBe('987654321');
    expect(config.guildId).toBe('1122334455');
    expect(config.defaultVolume).toBe(80);
    expect(config.maxQueueSize).toBe(200);
  });

  it('clamps defaultVolume between 0 and 150', () => {
    process.env.DISCORD_TOKEN = 'valid_token_123';
    process.env.CLIENT_ID = '987654321';
    process.env.DEFAULT_VOLUME = '250';

    const config = loadConfig();
    expect(config.defaultVolume).toBe(150);
  });
});
