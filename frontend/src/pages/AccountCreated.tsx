import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const AccountCreated = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-10 text-center w-full">

        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground">Account Created</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Your account has been created successfully. You can now log in to track your case and access support services.
        </p>

        <div className="bg-secondary border border-border rounded-xl p-4 mt-6 text-left">
          <p className="text-xs font-semibold text-foreground mb-2">Your Login Details</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Username</span>
              <span className="text-xs font-mono font-medium text-foreground">Your phone number</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Password</span>
              <span className="text-xs font-mono font-medium text-foreground">The password you created</span>
            </div>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mt-4">
          <p className="text-xs text-warning">
            Save your phone number and password. You will need them to log in.
          </p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mt-6"
        >
          Go to Login
        </button>

      </div>
    </div>
  );
};

export default AccountCreated;
