type UpdateProfileInput = {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
};
type ChangePasswordInput = {
    userId: string;
    currentPassword: string;
    newPassword: string;
};
export declare const searchUsers: (query: string, currentUserId: string) => Promise<{
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePhotoUrl: string | null;
}[]>;
export declare const getUserDetails: (userId: string) => Promise<{
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
export declare const updateProfile: ({ userId, firstName, lastName, username, email, }: UpdateProfileInput) => Promise<{
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    username: string;
    profilePhotoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const changePassword: ({ userId, currentPassword, newPassword, }: ChangePasswordInput) => Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=users.service.d.ts.map