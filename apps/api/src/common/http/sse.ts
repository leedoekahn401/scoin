import type { Response } from 'express';

/** Comment line that keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 15_000;

export interface SseStream {
  /** Writes one `event:`/`data:` frame; data is sent as JSON. No-op once closed. */
  send(event: string, data: unknown): void;
  /** Runs when the stream ends, whether the client left or close() was called. Remove listeners here. */
  onClose(cleanup: () => void): void;
  close(): void;
  readonly closed: boolean;
}

/**
 * Turns `res` into a Server-Sent Events stream. Call it from a route() handler after every check that
 * can fail: once the headers are sent an error can no longer become a JSON error response.
 */
export function openSse(res: Response, heartbeatMs = HEARTBEAT_MS): SseStream {
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx: do not buffer the stream
  });
  res.flushHeaders();

  const cleanups: (() => void)[] = [];
  const heartbeat = setInterval(() => res.write(': ping\n\n'), heartbeatMs);
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    for (const cleanup of cleanups) cleanup();
    res.end();
  };
  // res, not req: req 'close' fires as soon as the request body is read.
  res.on('close', close);

  return {
    send(event, data) {
      if (!closed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    onClose(cleanup) {
      cleanups.push(cleanup);
    },
    close,
    get closed() {
      return closed;
    },
  };
}
