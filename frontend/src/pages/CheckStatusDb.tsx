import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, FolderOpen, MessageCircle, Search, Send, Shield, User } from "lucide-react";
import { toast } from "sonner";
import {
  useLazyGetAnonymousChatQuery,
  useLazyGetAnonymousReportStatusQuery,
  useSendAnonymousChatMessageMutation,
} from "@/store/api";

const STEPS = [
  { label: "Report Received", Icon: CheckCircle2 },
  { label: "Under Review", Icon: Clock },
  { label: "Case Closed", Icon: FolderOpen },
];

type AnonymousReportStatus = {
  reference?: string;
  reportType?: string;
  reportedAt?: string;
  aCase?: {
    caseId?: string;
    status?: string;
  };
};

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

function getCurrentStep(status?: string) {
  const normalized = (status ?? "").trim().toUpperCase().replaceAll(" ", "_");
  if (["CLOSED", "RESOLVED", "COMPLETED"].includes(normalized)) return 2;
  if (["UNDER_REVIEW", "IN_REVIEW", "ASSIGNED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(normalized)) return 1;
  return 0;
}

function getStatusCopy(status?: string) {
  const normalized = (status ?? "").trim().toUpperCase().replaceAll(" ", "_");
  if (["CLOSED", "RESOLVED", "COMPLETED"].includes(normalized)) {
    return {
      title: "Your report has been closed",
      body: "The anonymous incident report completed review. If more action was needed, it has already been recorded by the case team.",
    };
  }
  if (["UNDER_REVIEW", "IN_REVIEW", "ASSIGNED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(normalized)) {
    return {
      title: "Your report is under review",
      body: "A case officer is currently reviewing the anonymous incident report and any supporting evidence you submitted.",
    };
  }
  return {
    title: "Your report has been received",
    body: "The anonymous incident report was recorded successfully and is waiting for case review.",
  };
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not available";
  return d.toLocaleString("en-RW", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const CheckStatusDb = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lookupStatus, { isFetching }] = useLazyGetAnonymousReportStatusQuery();
  const [lookupChat] = useLazyGetAnonymousChatQuery();
  const [sendMessage, { isLoading: isSending }] = useSendAnonymousChatMessageMutation();

  const [refInput, setRefInput] = useState("");
  const [checkedRef, setCheckedRef] = useState("");
  const [result, setResult] = useState<AnonymousReportStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [chat, setChat] = useState<ChatState | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [chat?.messages]);

  const loadChat = async (reference: string) => {
    try {
      const res = await lookupChat(reference).unwrap();
      if (res?.success && res?.data) setChat(res.data);
    } catch { /* silently ignore */ }
  };

  const handleCheck = async (value?: string) => {
    const reference = (value ?? refInput).trim().toUpperCase();
    if (!reference) return;

    setCheckedRef(reference);
    setChat(null);
    setInput("");

    try {
      const response = await lookupStatus(reference).unwrap();
      if (!response?.success || !response?.data) {
        setResult(null);
        setNotFound(true);
        return;
      }
      setResult(response.data);
      setNotFound(false);
      await loadChat(reference);
    } catch {
      setResult(null);
      setChat(null);
      setNotFound(true);
      toast.error("Unable to check the anonymous report status right now.");
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!checkedRef || !result) return;
    const interval = setInterval(() => void loadChat(checkedRef), 5000);
    return () => clearInterval(interval);
  }, [checkedRef, result]);

  useEffect(() => {
    const ref = searchParams.get("ref") || searchParams.get("caseId");
    if (!ref) return;
    setRefInput(ref.toUpperCase());
    void handleCheck(ref);
  }, [searchParams]);

  const handleSend = async () => {
    const message = input.trim();
    if (!checkedRef || !message) return;

    try {
      const response = await sendMessage({ reference: checkedRef, message }).unwrap();
      if (response?.success && response?.data) {
        setChat(response.data);
        setInput("");
      } else {
        toast.error(response?.message || "Unable to send your message.");
      }
    } catch (error) {
      const msg = typeof error === "object" && error !== null && "data" in error
        ? ((error as { data?: { message?: string } }).data?.message ?? "Unable to send your message.")
        : "Unable to send your message.";
      toast.error(msg);
    }
  };

  const currentStep = getCurrentStep(result?.aCase?.status);
  const statusCopy = getStatusCopy(result?.aCase?.status);
  const officerName = chat?.assignedOfficerName;

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-4xl">

        <div className="flex flex-col items-center gap-2 text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground mt-1">Check Report Status</h1>
          <p className="text-xs text-muted-foreground">GBV Monitor · MIGEPROF · Government of Rwanda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">

          {/* Left — status */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Enter your reference or anonymous case ID</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Use either number returned after you submitted the anonymous incident report.
                </p>
                <div className="flex gap-2">
                  <input
                    autoComplete="off"
                    value={refInput}
                    onChange={(e) => { setRefInput(e.target.value); setNotFound(false); setResult(null); setCheckedRef(""); }}
                    onKeyDown={(e) => e.key === "Enter" && void handleCheck()}
                    placeholder="e.g. ANON-2026-4821"
                    className="flex-1 h-9 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200 font-mono"
                  />
                  <button
                    onClick={() => void handleCheck()}
                    disabled={!refInput.trim() || isFetching}
                    className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" /> {isFetching ? "Checking..." : "Check Status"}
                  </button>
                </div>
              </div>
            </div>

            {checkedRef && (
              <div className="border-t border-border">
                {notFound || !result ? (
                  <div className="px-6 py-5 text-center">
                    <p className="text-sm font-medium text-destructive mb-1">Reference not found</p>
                    <p className="text-xs text-muted-foreground">
                      The number <span className="font-mono text-foreground">{checkedRef}</span> does not match a stored anonymous report.
                    </p>
                  </div>
                ) : (
                  <div className="px-6 py-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="label-text">REFERENCE</p>
                      <span className="font-mono text-sm font-semibold text-foreground">{result.reference ?? checkedRef}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="label-text">ANONYMOUS CASE ID</p>
                      <span className="font-mono text-sm font-semibold text-foreground">{result.aCase?.caseId ?? "Pending"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-secondary border border-border rounded-lg px-3 py-2">
                        <p className="label-text mb-1">STATUS</p>
                        <p className="text-foreground font-medium">{result.aCase?.status ?? "FILED"}</p>
                      </div>
                      <div className="bg-secondary border border-border rounded-lg px-3 py-2">
                        <p className="label-text mb-1">SUBMITTED</p>
                        <p className="text-foreground font-medium">{formatDate(result.reportedAt)}</p>
                      </div>
                    </div>

                    <div className="relative flex items-start justify-between">
                      <div className="absolute top-4 h-px bg-border" style={{ left: "calc(16.67% - 8px)", right: "calc(16.67% - 8px)" }} />
                      {STEPS.map((step, index) => {
                        const { Icon } = step;
                        const isActive = index === currentStep;
                        const isComplete = index < currentStep;
                        return (
                          <div key={step.label} className="relative flex flex-col items-center gap-2 flex-1">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 ${
                              isComplete ? "bg-success/20 text-success border-success/30"
                                : isActive ? "bg-primary/20 text-primary border-primary/30"
                                : "bg-secondary text-muted-foreground border-border"
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <p className={`text-[11px] text-center ${isActive ? "text-foreground font-semibold" : isComplete ? "text-success" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                      <p className="text-xs text-foreground font-medium mb-0.5">{statusCopy.title}</p>
                      <p className="text-[11px] text-muted-foreground">{statusCopy.body}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — chat with officer */}
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-foreground">Chat with Case Officer</p>
                {officerName ? (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <User className="w-2.5 h-2.5" /> {officerName}
                  </p>
                ) : result ? (
                  <p className="text-[10px] text-muted-foreground">Waiting for officer assignment...</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Check your reference to open the chat.</p>
                )}
              </div>
            </div>

            {!result ? (
              <div className="flex-1 px-5 py-10 text-center text-sm text-muted-foreground">
                Check a valid anonymous reference first to open the chat.
              </div>
            ) : (
              <>
                <div className="h-[360px] overflow-y-auto p-4 space-y-3">
                  {!chat?.messages?.length ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground text-center">
                        {officerName
                          ? `${officerName} has been assigned. Send a message to start the conversation.`
                          : "No messages yet. Once an officer is assigned, you can chat here."}
                      </p>
                    </div>
                  ) : (
                    chat.messages.map((msg) => {
                      const isReporter = msg.sender === "REPORTER";
                      return (
                        <div key={msg.id} className={`flex ${isReporter ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] space-y-0.5`}>
                            {!isReporter && (
                              <p className="text-[9px] text-muted-foreground px-1">
                                {msg.senderDisplayName ?? "Case Officer"}
                              </p>
                            )}
                            <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                              isReporter
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary border border-border text-foreground"
                            }`}>
                              {msg.message}
                            </div>
                            {msg.createdAt && (
                              <p className={`text-[9px] text-muted-foreground px-1 ${isReporter ? "text-right" : ""}`}>
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

                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <input
                      autoComplete="off"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void handleSend()}
                      disabled={isSending}
                      placeholder="Type a message..."
                      className="h-9 flex-1 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors duration-200"
                    />
                    <button
                      onClick={() => void handleSend()}
                      disabled={!input.trim() || isSending}
                      className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors duration-200"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Your identity remains anonymous. Messages are visible only to the assigned officer.
                  </p>
                </div>
              </>
            )}
          </div>

        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <button onClick={() => navigate("/anonymous-report")} className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
            Submit a new report
          </button>
          <span className="text-border">·</span>
          <button onClick={() => navigate("/login")} className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
            Staff login
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckStatusDb;
