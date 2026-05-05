export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Chats: undefined;
  Chat: {
    chatId: string;
    title: string;
  };
  Profile: undefined;
};
