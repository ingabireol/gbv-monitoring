import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, User } from "lucide-react";
import { toast } from "sonner";
import { useLazyGetAnonymousCaseChatQuery, useSendAnonymousCaseChatReplyMutation } from "@/store/api";

type ChatMessage = {
  id: string;
  sender: "REPORTER" | "OFFICER" | "BOT";
  senderDisplayName?: string;
  message: string;
  createdAt?: string;
};

type ChatState = {
  reference?: string;
  caseId?: string;
  assignedOfficerName?: string | null;
  messages?: ChatMessage[];
};

interface Props {
  caseUuid: string;
}

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-RW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const AnonymousChatPanel = ({ caseUuid }: Props) => {
  const [fetchChat] = useLazyGetAnonymousCaseChatQuery();
  const [sendReply, { isLoading: isSending }] = useSendAnonymousCaseChatReplyMutation();
  const [chat, setChat] = useState<ChatState | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [chat?.messages]);

  const load = async () => {
    try {
      const res = await fetchChat(caseUuid).unwrap();
      if (res?.success && res?.data) {
        setChat(res.data);
        setError(null);
      } else {
        setError(res?.message ?? "No anonymous chat for this case.");
      }
    } catch {
      setError("No anonymous report linked to this case.");
    }
  };

  useEffect(() => {
    if (!caseUuid) return;
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => clearInterval(interval);
  }, [caseUuid]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || !caseUuid) return;

    try {
      const res = await sendReply({ caseId: caseUuid, message }).unwrap();
      if (res?.success && res?.data) {
        setChat(res.data);
        setInput("");
      } else {
        toast.error(res?.message ?? "Failed to send reply.");
      }
    } catch {
      toast.error("Failed to send reply.");
    }
  };

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <p className="label-text">ANONYMOUS REPORTER CHAT</p>
        </div>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <MessageCircle className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="label-text">ANONYMOUS REPORTER CHAT</p>
          {chat?.reference && (
            <p className="text-[10px] text-muted-foreground font-mono">{chat.reference}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <User className="w-3 h-3" />
          <span>Anonymous</span>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {!chat ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Loading chat...</p>
          </div>
        ) : !chat.messages?.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground text-center">
              No messages yet. The anonymous reporter can message you via their reference code.
            </p>
          </div>
        ) : (
          chat.messages.map((msg) => {
            const isOfficer = msg.sender === "OFFICER";
            return (
              <div key={msg.id} className={`flex ${isOfficer ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] space-y-0.5">
                  {!isOfficer && (
                    <p className="text-[9px] text-muted-foreground px-1">Anonymous Reporter</p>
                  )}
                  <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isOfficer
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary border border-border text-foreground"
                  }`}>
                    {msg.message}
                  </div>
                  {msg.createdAt && (
                    <p className={`text-[9px] text-muted-foreground px-1 ${isOfficer ? "text-right" : ""}`}>
                      {isOfficer && msg.senderDisplayName ? `${msg.senderDisplayName} · ` : ""}
                      {formatDate(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <input
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSend()}
          disabled={isSending}
          placeholder="Reply to anonymous reporter..."
          className="h-8 flex-1 rounded-lg bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors duration-200"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!input.trim() || isSending}
          className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors duration-200"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AnonymousChatPanel;
