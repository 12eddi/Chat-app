import { Request, Response } from "express";
export declare const createMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const fetchMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateScheduledMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelScheduledMessageController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reactToMessageController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=messages.controller.d.ts.map