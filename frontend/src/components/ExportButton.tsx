import { useState } from "react";
import { Download, FileText, ChevronDown, Eye, X } from "lucide-react";

interface ExportButtonProps {
  onExportPDF: () => void;
  onExportCSV: () => void;
  label?: string;
  previewTitle?: string;
  previewRows?: Record<string, unknown>[];
  disabled?: boolean;
  disabledMessage?: string;
}

export function ExportButton({
  onExportPDF,
  onExportCSV,
  label = "Export",
  previewTitle = "Export Preview",
  previewRows = [],
  disabled = false,
  disabledMessage = "Export is not available.",
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewHeaders = Object.keys(previewRows[0] ?? {}).slice(0, 8);

  const openPreview = () => {
    if (disabled) return;
    setOpen(false);
    setPreviewOpen(true);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        title={disabled ? disabledMessage : undefined}
        className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden w-40">
            <button
              onClick={openPreview}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              Review Report
            </button>
            <button
              onClick={openPreview}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-destructive" />
              Export as PDF
            </button>
            <button
              onClick={openPreview}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-success" />
              Export as CSV
            </button>
          </div>
        </>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[min(900px,calc(100vw-32px))] max-h-[80vh] bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">{previewTitle}</p>
                <p className="text-[10px] text-muted-foreground">{previewRows.length} row(s) ready for export</p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-background"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {previewRows.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">No rows are available to preview.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {previewHeaders.map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.slice(0, 25).map((row, index) => (
                      <tr key={index}>
                        {previewHeaders.map((header) => (
                          <td key={header} className="px-4 py-2.5 text-muted-foreground max-w-[220px] truncate">
                            {String(row[header] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={() => onExportCSV()}
                className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-foreground hover:bg-background"
              >
                Export CSV
              </button>
              <button
                onClick={() => onExportPDF()}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
