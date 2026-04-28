"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatInclude = void 0;
exports.chatInclude = {
    createdBy: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
        },
    },
    participants: {
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    profilePhotoUrl: true,
                    birthDate: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    },
    invites: {
        where: {
            status: "PENDING",
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    profilePhotoUrl: true,
                },
            },
            invitedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePhotoUrl: true,
                },
            },
        },
    },
    messages: {
        where: {
            OR: [
                {
                    sentAt: {
                        not: null,
                    },
                },
                {
                    scheduledFor: null,
                },
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 1,
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePhotoUrl: true,
                },
            },
        },
    },
};
//# sourceMappingURL=chat.select.js.map