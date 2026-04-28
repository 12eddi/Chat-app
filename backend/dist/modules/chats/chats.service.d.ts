export declare const getOrCreateDirectChat: (currentUserId: string, targetUserId: string) => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const getUserChats: (currentUserId: string) => Promise<({
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
})[]>;
export declare const getPendingGroupInvites: (currentUserId: string) => Promise<({
    chat: {
        id: string;
        name: string | null;
        type: string;
    };
    invitedBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        profilePhotoUrl: string | null;
    };
} & {
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    chatId: string;
    invitedById: string;
    status: import("@prisma/client").$Enums.GroupInviteStatus;
})[]>;
export declare const createGroupChat: (currentUserId: string, name: string, memberIds: string[]) => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const updateGroupDetails: (chatId: string, currentUserId: string, input: {
    name?: string;
    photoUrl?: string | null;
}) => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const inviteGroupParticipants: (chatId: string, currentUserId: string, memberIds: string[]) => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const acceptGroupInvite: (inviteId: string, currentUserId: string) => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const rejectGroupInvite: (inviteId: string, currentUserId: string) => Promise<string>;
export declare const updateParticipantRole: (chatId: string, actorUserId: string, participantId: string, role: "MEMBER" | "ADMIN") => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const removeGroupMember: (chatId: string, actorUserId: string, participantId: string) => Promise<{
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}>;
export declare const leaveGroup: (chatId: string, currentUserId: string) => Promise<({
    participants: ({
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
    } & {
        userId: string;
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        joinedAt: Date;
        chatId: string;
    })[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    } | null;
    invites: ({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        invitedBy: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        invitedById: string;
        status: import("@prisma/client").$Enums.GroupInviteStatus;
    })[];
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
    type: string;
    photoUrl: string | null;
    createdById: string | null;
}) | null>;
//# sourceMappingURL=chats.service.d.ts.map