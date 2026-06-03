import { useNavigate } from "react-router-dom";
import { Mail, Phone } from "lucide-react";

const PasswordResetSent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-10 text-center w-full">

        <div className="w-16 h-16 rounded-full bg-info/15 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-info" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground">Check Your Email</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Password reset instructions have been sent to your registered email address and phone number.
        </p>

        <div className="bg-secondary border border-border rounded-xl p-4 mt-6 text-left space-y-3">
          <p className="text-xs font-semibold text-foreground">Instructions sent to:</p>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Your registered work email</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Your registered phone number via SMS</p>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mt-4">
          <p className="text-xs text-warning">
            The reset link expires in 24 hours. If you do not receive instructions contact IT Support.
          </p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mt-6"
        >
          Back to Login
        </button>

        <p className="text-xs text-muted-foreground mt-4">
          Did not receive instructions?{" "}
          <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate("/login")}>
            Try again
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          IT Support:{" "}
          <span className="text-primary">support@migeprof.gov.rw</span>
        </p>

      </div>
    </div>
  );
};

export default PasswordResetSent;
