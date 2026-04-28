import type { Message } from "../types/chat";

export type MessageStatusValue = Message["status"];

export type MessageStatusMeta = {
  label: string;
  icon: string;
  className: string;
};

export const normalizeMessageStatus = (
  status?: MessageStatusValue | null
): MessageStatusValue => {
  return status || "SENT";
};

export const getMessageStatusMeta = (
  status?: MessageStatusValue | null
): MessageStatusMeta => {
  switch (normalizeMessageStatus(status)) {
    case "READ":
      return {
        label: "Read",
        icon: "\u2713\u2713",
        className: "read",
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        icon: "\u2713\u2713",
        className: "delivered",
      };
    case "SENT":
    default:
      return {
        label: "Sent",
        icon: "\u2713",
        className: "sent",
      };
  }
};
