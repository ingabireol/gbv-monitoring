import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const REF = `REQ-2024-${Math.floor(Math.random() * 9000) + 1000}`;

const AccountRequested = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-10 text-center w-full">

        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground">Request Submitted</h1>

        <div className="bg-secondary border border-border rounded-lg px-4 py-3 my-4">
          <p className="text-xs text-muted-foreground mb-1">Your Reference Number</p>
          <p className="font-mono text-lg font-bold text-foreground">{REF}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account request has been submitted to MIGEPROF IT. You will receive your login credentials within 24 hours via email or phone.
        </p>

        <div className="bg-card border border-border rounded-xl p-4 mt-6 text-left space-y-2">
          <p className="text-xs font-semibold text-foreground mb-2">What happens next?</p>
          {[
            "MIGEPROF IT reviews your request",
            "You receive login credentials via email within 24 hours",
            "You can log in and start using the system",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-primary font-bold">{i + 1}</span>
              </div>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mt-6"
        >
          Back to Login
        </button>

        <p className="text-xs text-muted-foreground mt-4">
          Questions? Contact IT Support:{" "}
          <span className="text-primary">support@migeprof.gov.rw</span>
        </p>

      </div>
    </div>
  );
};

export default AccountRequested;
