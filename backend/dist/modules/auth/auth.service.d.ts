type RegisterInput = {
    firstName: string;
    lastName: string;
    birthDate?: string;
    email: string;
    username: string;
    password: string;
};
export declare const registerUser: (data: RegisterInput) => Promise<{
    user: {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        birthDate: Date | null;
        username: string;
        profilePhotoUrl: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    verificationUrl: string;
}>;
export declare const loginUser: (identifier: string, password: string) => Promise<{
    token: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        birthDate: Date | null;
        username: string;
        email: string;
        profilePhotoUrl: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const getCurrentUser: (userId: string) => Promise<{
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    username: string;
    profilePhotoUrl: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const loginWithGoogle: (idToken: string) => Promise<{
    token: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        birthDate: Date | null;
        username: string;
        email: string;
        profilePhotoUrl: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const requestPasswordReset: (email: string) => Promise<{
    message: string;
    resetUrl?: never;
} | {
    message: string;
    resetUrl: string;
}>;
export declare const resetPassword: (token: string, newPassword: string) => Promise<{
    message: string;
}>;
export declare const verifyEmail: (token: string) => Promise<{
    message: string;
}>;
export declare const resendVerificationEmail: (email: string) => Promise<{
    message: string;
    verificationUrl?: never;
} | {
    message: string;
    verificationUrl: string;
}>;
export {};
//# sourceMappingURL=auth.service.d.ts.map