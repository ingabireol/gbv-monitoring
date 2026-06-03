import { useRef, useState } from "react";
import { Upload, X, FileText, Image, Music, Video } from "lucide-react";

interface EvidenceUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
}

function FileIcon({ file }: { file: File }) {
  if (file.type.startsWith("image/")) return <Image className="w-3.5 h-3.5 text-info shrink-0" />;
  if (file.type.startsWith("audio/")) return <Music className="w-3.5 h-3.5 text-warning shrink-0" />;
  if (file.type.startsWith("video/")) return <Video className="w-3.5 h-3.5 text-primary shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = URL.createObjectURL(file);

  return (
    <div className="rounded-lg bg-secondary border border-border overflow-hidden">
      {file.type.startsWith("image/") && (
        <div className="relative w-full h-28 bg-background">
          <img
            src={url}
            alt={file.name}
            className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(url)}
          />
        </div>
      )}
      {file.type.startsWith("audio/") && (
        <div className="p-2">
          <audio controls src={url} className="w-full h-8" style={{ height: 32 }} />
        </div>
      )}
      {file.type.startsWith("video/") && (
        <div className="relative w-full bg-background">
          <video controls src={url} className="w-full max-h-32 object-contain" />
        </div>
      )}
      <div className="flex items-center gap-2 px-2.5 py-2">
        <FileIcon file={file} />
        <p className="text-xs text-foreground flex-1 truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground shrink-0">
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
        <button
          onClick={onRemove}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-border transition-colors duration-200 shrink-0"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export function EvidenceUpload({ files, onChange }: EvidenceUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    Array.from(incoming).forEach((f) => {
      if (f.size <= 10 * 1024 * 1024) next.push(f);
    });
    onChange(next);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors duration-200 ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"
        }`}
      >
        <Upload className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
        <p className="text-[10px] text-muted-foreground">Photos, audio, video, documents — max 10 MB each</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.pdf"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((f, i) => (
            <FilePreview key={i} file={f} onRemove={() => removeFile(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
