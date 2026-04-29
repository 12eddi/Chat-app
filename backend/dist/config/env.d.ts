import "dotenv/config";
export declare const env: {
    nodeEnv: string;
    host: string;
    port: number;
    clientUrl: string;
    clientUrls: string[];
    databaseUrl: string;
    jwtSecret: string;
    passwordResetTokenTtlMinutes: number;
    emailVerificationTokenTtlMinutes: number;
    scheduledMessagePollMs: number;
    scheduledMessageBatchSize: number;
    scheduledMessageErrorBackoffMs: number;
    runScheduledMessageProcessor: boolean;
    googleClientId: string | null;
    mail: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    } | null;
};
//# sourceMappingURL=env.d.ts.map