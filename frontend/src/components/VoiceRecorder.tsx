import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob | null) => void;
}

type RecorderState = "idle" | "recording" | "recorded";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [state, setState]       = useState<RecorderState>("idle");
  const [elapsed, setElapsed]   = useState(0);
  const [playing, setPlaying]   = useState(false);
  const [blob, setBlob]         = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      audioUrl && URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const recorded = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(recorded);
        setBlob(recorded);
        setAudioUrl(url);
        onRecorded(recorded);
        setState("recorded");
      };
      mr.start();
      mediaRef.current = mr;
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      /* microphone denied — silently stay idle */
    }
  };

  const stopRecording = () => {
    timerRef.current && clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const deleteRecording = () => {
    audioUrl && URL.revokeObjectURL(audioUrl);
    setBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setPlaying(false);
    setState("idle");
    onRecorded(null);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  /* ── idle ── */
  if (state === "idle") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 bg-secondary border border-border rounded-xl">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Mic className="w-6 h-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Record your statement</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Tap the button to start recording</p>
        </div>
        <button
          onClick={startRecording}
          className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors duration-200"
        >
          <Mic className="w-4 h-4" /> Start Recording
        </button>
      </div>
    );
  }

  /* ── recording ── */
  if (state === "recording") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 bg-destructive/5 border border-destructive/20 rounded-xl">
        <div className="relative w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center">
          <Mic className="w-6 h-6 text-destructive" />
          <span className="absolute inset-0 rounded-full border-2 border-destructive animate-ping opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Recording…</p>
          <p className="font-mono text-lg font-bold text-destructive">{formatTime(elapsed)}</p>
        </div>
        <button
          onClick={stopRecording}
          className="h-9 px-5 rounded-lg bg-destructive text-white text-sm font-medium flex items-center gap-2 hover:bg-destructive/90 transition-colors duration-200"
        >
          <Square className="w-3.5 h-3.5 fill-white" /> Stop
        </button>
      </div>
    );
  }

  /* ── recorded ── */
  return (
    <div className="flex flex-col items-center gap-3 py-6 bg-success/5 border border-success/20 rounded-xl">
      <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
        <Mic className="w-6 h-6 text-success" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Recording saved</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(elapsed)} recorded</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayback}
          className="h-9 px-4 rounded-lg bg-secondary border border-border text-sm text-foreground flex items-center gap-2 hover:bg-secondary/80 transition-colors duration-200"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Pause" : "Play Back"}
        </button>
        <button
          onClick={deleteRecording}
          className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors duration-200"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      {blob && (
        <p className="text-[10px] text-success">
          {(blob.size / 1024).toFixed(0)} KB · audio/webm
        </p>
      )}
    </div>
  );
}
