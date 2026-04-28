import type { NextFunction, Request, Response } from "express";
type RateLimitOptions = {
    windowMs: number;
    maxRequests: number;
    message: string;
};
export declare const createRateLimit: ({ windowMs, maxRequests, message, }: RateLimitOptions) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=rate-limit.middleware.d.ts.map