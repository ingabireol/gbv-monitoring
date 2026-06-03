import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, HeartHandshake, EyeOff, Eye, LayoutDashboard,
  Users, Building2, Handshake, Lock,
  ArrowLeft, AlertCircle, Loader2, Phone, LogIn, UserPlus, Search,
  Sun, Moon
} from "lucide-react";
import { setAuthSession } from "@/lib/auth";
import { getRouteForRole, loginUser } from "@/lib/authApi";
import { getThemeMode, setThemeMode, ThemeMode } from "@/lib/theme";
import { toast } from "sonner";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/language";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Theme
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode());
  const handleThemeToggle = () => {
    const newMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(newMode);
    setThemeModeState(newMode);
  };

  // Victim states
  const [showVictimLogin, setShowVictimLogin] = useState(false);
  const [victimIdentifier, setVictimIdentifier] = useState("");
  const [victimPassword, setVictimPassword] = useState("");
  const [showVictimPassword, setShowVictimPassword] = useState(false);
  const [victimError, setVictimError] = useState("");

  // Staff states
  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState("");

  // Victim login handler
  const handleVictimLogin = async () => {
    if (!victimIdentifier || !victimPassword) {
      setVictimError("Please enter your phone number or email and password");
      return;
    }
    setIsLoading(true);
    setVictimError("");
    try {
      const { token, user } = await loginUser(victimIdentifier, victimPassword);
      if (user.role !== "victim") {
        setVictimError("This account is not registered as a victim account.");
        return;
      }
      setAuthSession(token, user);
      toast.success("Signed in successfully.");
      navigate("/victim/dashboard");
    } catch (error) {
      setVictimError(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setIsLoading(false);
    }
  };

  // Staff login handler
  const handleStaffLogin = async () => {
    if (!email || !password) {
      setStaffError("Please enter your email and password");
      return;
    }
    setIsLoading(true);
    setStaffError("");
    try {
      const { token, user } = await loginUser(email, password);
      setAuthSession(token, user);
      toast.success("Signed in successfully.");
      navigate(getRouteForRole(user.role));
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* TOP BAR */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-heading text-sm font-semibold text-foreground">GBV Monitor</span>
          <span className="text-xs text-muted-foreground hidden sm:block">— Ministry of Gender and Family Promotion</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            {themeMode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">{themeMode === "dark" ? t("lightMode") : t("darkMode")}</span>
          </button>
          <LanguageSelector />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL - fixed, always visible */}
        <div className="w-2/5 min-h-screen h-screen bg-card border-r border-border flex flex-col justify-between p-10 overflow-hidden fixed left-0 top-0 z-20" style={{ maxHeight: '100vh' }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-24 -translate-x-24 pointer-events-none" />

          {/* Middle message */}
          <div className="flex-1 flex flex-col justify-center relative z-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Government of Rwanda 🇷🇼
            </p>
            <h2 className="font-heading text-4xl font-bold text-foreground leading-tight">
              You are<br />safe here.
            </h2>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xs">
              This system is here to help you. Everything you share is kept confidential and used only to protect you.
            </p>

            {/* Trust indicators */}
            <div className="mt-8 space-y-3">
              {[
                "100% confidential and secure",
                "Free support services available",
                "Professional case management",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency hotline */}
          <div className="relative z-10">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-foreground">Need immediate help?</span>
              </div>
              <p className="text-sm font-bold text-destructive">Call 0800 300 030</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Free · 24/7 · Confidential</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-3/5 ml-[40%] flex flex-col justify-center px-12 py-10 overflow-y-auto min-h-screen">
          <div className="max-w-lg w-full mx-auto">

            <h1 className="font-heading text-3xl font-bold text-foreground">Welcome to GBV Monitor</h1>
            <p className="text-sm text-muted-foreground mt-2 mb-8">Choose how you would like to continue</p>

            {/* ── VICTIM SECTION ── */}
            <div className="mb-6">

              <p className="label-text mb-3">I NEED HELP</p>
              {/* Victim section restored */}
              {!showVictimLogin ? (
                <div className="space-y-3">
                  {/* Victim card */}
                  <div className="bg-primary/10 border-2 border-primary rounded-2xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <HeartHandshake className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-heading text-base font-semibold text-foreground">
                          I am a Victim or Witness
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Report an incident, track your case, and access support services safely and confidentially.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate("/victim/register")}
                        className="h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Create Account
                      </button>
                      <button
                        onClick={() => setShowVictimLogin(true)}
                        className="h-10 rounded-lg bg-background border border-primary text-primary text-xs font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In
                      </button>
                    </div>
                  </div>
                  {/* Anonymous link */}
                  <button
                    onClick={() => navigate("/anonymous-report")}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Report without an account
                  </button>
                  <button
                    onClick={() => navigate("/check-status")}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Track anonymous report
                  </button>
                </div>
              ) : (
                /* Victim login form */
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <button
                    onClick={() => { setShowVictimLogin(false); setVictimIdentifier(""); setVictimPassword(""); setVictimError(""); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <p className="text-sm font-semibold text-foreground mb-4">Sign in to your account</p>
                  <div className="space-y-3">
                    <div>
                      <label className="label-text mb-1.5 block">Phone Number or Email</label>
                      <input
                        className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Enter your phone number or email"
                        value={victimIdentifier}
                        onChange={e => { setVictimIdentifier(e.target.value); setVictimError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleVictimLogin()}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Use whichever you registered with</p>
                    </div>
                    <div>
                      <label className="label-text mb-1.5 block">Password</label>
                      <div className="relative">
                        <input
                          type={showVictimPassword ? "text" : "password"}
                          className="h-10 w-full rounded-lg bg-background border border-border px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="Enter your password"
                          value={victimPassword}
                          onChange={e => { setVictimPassword(e.target.value); setVictimError(""); }}
                          onKeyDown={e => e.key === "Enter" && handleVictimLogin()}
                        />
                        <button type="button" onClick={() => setShowVictimPassword(!showVictimPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showVictimPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    {victimError && (
                      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{victimError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleVictimLogin}
                      disabled={isLoading}
                      className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <button onClick={() => navigate("/victim/register")} className="text-xs text-primary hover:underline">
                        Create an account
                      </button>
                      <button onClick={() => navigate("/password-reset-sent")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* ── STAFF SECTION ── */}
              <div>
                <p className="label-text mb-3">STAFF LOGIN</p>
                {/* Only show the login form for staff, no demo credentials, no role selection */}
                <div className="bg-secondary border border-border rounded-2xl p-5">
                  <div className="space-y-3">
                    <div>
                      <label className="label-text mb-1.5 block">Email Address</label>
                      <input
                        type="email"
                        className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Enter your work email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setStaffError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleStaffLogin()}
                      />
                    </div>
                    <div>
                      <label className="label-text mb-1.5 block">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="h-10 w-full rounded-lg bg-background border border-border px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="Enter your password"
                          value={password}
                          onChange={e => { setPassword(e.target.value); setStaffError(""); }}
                          onKeyDown={e => e.key === "Enter" && handleStaffLogin()}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    {staffError && (
                      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{staffError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleStaffLogin}
                      disabled={isLoading}
                      className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                        : "Sign In"
                      }
                    </button>
                    <div className="text-center pt-1">
                      <button
                        onClick={() => navigate("/password-reset-sent")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password? Contact support@migeprof.gov.rw
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login form — show when role selected */}
              {selectedRole !== "" && (
                <div className="bg-secondary border border-border rounded-2xl p-5">
                  {/* Back button */}
                  <button
                    onClick={() => { setSelectedRole(""); setEmail(""); setPassword(""); setStaffError(""); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to role selection
                  </button>

                  {/* Selected role indicator */}
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 mb-4">
                    <p className="text-xs font-medium text-primary">
                      Signing in as: {
                        selectedRole === "admin" ? "System Administrator" :
                        selectedRole === "police" ? "Police Officer" :
                        selectedRole === "socialworker" ? "Social Worker" :
                        selectedRole === "districtadmin" ? "District Administrator" :
                        "Partner Institution Officer"
                      }
                    </p>
                    <button onClick={() => setSelectedRole("")} className="text-xs text-muted-foreground hover:text-foreground">
                      Change
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Email */}
                    <div>
                      <label className="label-text mb-1.5 block">Email Address</label>
                      <input
                        type="email"
                        className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Enter your work email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setStaffError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleStaffLogin()}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="label-text mb-1.5 block">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="h-10 w-full rounded-lg bg-background border border-border px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="Enter your password"
                          value={password}
                          onChange={e => { setPassword(e.target.value); setStaffError(""); }}
                          onKeyDown={e => e.key === "Enter" && handleStaffLogin()}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    {staffError && (
                      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{staffError}</p>
                      </div>
                    )}

                    {/* Sign In button */}
                    <button
                      onClick={handleStaffLogin}
                      disabled={isLoading}
                      className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                        : "Sign In"
                      }
                    </button>

                    {/* Demo credentials */}
                    <p className="text-xs text-muted-foreground text-center">
                      {selectedRole === "admin" && "Demo: admin@migeprof.gov.rw / Admin@2024"}
                      {selectedRole === "police" && "Demo: uwimana@rnp.gov.rw / Police@2024"}
                      {selectedRole === "socialworker" && "Demo: uwase@migeprof.gov.rw / Social@2024"}
                      {selectedRole === "districtadmin" && "Demo: ndayisaba@gasabo.gov.rw / District@2024"}
                      {selectedRole === "partner" && "Demo: claire@isange.gov.rw / Partner@2024"}
                    </p>

                    {/* Forgot password */}
                    <div className="text-center pt-1">
                      <button
                        onClick={() => navigate("/password-reset-sent")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password? Contact support@migeprof.gov.rw
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom security note */}
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Secure government system — All access is logged and monitored
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
