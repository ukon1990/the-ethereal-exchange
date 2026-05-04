import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { resolveBackendOrigin } from './backend-origin';

const browserDistFolder = join(import.meta.dirname, '../browser');
const backendOrigin = resolveBackendOrigin();
const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
]);

const app = express();
const angularApp = new AngularNodeAppEngine();

const requestIdHeader = 'x-request-id';

function readRequestBody(req: express.Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

app.use('/api', async (req, res, next) => {
  const proxyStart = performance.now();
  const isMarketSearchRequest =
    req.path === '/auctions/market-search' || req.path === '/auctions/market-search/filters';
  const requestId = readRequestId(req) ?? randomUUID();
  let backendHeadersMs = 0;
  let bodyReadMs = 0;

  try {
    const targetUrl = new URL(req.originalUrl, backendOrigin);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || key.toLowerCase() === 'host') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }
      } else {
        headers.set(key, value);
      }
    }
    headers.set(requestIdHeader, requestId);
    res.setHeader('X-Request-Id', requestId);

    const bodyBuffer = ['GET', 'HEAD'].includes(req.method)
      ? undefined
      : await readRequestBody(req);
    const body = bodyBuffer
      ? (bodyBuffer.buffer.slice(
          bodyBuffer.byteOffset,
          bodyBuffer.byteOffset + bodyBuffer.byteLength,
        ) as ArrayBuffer)
      : undefined;
    const backendFetchStart = performance.now();
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });
    backendHeadersMs = elapsedMs(backendFetchStart);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (hopByHopHeaders.has(key.toLowerCase())) {
        return;
      }
      res.setHeader(key, value);
    });

    if (response.body) {
      const bodyReadStart = performance.now();
      const responseBody = Buffer.from(await response.arrayBuffer());
      bodyReadMs = elapsedMs(bodyReadStart);
      const responseSendStart = performance.now();
      res.once('finish', () => {
        if (isMarketSearchRequest) {
          logMarketSearchProxyTiming({
            requestId,
            method: req.method,
            path: targetUrl.pathname,
            status: response.status,
            backendHeadersMs,
            bodyReadMs,
            responseSendMs: elapsedMs(responseSendStart),
            totalMs: elapsedMs(proxyStart),
          });
        }
      });
      res.send(responseBody);
    } else {
      const responseSendStart = performance.now();
      res.once('finish', () => {
        if (isMarketSearchRequest) {
          logMarketSearchProxyTiming({
            requestId,
            method: req.method,
            path: targetUrl.pathname,
            status: response.status,
            backendHeadersMs,
            bodyReadMs,
            responseSendMs: elapsedMs(responseSendStart),
            totalMs: elapsedMs(proxyStart),
          });
        }
      });
      res.end();
    }
  } catch (error) {
    if (isMarketSearchRequest) {
      console.error(
        `Market search proxy failed in ${elapsedMs(proxyStart)}ms (requestId=${requestId} method=${req.method} path=${req.path})`,
        error,
      );
    }
    next(error);
  }
});

function readRequestId(req: express.Request): string | null {
  const value = req.headers[requestIdHeader];
  if (Array.isArray(value)) {
    return value.find((item) => item.trim()) ?? null;
  }
  return value?.trim() || null;
}

function elapsedMs(start: number): number {
  return Math.round(performance.now() - start);
}

function logMarketSearchProxyTiming(timing: {
  requestId: string;
  method: string;
  path: string;
  status: number;
  backendHeadersMs: number;
  bodyReadMs: number;
  responseSendMs: number;
  totalMs: number;
}): void {
  console.info(
    `Market search proxy completed in ${timing.totalMs}ms ` +
      `(requestId=${timing.requestId} method=${timing.method} path=${timing.path} ` +
      `status=${timing.status} backendHeaders=${timing.backendHeadersMs}ms ` +
      `bodyRead=${timing.bodyReadMs}ms responseSend=${timing.responseSendMs}ms)`,
  );
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
