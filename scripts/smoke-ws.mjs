#!/usr/bin/env node
/** WebSocket subscribe smoke for deployed Trellis room node. */
import { trellisEnv } from './trellis-config.mjs';

const { base, apiKey } = trellisEnv();

if (!base) {
  console.error('Missing TRELLIS_URL or .trellis-db.json');
  process.exit(1);
}

const wsUrl = `${base.replace(/^http/, 'ws')}/realtime${apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ''}`;

await new Promise((resolvePromise, reject) => {
  const timeout = setTimeout(() => {
    ws.close();
    reject(new Error('WS smoke timed out'));
  }, 15_000);

  const ws = new WebSocket(wsUrl);
  ws.addEventListener('open', () => {
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        id: 'smoke_1',
        query: 'find ?e where type = KanbanCard',
      }),
    );
  });
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.type === 'data' || msg.type === 'subscribed') {
      clearTimeout(timeout);
      console.log('WS subscribe OK:', msg.type);
      ws.close();
      resolvePromise();
    }
    if (msg.type === 'error') {
      clearTimeout(timeout);
      reject(new Error(msg.message ?? 'WS error'));
    }
  });
  ws.addEventListener('error', () => {
    clearTimeout(timeout);
    reject(new Error('WebSocket connection failed'));
  });
});

console.log('WS smoke passed');
