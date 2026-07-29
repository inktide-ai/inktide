// Minimal SignalR JSON hub protocol client over k6's native WebSocket API.
// No xk6 extension needed: the JSON protocol is text frames separated by
// \x1e, and ASP.NET Core SignalR accepts protocol-speaking WebSocket clients
// without the negotiate handshake.
//
// Protocol messages handled:
//   handshake  {protocol:'json',version:1} → first reply frame {} (or {error})
//   type 1     invocation (client→server invoke / server→client event)
//   type 3     completion (matched to pending invokes by invocationId)
//   type 6     ping (we answer and also ping proactively — the server's
//              default client timeout is 30s; soak runs die without this)
//   type 7     close
//
// This is the single import site for k6's websockets module — if the import
// path ever moves again, only this file changes.

import { WebSocket } from 'k6/websockets';
import { setInterval, clearInterval, setTimeout, clearTimeout } from 'k6/timers';

const SEP = '\u001e'; // SignalR record separator
const PING_INTERVAL_MS = 15_000;

class SignalRClient {
  constructor(ws) {
    this.ws = ws;
    this.handlers = {};
    this.pending = {};
    this.seq = 0;
    this.pingTimer = null;
    this.closed = false;
    this.onError = null;
  }

  on(target, fn) {
    this.handlers[target] = fn;
  }

  off(target) {
    delete this.handlers[target];
  }

  invoke(target, args, timeoutMs = 10_000) {
    return new Promise((resolve, reject) => {
      const id = String(++this.seq);
      const timer = setTimeout(() => {
        delete this.pending[id];
        reject(new Error(`invoke ${target} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending[id] = {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      };
      this.ws.send(JSON.stringify({ type: 1, invocationId: id, target, arguments: args }) + SEP);
    });
  }

  close() {
    this.closed = true;
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    try { this.ws.close(); } catch (_) { /* already closed */ }
  }

  _dispatch(msg) {
    switch (msg.type) {
      case 1: { // server → client event
        const h = this.handlers[msg.target];
        if (h) h.apply(null, msg.arguments || []);
        break;
      }
      case 3: { // completion for a pending invoke
        const p = this.pending[msg.invocationId];
        if (p) {
          delete this.pending[msg.invocationId];
          msg.error ? p.reject(new Error(msg.error)) : p.resolve(msg.result);
        }
        break;
      }
      case 6: // server ping — reply to be safe with server-side timeouts
        this.ws.send(JSON.stringify({ type: 6 }) + SEP);
        break;
      case 7: // server-initiated close
        if (msg.error && this.onError) this.onError(new Error(msg.error));
        this.close();
        break;
      default:
        break;
    }
  }
}

// Connects and completes the hub handshake. Resolves with a SignalRClient,
// rejects on WS error / handshake error / timeout.
export function connectHub(url, { handshakeTimeoutMs = 10_000 } = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const client = new SignalRClient(ws);
    let handshakeDone = false;

    const timer = setTimeout(() => {
      if (!handshakeDone) {
        handshakeDone = true;
        client.close();
        reject(new Error(`hub handshake timed out after ${handshakeTimeoutMs}ms`));
      }
    }, handshakeTimeoutMs);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + SEP);
    });

    ws.addEventListener('message', (e) => {
      for (const frame of String(e.data).split(SEP)) {
        if (!frame) continue;
        const msg = JSON.parse(frame);
        if (!handshakeDone) {
          handshakeDone = true;
          clearTimeout(timer);
          if (msg.error) {
            client.close();
            reject(new Error(`hub handshake rejected: ${msg.error}`));
            return;
          }
          client.pingTimer = setInterval(() => {
            if (!client.closed) {
              try { ws.send(JSON.stringify({ type: 6 }) + SEP); } catch (_) { /* closing */ }
            }
          }, PING_INTERVAL_MS);
          resolve(client);
          continue;
        }
        client._dispatch(msg);
      }
    });

    ws.addEventListener('error', (e) => {
      if (!handshakeDone) {
        handshakeDone = true;
        clearTimeout(timer);
        reject(new Error(`ws error: ${e.error || 'unknown'}`));
      } else if (client.onError && !client.closed) {
        // Errors after an intentional close() are teardown noise, not failures.
        client.onError(new Error(`ws error: ${e.error || 'unknown'}`));
      }
    });

    ws.addEventListener('close', () => {
      client.closed = true;
      if (client.pingTimer !== null) clearInterval(client.pingTimer);
    });
  });
}
