type GoogleTokenInfo = {
    sub: string;
    email: string;
    email_verified: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    aud: string;
};
export declare const verifyGoogleIdToken: (idToken: string) => Promise<GoogleTokenInfo>;
export {};
//# sourceMappingURL=google.d.ts.map