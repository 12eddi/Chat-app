import type { Message } from "../types/chat";
import { getMessageStatusMeta } from "../utils/messageStatus";

type MessageStatusProps = {
  status?: Message["status"] | null;
};

export default function MessageStatus({ status }: MessageStatusProps) {
  const meta = getMessageStatusMeta(status);

  return (
    <span
      className={`message-status ${meta.className}`}
      aria-label={meta.label}
      title={meta.label}
    >
      <span className="message-status-icon" aria-hidden="true">
        {meta.icon}
      </span>
    </span>
  );
}
