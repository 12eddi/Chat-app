type PushPayload = {
    userId: string;
    title: string;
    body: string;
    data: Record<string, string>;
};
export declare const sendPushToUserDevices: (payload: PushPayload) => Promise<void>;
export {};
//# sourceMappingURL=push.d.ts.map