import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { WebSocket } from 'ws';
import { ActivityServer } from '../src/server/ActivityServer.js';

describe('ActivityServer Unit Tests', () => {
  let server: ActivityServer;
  const testPort = 3998;

  beforeAll(async () => {
    server = new ActivityServer();
    await server.start(testPort);
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should respond to HTTP health check', async () => {
    const res = await new Promise<{ status: string }>((resolve, reject) => {
      http.get(`http://localhost:${testPort}/api/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
        res.on('error', reject);
      });
    });

    expect(res.status).toBe('ok');
  });

  it('should accept WebSocket connection and respond to messages', async () => {
    const ws = new WebSocket(`ws://localhost:${testPort}`);

    const receivedMessage = await new Promise<{ type: string; guildId: string }>((resolve, reject) => {
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'JOIN_GUILD', guildId: 'test-guild-123' }));
      });

      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
        ws.close();
      });

      ws.on('error', reject);
    });

    expect(receivedMessage.type).toBe('STATE_UPDATE');
    expect(receivedMessage.guildId).toBe('test-guild-123');
  });
});
