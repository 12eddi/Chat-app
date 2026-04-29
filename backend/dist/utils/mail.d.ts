export declare const isMailConfigured: () => boolean;
export declare const sendPasswordResetEmail: (email: string, resetUrl: string) => Promise<boolean>;
export declare const sendEmailVerificationEmail: (email: string, verificationUrl: string) => Promise<boolean>;
export declare const sendPasswordResetEmailSafely: (email: string, resetUrl: string) => Promise<boolean>;
export declare const sendEmailVerificationEmailSafely: (email: string, verificationUrl: string) => Promise<boolean>;
//# sourceMappingURL=mail.d.ts.map