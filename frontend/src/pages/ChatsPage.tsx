import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  acceptGroupInviteRequest,
  addGroupParticipantsRequest,
  cancelScheduledMessageRequest,
  createGroupChatRequest,
  createDirectChatRequest,
  deleteMessageRequest,
  getChatsRequest,
  getGroupInvitesRequest,
  getMessagesRequest,
  getChatMediaRequest,
  leaveGroupRequest,
  reactToMessageRequest,
  rejectGroupInviteRequest,
  removeGroupParticipantRequest,
  sendMessageRequest,
  updateGroupDetailsRequest,
  updateScheduledMessageRequest,
  updateGroupParticipantRoleRequest,
  updateMessageRequest,
} from "../api/chat";
import {
  getNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "../api/notifications";
import { getUserDetailsRequest, searchUsersRequest } from "../api/users";
import MessageStatus from "../components/MessageStatus";
import UserAvatar from "../components/UserAvatar";
import { useChatSocket } from "../hooks/useChatSocket";
import { socket } from "../socket";
import { useAuthStore } from "../store/authStore";
import { useOutboxStore } from "../store/outboxStore";
import type { OutboxItem } from "../store/outboxStore";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";
import type { Chat, ChatParticipant, GroupInvite, Message } from "../types/chat";
import type { AppNotification } from "../types/notification";
import type { User } from "../types/user";
import { normalizeMessageStatus } from "../utils/messageStatus";
import "./ChatsPage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:5000";

type TypingPayload = {
  chatId: string;
  userId: string;
  name?: string;
};

type ContextMenuState =
  | {
      type: "message";
      x: number;
      y: number;
      message: Message;
    }
  | {
      type: "send";
      x: number;
      y: number;
    }
  | null;

type ScheduleModalMode = "compose" | "reschedule";

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getAssetUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}${value}`;
};

const formatDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const timezoneOffset = parsedDate.getTimezoneOffset();
  const localDate = new Date(parsedDate.getTime() - timezoneOffset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const getRoleLabel = (role?: "OWNER" | "ADMIN" | "MEMBER") => {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    default:
      return "Member";
  }
};

const REACTION_OPTIONS = ["❤️", "🤯", "😍", "👍", "👎", "🔥", "🥰"];
const EMOJI_PICKER_ITEMS = [
  "😀",
  "😄",
  "😁",
  "😅",
  "🤣",
  "😊",
  "😉",
  "😍",
  "😘",
  "🥳",
  "😎",
  "🤯",
  "😭",
  "😂",
  "😴",
  "🤔",
  "😇",
  "😡",
];

const getStartOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getCalendarGrid = (monthDate: Date) => {
  const start = getStartOfMonth(monthDate);
  const startDay = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);

  return Array.from({ length: 35 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    return cellDate;
  });
};

const formatScheduleActionLabel = (date: Date) => {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  const timeLabel = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Send today at ${timeLabel}`;
  }

  return `Schedule for ${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} at ${timeLabel}`;
};

export default function ChatsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState<"chat" | "media">("chat");
  const [mediaItems, setMediaItems] = useState<Message[]>([]);
  const [mediaHasMore, setMediaHasMore] = useState(false);
  const [mediaCursor, setMediaCursor] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupUsers, setGroupUsers] = useState<User[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchingGroupUsers, setSearchingGroupUsers] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<string, "online" | "away">
  >({});
  const [typingUser, setTypingUser] = useState<TypingPayload | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [profileDrawerUser, setProfileDrawerUser] = useState<User | null>(null);
  const [loadingProfileDrawer, setLoadingProfileDrawer] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showComposerTools, setShowComposerTools] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInvitesExpanded, setIsInvitesExpanded] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [groupMode, setGroupMode] = useState<"create" | "invite">("create");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUserIds, setSelectedGroupUserIds] = useState<string[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [reschedulingMessageId, setReschedulingMessageId] = useState<string | null>(null);
  const [groupSettingsName, setGroupSettingsName] = useState("");
  const [groupSettingsPhoto, setGroupSettingsPhoto] = useState<File | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [imageViewerMessage, setImageViewerMessage] = useState<Message | null>(null);
  const [scheduleModalMode, setScheduleModalMode] =
    useState<ScheduleModalMode>("compose");
  const [scheduleMonth, setScheduleMonth] = useState(() => getStartOfMonth(new Date()));
  const [scheduleDraft, setScheduleDraft] = useState(() => {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 5);
    next.setSeconds(0, 0);
    return next;
  });

  const addOutboxItem = useOutboxStore((state) => state.add);
  const updateOutboxItem = useOutboxStore((state) => state.update);
  const removeOutboxItem = useOutboxStore((state) => state.remove);
  // Important: selectors passed to Zustand must return a stable snapshot.
  // Returning a new array each call can trigger React's "Maximum update depth exceeded"
  // via useSyncExternalStore.
  const outboxItems = useOutboxStore((state) => state.items);
  const outboxForSelectedChat = useMemo(() => {
    if (!selectedChat) return [];
    return outboxItems.filter((item) => item.chatId === selectedChat.id);
  }, [outboxItems, selectedChat?.id]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const groupPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const conversationSearchInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const uploadControllersRef = useRef<Record<string, AbortController>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id ?? null;
  }, [selectedChat?.id]);

  const openScheduleModal = (mode: ScheduleModalMode) => {
    const initialDate = scheduledFor ? new Date(scheduledFor) : new Date();

    if (!scheduledFor) {
      initialDate.setMinutes(initialDate.getMinutes() + 5);
    }

    initialDate.setSeconds(0, 0);
    setScheduleModalMode(mode);
    setScheduleDraft(initialDate);
    setScheduleMonth(getStartOfMonth(initialDate));
    setShowScheduleModal(true);
    setShowComposerTools(false);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
  };

  const getDisplayContent = (message: Message) => {
    if (message.deletedAt) {
      return "This message was deleted";
    }

    if (!message.content && message.imageUrl) {
      return "Image";
    }

    return message.content;
  };

  const getChatPreviewText = (message?: Message) => {
    if (!message) {
      return "No messages yet";
    }

    if (message.deletedAt) {
      return "This message was deleted";
    }

    if (message.imageUrl && !message.content) {
      return "Image";
    }

    if (message.scheduledFor && !message.sentAt) {
      return `Scheduled: ${message.content || "Image"}`;
    }

    return message.content || "Image";
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.type === "saved") {
      return "Saved Messages";
    }

    if (chat.type === "group") {
      return chat.name || "Unnamed group";
    }

    const otherUser = chat.participants.find((p) => p.user.id !== user?.id)?.user;
    return `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() || "Direct chat";
  };

  const getChatSubtitle = (chat: Chat) => {
    if (chat.type === "saved") {
      return "Private notes";
    }

    if (chat.type === "group") {
      const onlineCount = chat.participants.filter((participant) => {
        const presence = presenceByUserId[participant.user.id];
        return presence === "online";
      }).length;

      const inviteCount = chat.invites?.length || 0;

      return `${chat.participants.length} members${onlineCount > 0 ? ` • ${onlineCount} online` : ""}${inviteCount > 0 ? ` • ${inviteCount} pending` : ""}`;
    }

    const otherUser = chat.participants.find((p) => p.user.id !== user?.id)?.user;
    return otherUser ? `@${otherUser.username}` : "Direct message";
  };

  const getUserPresence = (targetUserId?: string) => {
    if (!targetUserId) {
      return "offline";
    }

    if (presenceByUserId[targetUserId]) {
      return presenceByUserId[targetUserId];
    }

    return onlineUserIds.includes(targetUserId) ? "online" : "offline";
  };

  const renderMessageImage = (message: Message) => {
    const imageUrl = getAssetUrl(message.imageUrl);

    if (!imageUrl || message.deletedAt) {
      return null;
    }

    return (
      <button
        type="button"
        className="message-image-button"
        onClick={() => setImageViewerMessage(message)}
        onContextMenu={(event) => handleOpenMessageContextMenu(event, message)}
      >
        <img
          src={imageUrl}
          alt="Shared media"
          className="message-image"
          onContextMenu={(event) => handleOpenMessageContextMenu(event, message)}
        />
      </button>
    );
  };

  const downloadMessageImage = (message: Message) => {
    const imageUrl = getAssetUrl(message.imageUrl);

    if (!imageUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageUrl.split("/").pop() || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMessageText = async (message: Message) => {
    const text = getDisplayContent(message).trim();

    if (!text) {
      showToast("Nothing to copy from this message", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Message copied", "success");
    } catch (error) {
      console.error("Copy message failed:", error);
      showToast("Failed to copy message", "error");
    }
  };

  const copyMessageImage = async (message: Message) => {
    const imageUrl = getAssetUrl(message.imageUrl);

    if (!imageUrl) {
      showToast("No image to copy", "error");
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.write !== "function" ||
      typeof ClipboardItem === "undefined"
    ) {
      showToast("Copy image is not supported in this browser", "error");
      return;
    }

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Image request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const mimeType = blob.type || "image/png";
      await navigator.clipboard.write([
        new ClipboardItem({
          [mimeType]: blob,
        }),
      ]);
      showToast("Image copied", "success");
    } catch (error) {
      console.error("Copy image failed:", error);
      showToast("Failed to copy image", "error");
    }
  };

  const getReactionSummary = (message: Message) => {
    const reactionMap = new Map<string, number>();

    (message.reactions || []).forEach((reaction) => {
      reactionMap.set(reaction.emoji, (reactionMap.get(reaction.emoji) || 0) + 1);
    });

    return Array.from(reactionMap.entries()).map(([emoji, count]) => ({
      emoji,
      count,
    }));
  };

  const matchingMessageIds = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return messages
      .filter((message) => getDisplayContent(message).toLowerCase().includes(query))
      .map((message) => message.id);
  }, [messageSearch, messages]);

  const scheduleCalendarDays = useMemo(() => getCalendarGrid(scheduleMonth), [scheduleMonth]);

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [messageSearch, selectedChat?.id]);

  useEffect(() => {
    if (matchingMessageIds.length === 0) {
      return;
    }

    const activeMessageId = matchingMessageIds[activeSearchIndex] ?? matchingMessageIds[0];
    const activeNode = messageRefs.current[activeMessageId];

    activeNode?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeSearchIndex, matchingMessageIds]);

  const renderHighlightedContent = (message: Message) => {
    const displayContent = getDisplayContent(message);
    const query = messageSearch.trim();

    if (!query) {
      return displayContent;
    }

    const parts = displayContent.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={`${message.id}-${index}`} className="message-highlight">
          {part}
        </mark>
      ) : (
        <span key={`${message.id}-${index}`}>{part}</span>
      )
    );
  };

  const loadMessages = async (chatId: string) => {
    setLoadingMessages(true);
    setLoadingMoreMessages(false);
    setMessagesCursor(null);
    setMessagesHasMore(false);
    setActiveChatTab("chat");
    setMediaItems([]);
    setMediaCursor(null);
    setMediaHasMore(false);
    try {
      const data = await getMessagesRequest(chatId, {
        limit: 50,
        cursor: null,
        markRead: true,
      });
      setMessages(data.messages);
      setMessagesHasMore(Boolean(data.hasMore));
      setMessagesCursor(data.nextCursor ?? null);
      setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
    } catch (error) {
      console.error("Load messages failed:", error);
      showToast("Failed to load messages", "error");
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedChat || loadingMoreMessages || !messagesHasMore) {
      return;
    }

    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;

    setLoadingMoreMessages(true);

    try {
      const data = await getMessagesRequest(selectedChat.id, {
        limit: 50,
        cursor: messagesCursor,
        markRead: false,
      });

      setMessages((prev) => [...data.messages, ...prev]);
      setMessagesHasMore(Boolean(data.hasMore));
      setMessagesCursor(data.nextCursor ?? null);

      requestAnimationFrame(() => {
        if (!container) {
          return;
        }
        const nextScrollHeight = container.scrollHeight;
        container.scrollTop = nextScrollHeight - prevScrollHeight + prevScrollTop;
      });
    } catch (error) {
      console.error("Load older messages failed:", error);
      showToast("Failed to load older messages", "error");
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  const loadMedia = async (chatId: string) => {
    setLoadingMedia(true);
    setLoadingMoreMedia(false);
    setMediaCursor(null);
    setMediaHasMore(false);

    try {
      const data = await getChatMediaRequest(chatId, { limit: 60, cursor: null });
      setMediaItems(data.messages);
      setMediaHasMore(Boolean(data.hasMore));
      setMediaCursor(data.nextCursor ?? null);
    } catch (error) {
      console.error("Load media failed:", error);
      showToast("Failed to load media", "error");
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadMoreMedia = async () => {
    if (!selectedChat || loadingMoreMedia || !mediaHasMore) {
      return;
    }

    setLoadingMoreMedia(true);

    try {
      const data = await getChatMediaRequest(selectedChat.id, {
        limit: 60,
        cursor: mediaCursor,
      });

      setMediaItems((prev) => [...prev, ...data.messages]);
      setMediaHasMore(Boolean(data.hasMore));
      setMediaCursor(data.nextCursor ?? null);
    } catch (error) {
      console.error("Load more media failed:", error);
      showToast("Failed to load more media", "error");
    } finally {
      setLoadingMoreMedia(false);
    }
  };

  const handleMessagesContainerScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    if (activeChatTab === "chat") {
      if (container.scrollTop < 140 && messagesHasMore && !loadingMoreMessages && !loadingMessages) {
        void loadOlderMessages();
      }
      return;
    }

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceToBottom < 700 && mediaHasMore && !loadingMoreMedia && !loadingMedia) {
      void loadMoreMedia();
    }
  };

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const data = await getChatsRequest();
      setChats(data.chats);

      if (data.chats.length === 0) {
        setSelectedChat(null);
        setMessages([]);
        return;
      }

      if (!selectedChat) {
        const firstChat = data.chats[0];
        setSelectedChat(firstChat);
        socket.emit("join_chat", firstChat.id);
        await loadMessages(firstChat.id);
        return;
      }

      const updatedSelectedChat = data.chats.find(
        (chat: Chat) => chat.id === selectedChat.id
      );

      if (updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
      }
    } catch (error) {
      console.error("Load chats failed:", error);
      showToast("Failed to load chats", "error");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await getNotificationsRequest();
      setNotifications(data.notifications);
    } catch (error) {
      console.error("Load notifications failed:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const data = await getGroupInvitesRequest();
      setGroupInvites(data.invites);
    } catch (error) {
      console.error("Load group invites failed:", error);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    void loadChats();
    void loadInvites();
    void loadNotifications();
  }, []);

  useEffect(() => {
    if (groupInvites.length > 0) {
      setIsInvitesExpanded(true);
    }
  }, [groupInvites.length]);

  useEffect(() => {
    if (selectedChat?.type === "group") {
      setGroupSettingsName(selectedChat.name || "");
      setGroupSettingsPhoto(null);
    }
  }, [selectedChat?.id, selectedChat?.name, selectedChat?.type]);

  useEffect(() => {
    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      setUsers([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSearchUsers();
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let inactivityTimeout: number | null = null;

    const markOnline = () => {
      socket.emit("presence:update", {
        userId: user.id,
        status: "online",
      });

      if (inactivityTimeout) {
        window.clearTimeout(inactivityTimeout);
      }

      inactivityTimeout = window.setTimeout(() => {
        socket.emit("presence:update", {
          userId: user.id,
          status: "away",
        });
      }, 60_000);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "focus",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markOnline);
    });

    markOnline();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markOnline);
      });

      if (inactivityTimeout) {
        window.clearTimeout(inactivityTimeout);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (activeChatTab !== "chat") {
      return;
    }

    if (loadingMoreMessages) {
      return;
    }

    scrollToBottom();
  }, [messages, typingUser, activeChatTab, loadingMoreMessages]);

  useEffect(() => {
    const handleWindowClick = () => {
      setShowSidebarMenu(false);
      setShowChatMenu(false);
      setContextMenu(null);
    };

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "f" &&
        selectedChat &&
        activeChatTab === "chat"
      ) {
        event.preventDefault();
        setShowConversationSearch(true);
        window.setTimeout(() => {
          conversationSearchInputRef.current?.focus();
          conversationSearchInputRef.current?.select();
        }, 20);
        return;
      }

      if (event.key === "Escape") {
        setShowSidebarMenu(false);
        setShowChatMenu(false);
        setShowComposerTools(false);
        setShowEmojiPicker(false);
        setShowConversationSearch(false);
        setContextMenu(null);
        setShowScheduleModal(false);
        setImageViewerMessage(null);
      }
    };

    window.addEventListener("click", handleWindowClick);
    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("click", handleWindowClick);
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [selectedChat]);

  useChatSocket({
    currentUserId: user?.id,
    selectedChatId: selectedChat?.id,
    editingMessageId,
    loadChats,
    loadInvites,
    setMessages,
    setOnlineUserIds,
    setPresenceByUserId,
    setTypingUser,
    setUnreadCounts,
    setNotifications,
    setEditingMessageId,
    setEditingContent,
    onLeftChat: (chatId) => {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    },
  });

  useEffect(() => {
    const flushQueued = async () => {
      if (!navigator.onLine) {
        return;
      }

      const queuedItems = useOutboxStore
        .getState()
        .items.filter((item) => item.status === "queued");

      if (queuedItems.length === 0) {
        return;
      }

      await Promise.all(
        queuedItems.map(async (item) => {
          updateOutboxItem(item.clientId, {
            status: "sending",
            error: null,
            uploadProgress: item.image ? 0 : null,
          });

          const controller = new AbortController();
          uploadControllersRef.current[item.clientId] = controller;

          try {
            const data = await sendMessageRequest({
              chatId: item.chatId,
              content: item.content,
              image: item.image ?? null,
              scheduledFor: item.scheduledFor ?? null,
              signal: controller.signal,
              onUploadProgress: (percent) => {
                updateOutboxItem(item.clientId, { uploadProgress: percent });
              },
            });

            const savedMessage = data.messageData as Message;
            removeOutboxItem(item.clientId);

            if (savedMessage && selectedChatIdRef.current === savedMessage.chatId) {
              setMessages((prev) => [...prev, savedMessage]);
            }

            await loadChats();
          } catch (error: any) {
            const message =
              error?.name === "CanceledError"
                ? "Upload canceled"
                : error?.response?.data?.message || error?.message || "Send message failed";

            updateOutboxItem(item.clientId, {
              status: "failed",
              error: message,
              uploadProgress: null,
            });
          } finally {
            delete uploadControllersRef.current[item.clientId];
          }
        })
      );
    };

    const handleOnline = () => {
      void flushQueued();
    };

    window.addEventListener("online", handleOnline);
    socket.on("connect", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      socket.off("connect", handleOnline);
    };
  }, [loadChats, removeOutboxItem, updateOutboxItem]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const resetComposer = () => {
    setContent("");
    setSelectedImage(null);
    setScheduledFor("");
    setReschedulingMessageId(null);
    setShowComposerTools(false);
    setShowEmojiPicker(false);
    setShowScheduleModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setIsMobileSidebarOpen(false);
    socket.emit("join_chat", chat.id);
    setTypingUser(null);
    setIsGroupSettingsOpen(false);
    setShowConversationSearch(false);
    setMessageSearch("");
    setShowChatMenu(false);
    setContextMenu(null);
    setShowScheduleModal(false);
    handleCancelEdit();
    await loadMessages(chat.id);
  };

  const handleSend = async () => {
    if (!selectedChat || sendingMessage || !user) return;
    if (!content.trim() && !selectedImage) return;

    const clientId =
      (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID())
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const outboxItem: OutboxItem = {
      clientId,
      chatId: selectedChat.id,
      content: content.trim(),
      image: selectedImage,
      scheduledFor: scheduledFor || null,
      createdAt: Date.now(),
      status: navigator.onLine ? "sending" : "queued",
      error: null,
      uploadProgress: selectedImage ? 0 : null,
    };

    addOutboxItem(outboxItem);
    socket.emit("stop_typing", { chatId: selectedChat.id, userId: user.id });
    setTypingUser(null);
    resetComposer();
    inputRef.current?.focus();

    if (!navigator.onLine) {
      showToast("You are offline. Message queued and will retry when online.", "info");
      return;
    }

    setSendingMessage(true);

    const controller = new AbortController();
    uploadControllersRef.current[clientId] = controller;

    try {
      const data = await sendMessageRequest({
        chatId: outboxItem.chatId,
        content: outboxItem.content,
        image: outboxItem.image ?? null,
        scheduledFor: outboxItem.scheduledFor ?? null,
        signal: controller.signal,
        onUploadProgress: (percent) => {
          updateOutboxItem(clientId, { uploadProgress: percent });
        },
      });

      const savedMessage = data.messageData as Message;
      removeOutboxItem(clientId);

      if (savedMessage && selectedChatIdRef.current === savedMessage.chatId) {
        setMessages((prev) => [...prev, savedMessage]);
      }

      await loadChats();
    } catch (error: any) {
      const message =
        error?.name === "CanceledError"
          ? "Upload canceled"
          : error?.response?.data?.message || error?.message || "Send message failed";

      updateOutboxItem(clientId, {
        status: "failed",
        error: message,
        uploadProgress: null,
      });

      showToast(message, "error");
    } finally {
      delete uploadControllersRef.current[clientId];
      setSendingMessage(false);
    }
  };

  const handleRetryOutboxItem = async (item: OutboxItem) => {
    if (!navigator.onLine) {
      showToast("You are offline. Please reconnect to retry.", "error");
      return;
    }

    updateOutboxItem(item.clientId, { status: "sending", error: null, uploadProgress: item.image ? 0 : null });

    const controller = new AbortController();
    uploadControllersRef.current[item.clientId] = controller;

    try {
      const data = await sendMessageRequest({
        chatId: item.chatId,
        content: item.content,
        image: item.image ?? null,
        scheduledFor: item.scheduledFor ?? null,
        signal: controller.signal,
        onUploadProgress: (percent) => {
          updateOutboxItem(item.clientId, { uploadProgress: percent });
        },
      });

      const savedMessage = data.messageData as Message;
      removeOutboxItem(item.clientId);

      if (savedMessage && selectedChatIdRef.current === savedMessage.chatId) {
        setMessages((prev) => [...prev, savedMessage]);
      }

      await loadChats();
    } catch (error: any) {
      const message =
        error?.name === "CanceledError"
          ? "Upload canceled"
          : error?.response?.data?.message || error?.message || "Retry failed";

      updateOutboxItem(item.clientId, { status: "failed", error: message, uploadProgress: null });
      showToast(message, "error");
    } finally {
      delete uploadControllersRef.current[item.clientId];
    }
  };

  const handleCancelOutboxUpload = (clientId: string) => {
    const controller = uploadControllersRef.current[clientId];
    if (controller) {
      controller.abort();
    }
  };

  const handleStartEdit = (message: Message) => {
    if (message.deletedAt || message.sentAt === null) return;

    setReschedulingMessageId(null);
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setReschedulingMessageId(null);
    setEditingContent("");
    setScheduledFor("");
    setShowScheduleModal(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const data = await deleteMessageRequest(messageId);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? data.messageData : message
        )
      );

      if (editingMessageId === messageId) {
        handleCancelEdit();
      }

      await loadChats();
    } catch (error) {
      console.error("Delete message failed:", error);
      showToast("Delete message failed", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    try {
      const data = await updateMessageRequest(editingMessageId, editingContent.trim());

      setMessages((prev) =>
        prev.map((message) =>
          message.id === editingMessageId ? data.messageData : message
        )
      );

      handleCancelEdit();
      await loadChats();
    } catch (error) {
      console.error("Update message failed:", error);
      showToast("Update message failed", "error");
    }
  };

  const handleStartReschedule = (message: Message) => {
    if (message.deletedAt || !message.scheduledFor || message.sentAt) {
      return;
    }

    const nextDate = new Date(message.scheduledFor);

    setEditingMessageId(null);
    setReschedulingMessageId(message.id);
    setEditingContent(message.content);
    setScheduledFor(formatDateTimeLocal(message.scheduledFor));
    setScheduleModalMode("reschedule");
    setScheduleDraft(nextDate);
    setScheduleMonth(getStartOfMonth(nextDate));
    setShowScheduleModal(true);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveReschedule = async () => {
    if (!reschedulingMessageId || !scheduledFor) {
      return;
    }

    try {
      const data = await updateScheduledMessageRequest({
        messageId: reschedulingMessageId,
        content: editingContent.trim(),
        scheduledFor,
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === reschedulingMessageId ? data.messageData : message
        )
      );

      handleCancelEdit();
      await loadChats();
      showToast("Scheduled message updated", "success");
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to update scheduled message",
        "error"
      );
    }
  };

  const syncUpdatedChat = (updatedChat: Chat) => {
    setChats((prev) => prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)));

    if (selectedChat?.id === updatedChat.id) {
      setSelectedChat(updatedChat);
    }
  };

  const handleSaveGroupDetails = async () => {
    if (!selectedChat || selectedChat.type !== "group") {
      return;
    }

    try {
      const data = await updateGroupDetailsRequest({
        chatId: selectedChat.id,
        name: groupSettingsName.trim(),
        photo: groupSettingsPhoto,
      });

      syncUpdatedChat(data.chat);
      setGroupSettingsPhoto(null);
      showToast("Group updated successfully", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to update group", "error");
    }
  };

  const handleCancelScheduledMessage = async (messageId: string) => {
    try {
      const data = await cancelScheduledMessageRequest(messageId);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? data.messageData : message
        )
      );

      if (reschedulingMessageId === messageId) {
        handleCancelEdit();
      }

      await loadChats();
      showToast("Scheduled message canceled", "success");
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to cancel scheduled message",
        "error"
      );
    }
  };

  const handleTypingChange = (value: string) => {
    setContent(value);

    if (!selectedChat || !user) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedChat.id,
        userId: user.id,
        name: user.firstName,
      });
    } else {
      socket.emit("stop_typing", {
        chatId: selectedChat.id,
        userId: user.id,
      });
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("stop_typing", {
        chatId: selectedChat.id,
        userId: user.id,
      });
    }, 1200);
  };

  const handleSearchUsers = async () => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const data = await searchUsersRequest(search.trim());
      setUsers(data.users.filter((u: User) => u.id !== user?.id));
    } catch (error) {
      console.error("Search users failed:", error);
      showToast("Search users failed", "error");
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSearchGroupUsers = async () => {
    if (!groupSearch.trim()) {
      setGroupUsers([]);
      return;
    }

    setSearchingGroupUsers(true);
    try {
      const data = await searchUsersRequest(groupSearch.trim());
      setGroupUsers(data.users.filter((u: User) => u.id !== user?.id));
    } catch (error) {
      console.error("Search group users failed:", error);
      showToast("Failed to search users", "error");
    } finally {
      setSearchingGroupUsers(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const data = await createDirectChatRequest(userId);

      await loadChats();
      setSelectedChat(data.chat);
      setIsMobileSidebarOpen(false);
      socket.emit("join_chat", data.chat.id);
      await loadMessages(data.chat.id);

      setUsers([]);
      setSearch("");
    } catch (error) {
      console.error("Start chat failed:", error);
      showToast("Failed to start chat", "error");
    }
  };

  const toggleGroupUser = (targetUserId: string) => {
    setSelectedGroupUserIds((prev) =>
      prev.includes(targetUserId)
        ? prev.filter((id) => id !== targetUserId)
        : [...prev, targetUserId]
    );
  };

  const handleOpenCreateGroup = () => {
    setGroupMode("create");
    setGroupName("");
    setGroupSearch("");
    setGroupUsers([]);
    setSelectedGroupUserIds([]);
    setIsGroupModalOpen(true);
  };

  const handleOpenAddMembers = () => {
    setGroupMode("invite");
    setGroupSearch("");
    setGroupUsers([]);
    setSelectedGroupUserIds([]);
    setIsGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setGroupSearch("");
    setGroupUsers([]);
    setSelectedGroupUserIds([]);
    if (groupMode === "create") {
      setGroupName("");
    }
  };

  const handleSubmitGroup = async () => {
    try {
      if (groupMode === "create") {
        const data = await createGroupChatRequest(groupName.trim(), selectedGroupUserIds);
        await loadChats();
        setSelectedChat(data.chat);
        socket.emit("join_chat", data.chat.id);
        await loadMessages(data.chat.id);
        showToast("Group chat created", "success");
      } else if (selectedChat) {
        const data = await addGroupParticipantsRequest(selectedChat.id, selectedGroupUserIds);
        setSelectedChat(data.chat);
        await loadChats();
        showToast("Invitations sent", "success");
      }

      handleCloseGroupModal();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to save group";
      showToast(message, "error");
    }
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) {
        await markNotificationReadRequest(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
      }

      if (notification.chatId) {
        const chatToOpen = chats.find((chat) => chat.id === notification.chatId);

        if (chatToOpen) {
          await handleSelectChat(chatToOpen);
        } else {
          await loadChats();
          const refreshedChats = await getChatsRequest();
          const refreshedChat = refreshedChats.chats.find(
            (chat) => chat.id === notification.chatId
          );

          if (refreshedChat) {
            await handleSelectChat(refreshedChat);
          }
        }
      }

      setShowNotifications(false);
    } catch (error) {
      console.error("Open notification failed:", error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadRequest();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error("Mark all notifications read failed:", error);
      showToast("Failed to update notifications", "error");
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      showToast("Browser notifications are not supported here", "error");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      showToast("Browser notifications enabled", "success");
      return;
    }

    showToast("Browser notifications were not enabled", "error");
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const data = await acceptGroupInviteRequest(inviteId);
      await loadChats();
      await loadInvites();
      setSelectedChat(data.chat);
      socket.emit("join_chat", data.chat.id);
      await loadMessages(data.chat.id);
      showToast("Joined the group", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to accept invite", "error");
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await rejectGroupInviteRequest(inviteId);
      await loadInvites();
      showToast("Invite rejected", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to reject invite", "error");
    }
  };

  const handleChangeRole = async (participantId: string, role: "MEMBER" | "ADMIN") => {
    if (!selectedChat) return;

    try {
      const data = await updateGroupParticipantRoleRequest(
        selectedChat.id,
        participantId,
        role
      );
      setSelectedChat(data.chat);
      await loadChats();
      showToast("Role updated", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to update role", "error");
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!selectedChat) return;

    try {
      const data = await removeGroupParticipantRequest(selectedChat.id, participantId);
      setSelectedChat(data.chat);
      await loadChats();
      showToast("Member removed", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to remove member", "error");
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedChat) return;

    try {
      const data = await leaveGroupRequest(selectedChat.id);
      await loadChats();
      setIsGroupSettingsOpen(false);
      if (data.chat) {
        setSelectedChat(data.chat);
      } else {
        setSelectedChat(null);
        setMessages([]);
      }
      showToast("Left group successfully", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to leave group", "error");
    }
  };

  const selectedOtherUser = selectedChat?.participants.find(
    (p) => p.user.id !== user?.id
  )?.user;

  const selectedParticipant = selectedChat?.participants.find(
    (participant) => participant.userId === user?.id
  );

  const canManageRoles = selectedParticipant?.role === "OWNER";
  const canManageMembers =
    selectedParticipant?.role === "OWNER" || selectedParticipant?.role === "ADMIN";
  const isRescheduling = Boolean(reschedulingMessageId);
  const groupAdminCount =
    selectedChat?.participants.filter((participant) => participant.role === "ADMIN")
      .length || 0;
  const groupPendingInviteCount = selectedChat?.invites?.length || 0;
  const isComposerSubmitDisabled =
    sendingMessage ||
    (isRescheduling ? !scheduledFor : !content.trim() && !selectedImage);

  const isSelectedUserOnline = useMemo(() => {
    if (!selectedOtherUser?.id) return false;
    return getUserPresence(selectedOtherUser.id) !== "offline";
  }, [presenceByUserId, onlineUserIds, selectedOtherUser?.id]);

  const handleSearchNavigation = (direction: "next" | "prev") => {
    if (matchingMessageIds.length === 0) {
      return;
    }

    setActiveSearchIndex((prev) => {
      if (direction === "next") {
        return (prev + 1) % matchingMessageIds.length;
      }

      return (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    });
  };

  const handleOpenUserDetails = async (targetUser: User | undefined) => {
    if (!targetUser?.id) {
      return;
    }

    setLoadingProfileDrawer(true);

    try {
      const data = await getUserDetailsRequest(targetUser.id);
      setProfileDrawerUser(data.user);
    } catch (error) {
      console.error("Fetch user details failed:", error);
      showToast("Failed to load user details", "error");
    } finally {
      setLoadingProfileDrawer(false);
    }
  };

  const handleCloseUserDetails = () => {
    setProfileDrawerUser(null);
    setLoadingProfileDrawer(false);
  };

  const applyScheduleDraft = () => {
    if (scheduleDraft.getTime() <= Date.now()) {
      showToast("Choose a future time", "error");
      return;
    }

    setScheduledFor(formatDateTimeLocal(scheduleDraft.toISOString()));
    setShowScheduleModal(false);
    showToast(
      scheduleModalMode === "reschedule"
        ? "Scheduled message time updated"
        : "Message schedule set",
      "success"
    );
  };

  const handleScheduleDaySelect = (day: Date) => {
    const nextDate = new Date(scheduleDraft);
    nextDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    setScheduleDraft(nextDate);
  };

  const handleScheduleTimePartChange = (
    part: "hour" | "minute",
    value: string
  ) => {
    const nextDate = new Date(scheduleDraft);

    if (part === "hour") {
      nextDate.setHours(Number(value));
    } else {
      nextDate.setMinutes(Number(value));
    }

    nextDate.setSeconds(0, 0);
    setScheduleDraft(nextDate);
  };

  const handleOpenMessageContextMenu = (
    event: React.MouseEvent,
    message: Message
  ) => {
    if (message.deletedAt) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      type: "message",
      x: event.clientX,
      y: event.clientY,
      message,
    });
  };

  const handleReplyToMessage = (message: Message) => {
    const label = message.sender.username || message.sender.firstName || "user";
    const prefix = `@${label} `;

    if (editingMessageId || reschedulingMessageId) {
      setEditingContent((prev) => (prev.startsWith(prefix) ? prev : `${prefix}${prev}`));
    } else {
      setContent((prev) => (prev.startsWith(prefix) ? prev : `${prefix}${prev}`));
    }

    setContextMenu(null);
    setShowComposerTools(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleForwardMessage = async (message: Message) => {
    if (message.imageUrl) {
      const imageUrl = getAssetUrl(message.imageUrl);

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);

          if (!response.ok) {
            throw new Error(`Image request failed with status ${response.status}`);
          }

          const blob = await response.blob();
          const fileName = imageUrl.split("/").pop() || "forwarded-image";
          const file = new File([blob], fileName, {
            type: blob.type || "image/png",
          });
          setSelectedImage(file);
        } catch (error) {
          console.error("Forward image failed:", error);
          showToast("Failed to attach image for forwarding", "error");
          return;
        }
      }
    }

    if (message.content?.trim()) {
      setContent(message.content.trim());
    }

    setContextMenu(null);
    setShowComposerTools(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
    showToast("Message loaded into composer", "success");
  };

  const handleToggleSelectedMessage = (messageId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
    setContextMenu(null);
  };

  const handleReportMessage = async (message: Message) => {
    const reportPayload = [
      `Chat: ${selectedChat?.id || "unknown"}`,
      `Message: ${message.id}`,
      `Sender: ${message.sender.username || message.sender.firstName}`,
      `Created: ${message.createdAt}`,
      `Content: ${getDisplayContent(message)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(reportPayload);
      showToast("Report details copied", "success");
    } catch (error) {
      console.error("Copy report details failed:", error);
      showToast("Failed to prepare report details", "error");
    } finally {
      setContextMenu(null);
    }
  };

  const getContextMenuActions = (message: Message) => {
    const isOwnMessage = message.sender.id === user?.id;
    const isScheduledOwnMessage =
      isOwnMessage && Boolean(message.scheduledFor && !message.sentAt);
    const hasImage = Boolean(message.imageUrl);
    const hasText = Boolean(message.content?.trim());
    const isSelected = selectedMessageIds.includes(message.id);
    const reactionSummary = getReactionSummary(message);

    const actions: Array<{
      key: string;
      label: string;
      icon: string;
      danger?: boolean;
      onClick: () => void;
    }> = [
      {
        key: "reply",
        label: "Reply",
        icon: "↩",
        onClick: () => handleReplyToMessage(message),
      },
    ];

    if (hasImage) {
      actions.push({
        key: "copy-image",
        label: "Copy image",
        icon: "🖼",
        onClick: () => {
          void copyMessageImage(message);
          setContextMenu(null);
        },
      });
      actions.push({
        key: "download",
        label: "Download",
        icon: "↓",
        onClick: () => {
          downloadMessageImage(message);
          setContextMenu(null);
        },
      });
    } else if (hasText) {
      actions.push({
        key: "copy-text",
        label: "Copy text",
        icon: "⧉",
        onClick: () => {
          void copyMessageText(message);
          setContextMenu(null);
        },
      });
    }

    actions.push({
      key: "forward",
      label: "Forward",
      icon: "➜",
      onClick: () => {
        void handleForwardMessage(message);
      },
    });
    actions.push({
      key: "select",
      label: isSelected ? "Unselect" : "Select",
      icon: "◉",
      onClick: () => handleToggleSelectedMessage(message.id),
    });

    if (!isOwnMessage) {
      actions.push({
        key: "report",
        label: "Report",
        icon: "⚑",
        onClick: () => {
          void handleReportMessage(message);
        },
      });
    }

    if (isScheduledOwnMessage) {
      actions.push({
        key: "reschedule",
        label: "Reschedule",
        icon: "🕒",
        onClick: () => {
          handleStartReschedule(message);
          setContextMenu(null);
        },
      });
      actions.push({
        key: "cancel-scheduled",
        label: "Cancel scheduled",
        icon: "✕",
        danger: true,
        onClick: () => {
          void handleCancelScheduledMessage(message.id);
          setContextMenu(null);
        },
      });
    } else if (isOwnMessage) {
      actions.push({
        key: "edit",
        label: "Edit",
        icon: "✎",
        onClick: () => {
          handleStartEdit(message);
          setContextMenu(null);
        },
      });
      actions.push({
        key: "delete",
        label: "Delete",
        icon: "🗑",
        danger: true,
        onClick: () => {
          void handleDeleteMessage(message.id);
          setContextMenu(null);
        },
      });
    }

    return {
      actions,
      reactionSummary,
    };
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const data = await reactToMessageRequest(messageId, emoji);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? data.messageData : message
        )
      );
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to react to message", "error");
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (editingMessageId || isRescheduling) {
      setEditingContent((prev) => `${prev}${emoji}`);
    } else {
      setContent((prev) => `${prev}${emoji}`);
    }

    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const invitesToggleLabel =
    groupInvites.length > 0
      ? `${groupInvites.length} pending`
      : isInvitesExpanded
        ? "Hide"
        : "Show";

  const getGroupAvatarUser = (name?: string | null, photoUrl?: string | null) => {
    const [firstName = "Group", lastName = ""] = (name || "Group")
      .trim()
      .split(/\s+/, 2);

    return {
      firstName,
      lastName,
      profilePhotoUrl: photoUrl || null,
    };
  };

  const getSavedMessagesAvatarUser = () => ({
    firstName: "Saved",
    lastName: "Messages",
    profilePhotoUrl: user?.profilePhotoUrl || null,
  });

  return (
    <div className={`chat-layout ${isMobileSidebarOpen ? "show-sidebar" : "show-chat"}`}>
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <div className="profile-card">
            <UserAvatar user={user} avatarClassName="profile-avatar" />

            <div className="profile-info">
              <strong>
                {user?.firstName} {user?.lastName}
              </strong>
              <span>@{user?.username}</span>
            </div>

            <div className="topbar-menu">
              <button
                type="button"
                className="icon-menu-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowSidebarMenu((prev) => !prev);
                  setShowChatMenu(false);
                }}
                aria-label="Open account menu"
              >
                ⋯
              </button>

              {showSidebarMenu && (
                <div className="floating-menu" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="floating-menu-item"
                    onClick={() => {
                      handleOpenCreateGroup();
                      setShowSidebarMenu(false);
                    }}
                  >
                    New group
                  </button>
                  <button
                    type="button"
                    className="floating-menu-item"
                    onClick={() => {
                      navigate("/profile");
                      setShowSidebarMenu(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className="floating-menu-item toggle-row"
                    onClick={() => {
                      toggleTheme();
                    }}
                    aria-pressed={theme === "dark"}
                  >
                    <span className="toggle-row-label">
                      <span className="toggle-row-icon" aria-hidden="true">
                        ☽
                      </span>
                      <span>Night Mode</span>
                    </span>
                    <span className={`menu-switch ${theme === "dark" ? "on" : ""}`}>
                      <span className="menu-switch-thumb" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="floating-menu-item"
                    onClick={() => {
                      setShowNotifications((prev) => !prev);
                    }}
                  >
                    {showNotifications ? "Hide notifications" : "Show notifications"}
                  </button>
                  <button
                    type="button"
                    className="floating-menu-item"
                    onClick={() => {
                      void handleEnableBrowserNotifications();
                      setShowSidebarMenu(false);
                    }}
                  >
                    Browser alerts
                  </button>
                  <button
                    type="button"
                    className="floating-menu-item danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {showNotifications && (
            <div className="notifications-panel">
              <div className="notifications-panel-header">
                <strong>
                  Notifications
                  {unreadNotificationCount > 0 && (
                    <span className="notification-badge">{unreadNotificationCount}</span>
                  )}
                </strong>
                <button
                  type="button"
                  className="message-action-btn search-nav-btn"
                  onClick={() => void handleMarkAllNotificationsRead()}
                  disabled={notifications.length === 0}
                >
                  Read all
                </button>
              </div>

              {loadingNotifications ? (
                <div className="empty-state-card compact">
                  <strong>Loading notifications</strong>
                  <span>Pulling in your latest alerts.</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="empty-state-card compact">
                  <strong>No notifications yet</strong>
                  <span>Replies, invites, and updates will appear here.</span>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`notification-item ${notification.isRead ? "" : "unread"}`}
                      onClick={() => void handleOpenNotification(notification)}
                    >
                      <strong>{notification.title}</strong>
                      <span>{notification.body}</span>
                      <small>
                        {new Date(notification.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsInvitesExpanded((prev) => !prev)}
          >
            <span className="section-title">Pending invites</span>
            <span className="section-toggle-meta">
              {invitesToggleLabel}
              <span className={`section-toggle-arrow ${isInvitesExpanded ? "open" : ""}`}>
                +
              </span>
            </span>
          </button>

          {isInvitesExpanded && (
            loadingInvites ? (
              <div className="empty-state-card compact">
                <strong>Loading invites</strong>
                <span>Checking if anyone added you to a group.</span>
              </div>
            ) : groupInvites.length === 0 ? (
              <div className="empty-state-card compact">
                <strong>No pending invites</strong>
                <span>You are all caught up for now.</span>
              </div>
            ) : (
              <div className="invite-list">
                {groupInvites.map((invite) => (
                  <div key={invite.id} className="invite-card">
                    <div className="invite-card-header">
                      <strong>{invite.chat?.name || "Group invite"}</strong>
                      <span className="invite-state-pill">Pending</span>
                    </div>
                    <span>
                      From {invite.invitedBy?.firstName} {invite.invitedBy?.lastName}
                    </span>
                    <small>
                      Invited {new Date(invite.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                    <div className="invite-actions">
                      <button
                        type="button"
                        className="message-action-btn search-nav-btn"
                        onClick={() => void handleAcceptInvite(invite.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="message-action-btn danger"
                        onClick={() => void handleRejectInvite(invite.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">Search users</h3>

          <div className="search-row minimal-search-row">
            <input
              className="chat-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSearchUsers();
                }
              }}
            />
            <span className="search-hint">
              {searchingUsers ? "Searching..." : "Press Enter or just type"}
            </span>
          </div>

          <div className="search-results">
            {users.length > 0 ? (
              users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => void handleStartChat(u.id)}
                  className="user-card"
                >
                  <UserAvatar
                    user={u}
                    showOnline
                    isOnline={getUserPresence(u.id) !== "offline"}
                  />

                  <div className="user-card-info">
                    <strong>
                      {u.firstName} {u.lastName}
                    </strong>
                    <span>
                      @{u.username} • {getUserPresence(u.id)}
                    </span>
                  </div>
                </div>
              ))
            ) : search.trim() && !searchingUsers ? (
              <div className="empty-state-card compact">
                <strong>No users found</strong>
                <span>Try a different name, username, or email.</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="sidebar-section chats-section">
          <h3 className="section-title">Chats</h3>

          {loadingChats ? (
            <div className="empty-state-card compact">
              <strong>Loading chats</strong>
              <span>Bringing your conversations into view.</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="empty-state-card compact">
              <strong>No chats yet</strong>
              <span>Search for someone above to start your first conversation.</span>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = chat.participants.find(
                (p) => p.user.id !== user?.id
              )?.user;

              const isSelected = selectedChat?.id === chat.id;
              const unreadCount = unreadCounts[chat.id] || 0;
              const isOnline =
                chat.type === "group"
                  ? chat.participants.some(
                      (participant) => getUserPresence(participant.user.id) !== "offline"
                    )
                  : otherUser?.id
                    ? getUserPresence(otherUser.id) !== "offline"
                    : false;

              return (
                <div
                  key={chat.id}
                  onClick={() => void handleSelectChat(chat)}
                  className={`chat-list-item ${isSelected ? "active" : ""}`}
                >
                  <UserAvatar
                    user={
                      chat.type === "saved"
                        ? getSavedMessagesAvatarUser()
                        : chat.type === "group"
                          ? getGroupAvatarUser(chat.name, chat.photoUrl)
                          : otherUser
                    }
                    showOnline
                    isOnline={isOnline}
                  />

                  <div className="chat-list-content">
                    <strong>{getChatTitle(chat)}</strong>
                    <span>{getChatSubtitle(chat)}</span>
                    <p>{getChatPreviewText(chat.messages?.[0])}</p>
                  </div>

                  {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className="chat-main">
        {!selectedChat ? (
          <div className="no-chat-selected">
            <div className="empty-state-card hero">
              <strong>Choose a conversation</strong>
              <span>Pick an existing chat or search for someone new to start messaging.</span>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-user">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`chat-avatar-button ${
                    selectedChat.type === "direct" ? "interactive" : ""
                  }`}
                  onClick={() => {
                    if (selectedChat.type === "direct") {
                      void handleOpenUserDetails(selectedOtherUser);
                    }
                  }}
                  disabled={selectedChat.type !== "direct"}
                  aria-label={
                    selectedChat.type === "direct"
                      ? "Open user details"
                      : "Group avatar"
                  }
                >
                  <UserAvatar
                    user={
                      selectedChat.type === "saved"
                        ? getSavedMessagesAvatarUser()
                        :
                      selectedChat.type === "group"
                        ? getGroupAvatarUser(selectedChat.name, selectedChat.photoUrl)
                        : selectedOtherUser
                    }
                    size="large"
                    avatarClassName="profile-avatar large"
                    showOnline
                    isOnline={
                      selectedChat.type === "group"
                        ? selectedChat.participants.some(
                            (participant) =>
                              getUserPresence(participant.user.id) !== "offline"
                          )
                        : selectedChat.type === "saved"
                          ? false
                        : isSelectedUserOnline
                    }
                  />
                </button>

                <div className="chat-header-info">
                  <h2>{getChatTitle(selectedChat)}</h2>
                  <span>
                    {selectedChat.type === "group"
                      ? getChatSubtitle(selectedChat)
                      : selectedChat.type === "saved"
                        ? "Only visible to you"
                      : `@${selectedOtherUser?.username} • ${getUserPresence(
                          selectedOtherUser?.id
                        )}`}
                  </span>
                </div>

                <div className="chat-header-actions">
                  <button
                    type="button"
                    className={`chat-tab ${activeChatTab === "chat" ? "active" : ""}`}
                    onClick={() => setActiveChatTab("chat")}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    className={`chat-tab ${activeChatTab === "media" ? "active" : ""}`}
                    onClick={() => {
                      setActiveChatTab("media");
                      void loadMedia(selectedChat.id);
                    }}
                  >
                    Media
                  </button>
                </div>

                {selectedChat.type === "group" && (
                  <div className="topbar-menu">
                    <button
                      type="button"
                      className="icon-menu-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowChatMenu((prev) => !prev);
                        setShowSidebarMenu(false);
                      }}
                      aria-label="Open chat menu"
                    >
                      ⋯
                    </button>

                    {showChatMenu && (
                      <div className="floating-menu" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="floating-menu-item"
                          onClick={() => {
                            handleOpenAddMembers();
                            setShowChatMenu(false);
                          }}
                        >
                          Invite members
                        </button>
                        <button
                          type="button"
                          className="floating-menu-item"
                          onClick={() => {
                            setIsGroupSettingsOpen(true);
                            setShowChatMenu(false);
                          }}
                        >
                          Group settings
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="messages-container"
              ref={messagesContainerRef}
              onScroll={handleMessagesContainerScroll}
            >
              {activeChatTab === "chat" && showConversationSearch && (
                <div className="conversation-search-overlay">
                  <input
                    ref={conversationSearchInputRef}
                    className="conversation-search-input"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search in conversation..."
                  />
                  <div className="conversation-search-controls">
                    <span className="conversation-search-count">
                      {messageSearch.trim()
                        ? matchingMessageIds.length === 0
                          ? "0 results"
                          : `${activeSearchIndex + 1}/${matchingMessageIds.length}`
                        : "Ctrl+F"}
                    </span>
                    <button
                      type="button"
                      className="message-action-btn search-nav-btn"
                      onClick={() => handleSearchNavigation("prev")}
                      disabled={matchingMessageIds.length === 0}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="message-action-btn search-nav-btn"
                      onClick={() => handleSearchNavigation("next")}
                      disabled={matchingMessageIds.length === 0}
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      className="message-action-btn search-nav-btn"
                      onClick={() => {
                        setShowConversationSearch(false);
                        setMessageSearch("");
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {activeChatTab === "media" ? (
                loadingMedia ? (
                  <div className="empty-state-card compact">
                    <strong>Loading media</strong>
                    <span>Fetching images shared in this chat.</span>
                  </div>
                ) : mediaItems.length === 0 ? (
                  <div className="empty-state-card hero chat-empty-state">
                    <strong>No media yet</strong>
                    <span>Images shared in this chat will show up here.</span>
                  </div>
                ) : (
                  <>
                    <div className="media-grid">
                      {mediaItems
                        .filter((item) => Boolean(item.imageUrl))
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="media-thumb"
                            onClick={() => setImageViewerMessage(item)}
                          >
                            <img
                              src={getAssetUrl(item.imageUrl) || ""}
                              alt="Shared media"
                              loading="lazy"
                            />
                          </button>
                        ))}
                    </div>

                    {loadingMoreMedia && (
                      <div className="empty-state-card compact">
                        <strong>Loading more</strong>
                        <span>Pulling in older media items.</span>
                      </div>
                    )}
                  </>
                )
              ) : loadingMessages ? (
                <div className="empty-state-card compact">
                  <strong>Loading messages</strong>
                  <span>Fetching the latest messages in this conversation.</span>
                </div>
              ) : messages.length === 0 && outboxForSelectedChat.length === 0 ? (
                <div className="empty-state-card hero chat-empty-state">
                  <strong>No messages yet</strong>
                  <span>Say hello and start the conversation.</span>
                </div>
              ) : (
                <>
                  {loadingMoreMessages && (
                    <div className="empty-state-card compact">
                      <strong>Loading older messages</strong>
                      <span>Pulling in earlier messages.</span>
                    </div>
                  )}

                  {messages.map((message) => {
                    const isMe = message.sender.id === user?.id;
                    const status = normalizeMessageStatus(message.status);
                    const isPending = Boolean(message.scheduledFor && !message.sentAt);
                    const reactionSummary = getReactionSummary(message);

                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          messageRefs.current[message.id] = node;
                        }}
                        className={`message-row ${isMe ? "me" : "them"}`}
                      >
                        <div
                            className={`message-bubble ${isMe ? "me" : "them"} ${
                              selectedMessageIds.includes(message.id) ? "selected" : ""
                            } ${
                              matchingMessageIds[activeSearchIndex] === message.id
                                ? "search-active"
                                : matchingMessageIds.includes(message.id)
                                ? "search-match"
                                : ""
                          }`}
                          onContextMenu={(event) =>
                            handleOpenMessageContextMenu(event, message)
                          }
                        >
                          {!isMe && (
                            <div className="message-sender">{message.sender.firstName}</div>
                          )}

                          {renderMessageImage(message)}

                          <div
                            className={`message-content ${
                              message.deletedAt ? "deleted" : ""
                            }`}
                          >
                            {renderHighlightedContent(message)}
                          </div>

                          {reactionSummary.length > 0 && (
                            <div className="message-reactions-row">
                              {reactionSummary.map((reaction) => (
                                <button
                                  key={`${message.id}-${reaction.emoji}`}
                                  type="button"
                                  className="message-reaction-pill"
                                  onClick={() =>
                                    void handleReactToMessage(message.id, reaction.emoji)
                                  }
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {isPending && (
                            <div className="message-scheduled">
                              <span className="message-scheduled-pill">Scheduled</span>{" "}
                              for{" "}
                              {message.scheduledFor
                                ? new Date(message.scheduledFor).toLocaleString()
                                : "later"}
                            </div>
                          )}

                          <div className="message-meta">
                            <span className="message-time">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {!message.deletedAt && message.updatedAt !== message.createdAt && (
                              <span className="message-edited">edited</span>
                            )}

                            {!isPending && isMe && <MessageStatus status={status} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {outboxForSelectedChat.map((item) => (
                    <div key={item.clientId} className="message-row me outbox">
                      <div className="message-bubble me outbox">
                        {item.image && (
                          <div className="outbox-image">
                            <img
                              src={URL.createObjectURL(item.image)}
                              alt="Pending upload"
                              onLoad={(event) => {
                                const target = event.currentTarget;
                                URL.revokeObjectURL(target.src);
                              }}
                            />
                          </div>
                        )}

                        {item.content && <div className="message-content">{item.content}</div>}

                        <div className="outbox-meta">
                          {item.status === "queued"
                            ? "Queued (offline)"
                            : item.status === "sending"
                              ? item.uploadProgress != null
                                ? `Uploading ${item.uploadProgress}%`
                                : "Sending..."
                              : item.error || "Failed to send"}
                        </div>

                        {item.status === "sending" && item.uploadProgress != null && (
                          <div className="outbox-progress">
                            <div
                              className="outbox-progress-bar"
                              style={{ width: `${item.uploadProgress}%` }}
                            />
                          </div>
                        )}

                        <div className="outbox-actions">
                          {item.status === "failed" && (
                            <button
                              type="button"
                              className="message-action-btn search-nav-btn"
                              onClick={() => void handleRetryOutboxItem(item)}
                            >
                              Retry
                            </button>
                          )}
                          {item.status === "sending" && (
                            <button
                              type="button"
                              className="message-action-btn danger"
                              onClick={() => handleCancelOutboxUpload(item.clientId)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeChatTab === "chat" && typingUser && (
                    <div className="typing-indicator">
                      {typingUser.name || "Someone"} is typing...
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="composer">
              {(editingMessageId || isRescheduling) && (
                <div className="edit-banner">
                  <span>
                    {isRescheduling ? "Rescheduling message" : "Editing message"}
                  </span>
                  <button
                    type="button"
                    className="message-action-btn"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {selectedImage && (
                <div className="composer-preview">
                  <span>{selectedImage.name}</span>
                  <button
                    type="button"
                    className="message-action-btn danger"
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove image
                  </button>
                </div>
              )}

              <div className="composer-toolbar">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={(event) => {
                    setSelectedImage(event.target.files?.[0] || null);
                  }}
                />
                {(showComposerTools || isRescheduling || scheduledFor || selectedImage) && (
                  <div className="composer-tools-panel">
                    {!isRescheduling && selectedImage && (
                      <span className="schedule-helper-text">
                        Image attached and ready to send.
                      </span>
                    )}
                    {isRescheduling && (
                      <button
                        type="button"
                        className="message-action-btn search-nav-btn"
                        onClick={() => openScheduleModal("reschedule")}
                      >
                        Change scheduled time
                      </button>
                    )}
                    {scheduledFor && (
                      <span className="schedule-chip">
                        {new Date(scheduledFor).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {scheduledFor && (
                      <button
                        type="button"
                        className="message-action-btn search-nav-btn"
                        onClick={() => setScheduledFor("")}
                      >
                        Clear schedule
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="composer-main-row">
                <div className="composer-shell">
                  <button
                    type="button"
                    className="composer-icon-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowEmojiPicker((prev) => !prev);
                      setShowComposerTools(false);
                    }}
                    aria-label="Open emoji picker"
                  >
                    😊
                  </button>
                  <input
                    ref={inputRef}
                    className="composer-input"
                    value={editingMessageId || isRescheduling ? editingContent : content}
                    onChange={(e) =>
                      editingMessageId || isRescheduling
                        ? setEditingContent(e.target.value)
                        : handleTypingChange(e.target.value)
                    }
                    placeholder={
                      editingMessageId
                        ? "Edit your message..."
                        : isRescheduling
                          ? "Update your scheduled message..."
                          : "Message"
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editingMessageId) {
                          void handleSaveEdit();
                        } else if (isRescheduling) {
                          void handleSaveReschedule();
                        } else {
                          void handleSend();
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="composer-icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image"
                  >
                    📎
                  </button>
                </div>
                <button
                  className="send-btn compact-send-btn"
                  onClick={() => {
                    if (editingMessageId) {
                      void handleSaveEdit();
                    } else if (isRescheduling) {
                      void handleSaveReschedule();
                    } else {
                      void handleSend();
                    }
                  }}
                  onContextMenu={(event) => {
                    if (editingMessageId || isRescheduling) {
                      return;
                    }

                    event.preventDefault();
                    setContextMenu({
                      type: "send",
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  disabled={isComposerSubmitDisabled}
                  title="Right-click to schedule"
                >
                  {editingMessageId
                    ? "Save"
                    : isRescheduling
                      ? "Update"
                      : sendingMessage
                        ? "..."
                        : "➤"}
                </button>
              </div>

              {showEmojiPicker && (
                <div className="emoji-picker-popover" onClick={(event) => event.stopPropagation()}>
                  <div className="emoji-picker-header">
                    <strong>Emoji</strong>
                    <span>Pick one to insert</span>
                  </div>
                  <div className="emoji-picker-grid">
                    {EMOJI_PICKER_ITEMS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="emoji-picker-item"
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {contextMenu && (
        <div
          className="context-menu-popover"
          style={{
            left: `${Math.min(contextMenu.x, window.innerWidth - 240)}px`,
            top: `${Math.min(contextMenu.y, window.innerHeight - 240)}px`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {contextMenu.type === "send" ? (
            <>
              <div className="context-menu-section-label">Message options</div>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  openScheduleModal("compose");
                  setContextMenu(null);
                }}
              >
                Schedule message
              </button>
              {scheduledFor && (
                <button
                  type="button"
                  className="context-menu-item"
                  onClick={() => {
                    setScheduledFor("");
                    setContextMenu(null);
                  }}
                >
                  Clear schedule
                </button>
              )}
              {selectedImage && (
                <button
                  type="button"
                  className="context-menu-item danger"
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    setContextMenu(null);
                  }}
                >
                  Remove image
                </button>
              )}
            </>
          ) : (
            <>
              {(() => {
                const { actions, reactionSummary } = getContextMenuActions(contextMenu.message);

                return (
                  <>
                    <div className="context-menu-reactions">
                      {REACTION_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="reaction-chip"
                          onClick={() => {
                            void handleReactToMessage(contextMenu.message.id, emoji);
                            setContextMenu(null);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="reaction-chip reaction-chip-more"
                        aria-label="More reactions"
                      >
                        ˅
                      </button>
                    </div>

                    <div className="context-menu-actions">
                      {actions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          className={`context-menu-item${action.danger ? " danger" : ""}`}
                          onClick={action.onClick}
                        >
                          <span className="context-menu-item-icon" aria-hidden="true">
                            {action.icon}
                          </span>
                          <span className="context-menu-item-label">{action.label}</span>
                        </button>
                      ))}
                    </div>

                    {reactionSummary.length > 0 && (
                      <div className="context-menu-footer">
                        <span className="context-menu-footer-icon" aria-hidden="true">
                          ♡
                        </span>
                        <span className="context-menu-footer-label">
                          {reactionSummary.reduce((total, reaction) => total + reaction.count, 0)} reaction
                          {reactionSummary.reduce((total, reaction) => total + reaction.count, 0) === 1
                            ? ""
                            : "s"}
                        </span>
                        <div className="context-menu-footer-reactions">
                          {reactionSummary.map((reaction) => (
                            <span key={reaction.emoji} className="context-menu-footer-reaction">
                              {reaction.emoji} {reaction.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {showScheduleModal && (
        <div className="schedule-modal-overlay" onClick={closeScheduleModal}>
          <div
            className="schedule-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="schedule-modal-header">
              <button
                type="button"
                className="schedule-nav-btn close"
                onClick={closeScheduleModal}
              >
                ×
              </button>
              <strong>
                {scheduleMonth.toLocaleDateString([], {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <div className="schedule-nav-group">
                <button
                  type="button"
                  className="schedule-nav-btn"
                  onClick={() =>
                    setScheduleMonth(
                      new Date(scheduleMonth.getFullYear(), scheduleMonth.getMonth() - 1, 1)
                    )
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="schedule-nav-btn"
                  onClick={() =>
                    setScheduleMonth(
                      new Date(scheduleMonth.getFullYear(), scheduleMonth.getMonth() + 1, 1)
                    )
                  }
                >
                  ›
                </button>
              </div>
            </div>

            <div className="schedule-weekdays">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="schedule-calendar-grid">
              {scheduleCalendarDays.map((day) => {
                const isCurrentMonth = day.getMonth() === scheduleMonth.getMonth();
                const isSelected = day.toDateString() === scheduleDraft.toDateString();

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={`schedule-day-btn ${
                      isCurrentMonth ? "" : "outside"
                    } ${isSelected ? "selected" : ""}`}
                    onClick={() => handleScheduleDaySelect(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="schedule-time-row">
              <select
                className="schedule-time-select"
                value={String(scheduleDraft.getHours()).padStart(2, "0")}
                onChange={(event) =>
                  handleScheduleTimePartChange("hour", event.target.value)
                }
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={String(hour).padStart(2, "0")}>
                    {String(hour).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="schedule-time-separator">:</span>
              <select
                className="schedule-time-select"
                value={String(scheduleDraft.getMinutes()).padStart(2, "0")}
                onChange={(event) =>
                  handleScheduleTimePartChange("minute", event.target.value)
                }
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <option key={minute} value={String(minute).padStart(2, "0")}>
                    {String(minute).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            <div className="schedule-repeat-label">Repeat: Never</div>

            <button
              type="button"
              className="schedule-primary-btn"
              onClick={applyScheduleDraft}
            >
              {formatScheduleActionLabel(scheduleDraft)}
            </button>

            {scheduledFor && (
              <button
                type="button"
                className="schedule-secondary-btn"
                onClick={() => {
                  setScheduledFor("");
                  closeScheduleModal();
                }}
              >
                Clear schedule
              </button>
            )}
          </div>
        </div>
      )}

      {imageViewerMessage && (
        <div
          className="image-viewer-overlay"
          onClick={() => setImageViewerMessage(null)}
        >
          <div
            className="image-viewer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-viewer-header">
              <div className="image-viewer-meta">
                <UserAvatar
                  user={imageViewerMessage.sender}
                  avatarClassName="profile-avatar"
                />
                <div className="image-viewer-text">
                  <strong>
                    {imageViewerMessage.sender.firstName}{" "}
                    {imageViewerMessage.sender.lastName}
                  </strong>
                  <span>
                    {new Date(imageViewerMessage.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="image-viewer-actions">
                <button
                  type="button"
                  className="image-viewer-btn"
                  onClick={() => downloadMessageImage(imageViewerMessage)}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="image-viewer-btn close"
                  onClick={() => setImageViewerMessage(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="image-viewer-stage">
              <img
                src={getAssetUrl(imageViewerMessage.imageUrl) || ""}
                alt="Opened media"
                className="image-viewer-media"
              />
            </div>
          </div>
        </div>
      )}

      {isGroupSettingsOpen && selectedChat?.type === "group" && (
        <div className="profile-drawer-overlay" onClick={() => setIsGroupSettingsOpen(false)}>
          <aside
            className="profile-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-drawer-header">
              <h3>{selectedChat.name || "Group settings"}</h3>
              <button
                type="button"
                className="profile-drawer-close"
                onClick={() => setIsGroupSettingsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="profile-drawer-section">
              <span className="profile-drawer-label">Your role</span>
              <div className="group-role-summary">
                <strong>{selectedChat.name || "This group"}</strong>
                <span className={`role-pill ${selectedParticipant?.role?.toLowerCase() || "member"}`}>
                  {getRoleLabel(selectedParticipant?.role)}
                </span>
              </div>
            </div>

            {(selectedParticipant?.role === "OWNER" || selectedParticipant?.role === "ADMIN") && (
              <div className="profile-drawer-section">
                <span className="profile-drawer-label">Group appearance</span>
                <div className="group-settings-hero">
                  <UserAvatar
                    user={getGroupAvatarUser(groupSettingsName || selectedChat.name, selectedChat.photoUrl)}
                    avatarClassName="profile-avatar"
                    pixelSize={72}
                  />
                  <div className="group-settings-fields">
                    <input
                      className="chat-input group-name-input"
                      value={groupSettingsName}
                      onChange={(event) => setGroupSettingsName(event.target.value)}
                      placeholder="Group name"
                    />
                    <div className="group-photo-row">
                      <input
                        ref={groupPhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden-file-input"
                        onChange={(event) =>
                          setGroupSettingsPhoto(event.target.files?.[0] || null)
                        }
                      />
                      <button
                        type="button"
                        className="message-action-btn search-nav-btn"
                        onClick={() => groupPhotoInputRef.current?.click()}
                      >
                        Change photo
                      </button>
                      {groupSettingsPhoto && (
                        <span className="selected-file-name">{groupSettingsPhoto.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-btn group-save-btn"
                  onClick={() => void handleSaveGroupDetails()}
                  disabled={groupSettingsName.trim().length < 2}
                >
                  Save changes
                </button>
              </div>
            )}

            <div className="profile-drawer-section">
              <span className="profile-drawer-label">Overview</span>
              <div className="group-overview-grid">
                <div className="group-overview-card">
                  <strong>{selectedChat.participants.length}</strong>
                  <span>Members</span>
                </div>
                <div className="group-overview-card">
                  <strong>{groupAdminCount}</strong>
                  <span>Admins</span>
                </div>
                <div className="group-overview-card">
                  <strong>{groupPendingInviteCount}</strong>
                  <span>Pending</span>
                </div>
              </div>
            </div>

            <div className="profile-drawer-section">
              <span className="profile-drawer-label">Members</span>
              <div className="member-list">
                {selectedChat.participants.map((participant: ChatParticipant) => (
                  <div key={participant.id} className="member-card">
                    <div className="member-card-main">
                      <UserAvatar
                        user={participant.user}
                        showOnline
                        isOnline={getUserPresence(participant.user.id) !== "offline"}
                      />
                      <div className="user-card-info">
                        <div className="member-card-title">
                          <strong>
                            {participant.user.firstName} {participant.user.lastName}
                          </strong>
                          <span className={`role-pill ${participant.role.toLowerCase()}`}>
                            {getRoleLabel(participant.role)}
                          </span>
                        </div>
                        <span>@{participant.user.username}</span>
                      </div>
                    </div>

                    {participant.userId !== user?.id && (
                      <div className="member-actions">
                        {canManageRoles && participant.role !== "OWNER" && (
                          <button
                            type="button"
                            className="message-action-btn search-nav-btn"
                            onClick={() =>
                              void handleChangeRole(
                                participant.id,
                                participant.role === "ADMIN" ? "MEMBER" : "ADMIN"
                              )
                            }
                          >
                            {participant.role === "ADMIN" ? "Make member" : "Make admin"}
                          </button>
                        )}
                        {canManageMembers && participant.role !== "OWNER" && (
                          <button
                            type="button"
                            className="message-action-btn danger"
                            onClick={() => void handleRemoveParticipant(participant.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedChat.invites && selectedChat.invites.length > 0 && (
              <div className="profile-drawer-section">
                <span className="profile-drawer-label">Pending invites</span>
                <div className="member-list">
                  {selectedChat.invites.map((invite) => (
                    <div key={invite.id} className="member-card">
                      <div className="member-card-main">
                        <UserAvatar user={invite.user} />
                        <div className="user-card-info">
                          <div className="member-card-title">
                            <strong>
                              {invite.user?.firstName} {invite.user?.lastName}
                            </strong>
                            <span className="invite-state-pill">Pending</span>
                          </div>
                          <span>
                            @{invite.user?.username} • invited by{" "}
                            {invite.invitedBy?.firstName || "someone"}
                          </span>
                          <small>
                            {new Date(invite.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="danger-btn"
              onClick={() => void handleLeaveGroup()}
            >
              Leave group
            </button>
          </aside>
        </div>
      )}

      {isGroupModalOpen && (
        <div className="profile-drawer-overlay" onClick={handleCloseGroupModal}>
          <aside
            className="profile-drawer group-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-drawer-header">
              <h3>{groupMode === "create" ? "Create group" : "Invite members"}</h3>
              <button
                type="button"
                className="profile-drawer-close"
                onClick={handleCloseGroupModal}
              >
                Close
              </button>
            </div>

            {groupMode === "create" && (
              <div className="profile-drawer-section">
                <span className="profile-drawer-label">Group name</span>
                <input
                  className="chat-input"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Weekend crew"
                />
              </div>
            )}

            <div className="profile-drawer-section">
              <span className="profile-drawer-label">Find people</span>
              <div className="search-row">
                <input
                  className="chat-input"
                  value={groupSearch}
                  onChange={(event) => setGroupSearch(event.target.value)}
                  placeholder="Search users..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleSearchGroupUsers();
                    }
                  }}
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => void handleSearchGroupUsers()}
                  disabled={searchingGroupUsers}
                >
                  {searchingGroupUsers ? "..." : "Search"}
                </button>
              </div>
            </div>

            <div className="group-selection-list">
              {groupUsers.length === 0 ? (
                <div className="empty-text">
                  Search for users, then pick the people you want to include.
                </div>
              ) : (
                groupUsers.map((candidate) => (
                  <label key={candidate.id} className="group-selection-item">
                    <div className="group-selection-user">
                      <UserAvatar
                        user={candidate}
                        showOnline
                        isOnline={getUserPresence(candidate.id) !== "offline"}
                      />
                      <div className="user-card-info">
                        <strong>
                          {candidate.firstName} {candidate.lastName}
                        </strong>
                        <span>
                          @{candidate.username} • {getUserPresence(candidate.id)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedGroupUserIds.includes(candidate.id)}
                      onChange={() => toggleGroupUser(candidate.id)}
                    />
                  </label>
                ))
              )}
            </div>

            <button
              type="button"
              className="primary-btn group-submit-btn"
              onClick={() => void handleSubmitGroup()}
              disabled={
                selectedGroupUserIds.length === 0 ||
                (groupMode === "create" && groupName.trim().length < 2)
              }
            >
              {groupMode === "create" ? "Create group chat" : "Send invitations"}
            </button>
          </aside>
        </div>
      )}

      {(profileDrawerUser || loadingProfileDrawer) && (
        <div className="profile-drawer-overlay" onClick={handleCloseUserDetails}>
          <aside
            className="profile-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-drawer-header">
              <h3>User details</h3>
              <button
                type="button"
                className="profile-drawer-close"
                onClick={handleCloseUserDetails}
              >
                Close
              </button>
            </div>

            {loadingProfileDrawer ? (
              <div className="empty-text">Loading user details...</div>
            ) : profileDrawerUser ? (
              <div className="profile-drawer-content">
                <div className="profile-drawer-hero">
                  <UserAvatar
                    user={profileDrawerUser}
                    avatarClassName="profile-avatar"
                    pixelSize={88}
                  />
                  <div className="profile-drawer-meta">
                    <strong>
                      {profileDrawerUser.firstName} {profileDrawerUser.lastName}
                    </strong>
                    <span>@{profileDrawerUser.username}</span>
                  </div>
                </div>

                <div className="profile-drawer-section">
                  <span className="profile-drawer-label">Email</span>
                  <strong>{profileDrawerUser.email}</strong>
                </div>

                <div className="profile-drawer-section">
                  <span className="profile-drawer-label">Email status</span>
                  <strong>
                    {profileDrawerUser.emailVerified ? "Verified" : "Not verified"}
                  </strong>
                </div>

                <div className="profile-drawer-section">
                  <span className="profile-drawer-label">Joined</span>
                  <strong>
                    {profileDrawerUser.createdAt
                      ? new Date(profileDrawerUser.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </strong>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

