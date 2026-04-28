import { Request, Response } from "express";
export declare const createDirectChat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const fetchChats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const fetchInvites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addParticipants: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateGroupDetailsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptInvite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectInvite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const changeParticipantRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeParticipant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const leaveGroupController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chats.controller.d.ts.map