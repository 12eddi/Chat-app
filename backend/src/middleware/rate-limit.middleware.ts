import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

type Entry = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, Entry>>();

const getClientKey = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return forwardedIp?.trim() || req.ip || "unknown";
};

export const createRateLimit = ({
  windowMs,
  maxRequests,
  message,
}: RateLimitOptions) => {
  const storeKey = `${windowMs}:${maxRequests}:${message}`;

  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map<string, Entry>());
  }

  const store = stores.get(storeKey)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const clientKey = `${req.method}:${req.path}:${getClientKey(req)}`;
    const currentEntry = store.get(clientKey);

    if (!currentEntry || currentEntry.resetAt <= now) {
      store.set(clientKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    currentEntry.count += 1;

    if (currentEntry.count > maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((currentEntry.resetAt - now) / 1000)
      );

      res.setHeader("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        message,
      });
    }

    return next();
  };
};
