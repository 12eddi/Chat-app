import { Request, Response } from "express";
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const me: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const forgotPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const completePasswordReset: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const confirmEmailVerification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resendVerification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const googleLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const googleConfig: (_req: Request, res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.controller.d.ts.map