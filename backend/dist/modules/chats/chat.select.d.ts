export declare const chatInclude: {
    createdBy: {
        select: {
            id: boolean;
            firstName: boolean;
            lastName: boolean;
            username: boolean;
        };
    };
    participants: {
        include: {
            user: {
                select: {
                    id: boolean;
                    firstName: boolean;
                    lastName: boolean;
                    username: boolean;
                    email: boolean;
                    profilePhotoUrl: boolean;
                    birthDate: boolean;
                    emailVerified: boolean;
                    createdAt: boolean;
                    updatedAt: boolean;
                };
            };
        };
    };
    invites: {
        where: {
            status: "PENDING";
        };
        include: {
            user: {
                select: {
                    id: boolean;
                    firstName: boolean;
                    lastName: boolean;
                    username: boolean;
                    email: boolean;
                    profilePhotoUrl: boolean;
                };
            };
            invitedBy: {
                select: {
                    id: boolean;
                    firstName: boolean;
                    lastName: boolean;
                    username: boolean;
                    profilePhotoUrl: boolean;
                };
            };
        };
    };
    messages: {
        where: {
            OR: ({
                sentAt: {
                    not: null;
                };
                scheduledFor?: never;
            } | {
                scheduledFor: null;
                sentAt?: never;
            })[];
        };
        orderBy: {
            createdAt: "desc";
        };
        take: number;
        include: {
            sender: {
                select: {
                    id: boolean;
                    firstName: boolean;
                    lastName: boolean;
                    username: boolean;
                    profilePhotoUrl: boolean;
                };
            };
        };
    };
};
//# sourceMappingURL=chat.select.d.ts.map