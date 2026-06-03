import { useMemo, useState } from "react";
import { Edit2, Eye, Plus, Send, Trash2, X } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  useCreateTemplateNotificationMutation,
  useDeleteTemplateNotificationMutation,
  useGetTemplateNotificationsQuery,
  useSendTemplateNotificationTestMutation,
  useUpdateTemplateNotificationMutation,
} from "@/store/api";
import { toast } from "sonner";

interface TemplateNotification {
  id: string;
  name: string;
  trigger?: string;
  subject?: string;
  body?: string;
  language?: "en" | "rw";
  channel?: "email" | "sms" | "both";
  active?: boolean;
  lastSent?: string;
  sentCount?: number;
}

const CaseNotifications = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState<TemplateNotification | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateNotification | null>(null);
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formChannel, setFormChannel] = useState<"email" | "sms" | "both">("both");
  const [formLanguage, setFormLanguage] = useState<"en" | "rw">("en");
  const { data, isLoading, error, refetch } = useGetTemplateNotificationsQuery();
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateNotificationMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateNotificationMutation();
  const [deleteTemplate] = useDeleteTemplateNotificationMutation();
  const [sendTest] = useSendTemplateNotificationTestMutation();

  const templates = (data?.data ?? []) as TemplateNotification[];

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter((item) => item.active).length,
    sent: templates.reduce((sum, item) => sum + (item.sentCount ?? 0), 0),
  }), [templates]);

  const openNewModal = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormTrigger("");
    setFormSubject("");
    setFormBody("");
    setFormChannel("both");
    setFormLanguage("en");
    setShowModal(true);
  };

  const openEditModal = (template: TemplateNotification) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormTrigger(template.trigger || "");
    setFormSubject(template.subject || "");
    setFormBody(template.body || "");
    setFormChannel(template.channel || "both");
    setFormLanguage(template.language || "en");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formSubject || !formBody) {
      toast.error("Fill in the required fields.");
      return;
    }

    const payload = {
      name: formName,
      trigger: formTrigger,
      subject: formSubject,
      body: formBody,
      channel: formChannel,
      language: formLanguage,
      active: editingTemplate?.active ?? true,
    };

    try {
      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, body: payload }).unwrap();
        toast.success("Template updated");
      } else {
        await createTemplate(payload).unwrap();
        toast.success("Template created");
      }
      setShowModal(false);
      await refetch();
    } catch {
      toast.error("Unable to save template");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id).unwrap();
      toast.success("Template deleted");
      await refetch();
    } catch {
      toast.error("Unable to delete template");
    }
  };

  const handleToggleActive = async (template: TemplateNotification) => {
    try {
      await updateTemplate({
        id: template.id,
        body: {
          name: template.name,
          trigger: template.trigger,
          subject: template.subject,
          body: template.body,
          channel: template.channel,
          language: template.language,
          active: !template.active,
        },
      }).unwrap();
      toast.success(`Template ${template.active ? "deactivated" : "activated"}`);
      await refetch();
    } catch {
      toast.error("Unable to update template");
    }
  };

  const handleTestSend = async (template: TemplateNotification) => {
    try {
      await sendTest(template.id).unwrap();
      toast.success(`Test notification sent for "${template.name}"`);
      await refetch();
    } catch {
      toast.error("Unable to send test notification");
    }
  };

  const channelBadge = (channel?: string) => {
    const map = {
      email: "bg-info/10 text-info border-info/20",
      sms: "bg-success/10 text-success border-success/20",
      both: "bg-primary/10 text-primary border-primary/20",
    } as const;
    return map[(channel as keyof typeof map) || "both"];
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Case Progress Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage message templates used for case updates.</p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "TOTAL TEMPLATES", value: stats.total, color: "text-foreground" },
              { label: "ACTIVE", value: stats.active, color: "text-success" },
              { label: "TOTAL SENT", value: stats.sent, color: "text-primary" },
              { label: "CHANNELS", value: "Email + SMS", color: "text-info" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-heading text-base font-semibold text-foreground">Notification Templates</h3>
              <button onClick={openNewModal} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" />
                New Template
              </button>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Loading templates...</div>
            ) : error ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm text-foreground">Unable to load templates.</p>
                <button onClick={() => void refetch()} className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground">Retry</button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {templates.map((template) => (
                  <div key={template.id} className={`p-4 hover:bg-secondary/30 transition-colors ${!template.active ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-foreground">{template.name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${channelBadge(template.channel)}`}>
                            {template.channel === "both" ? "Email + SMS" : (template.channel || "both").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{template.trigger}</p>
                        <p className="text-xs text-foreground/70 font-mono truncate">Subject: {template.subject}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setShowPreview(template)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => void handleTestSend(template)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><Send className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => openEditModal(template)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => void handleToggleActive(template)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-xs">
                          {template.active ? "Off" : "On"}
                        </button>
                        <button onClick={() => void handleDelete(template.id)} className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-heading text-lg font-semibold text-foreground">{editingTemplate ? "Edit Template" : "New Notification Template"}</h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" placeholder="Template name" value={formName} onChange={(event) => setFormName(event.target.value)} />
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" placeholder="Trigger event" value={formTrigger} onChange={(event) => setFormTrigger(event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={formChannel} onChange={(event) => setFormChannel(event.target.value as "email" | "sms" | "both")}>
                  <option value="both">Email + SMS</option>
                  <option value="email">Email only</option>
                  <option value="sms">SMS only</option>
                </select>
                <select className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={formLanguage} onChange={(event) => setFormLanguage(event.target.value as "en" | "rw")}>
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
              </div>
              <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" placeholder="Email subject" value={formSubject} onChange={(event) => setFormSubject(event.target.value)} />
              <textarea rows={8} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm resize-none" placeholder="Message body" value={formBody} onChange={(event) => setFormBody(event.target.value)} />
            </div>

            <div className="flex items-center gap-3 p-5 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-lg bg-secondary border border-border text-sm text-foreground">Cancel</button>
              <button disabled={isCreating || isUpdating} onClick={() => void handleSave()} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {editingTemplate ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(null)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-heading text-base font-semibold text-foreground">Template Preview</h3>
              <button onClick={() => setShowPreview(null)} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-secondary border border-border rounded-xl p-4">
                <p className="label-text mb-1">SUBJECT</p>
                <p className="text-sm font-medium text-foreground">{showPreview.subject}</p>
              </div>
              <div className="bg-secondary border border-border rounded-xl p-4">
                <p className="label-text mb-2">MESSAGE BODY</p>
                <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">{showPreview.body}</pre>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button onClick={() => { void handleTestSend(showPreview); setShowPreview(null); }} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Test Notification
              </button>
              <button onClick={() => setShowPreview(null)} className="h-10 px-4 rounded-lg bg-secondary border border-border text-sm text-foreground">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseNotifications;
