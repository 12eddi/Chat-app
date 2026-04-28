export const chatInclude = {
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
      status: "PENDING" as const,
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
      createdAt: "desc" as const,
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
