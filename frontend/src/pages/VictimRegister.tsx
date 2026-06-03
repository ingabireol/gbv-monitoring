import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ArrowLeft, Phone, Mail,
  Eye, EyeOff, HeartHandshake, CheckCircle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { registerVictim, requestVictimEmailPin, verifyVictimEmailPin } from "@/lib/authApi";

const rwandaDistricts = [
  "Gasabo","Kicukiro","Nyarugenge","Bugesera","Gatsibo","Kayonza","Kirehe",
  "Ngoma","Nyagatare","Rwamagana","Burera","Gakenke","Gicumbi","Musanze",
  "Rulindo","Gisagara","Huye","Kamonyi","Muhanga","Nyamagabe","Nyanza",
  "Nyaruguru","Ruhango","Karongi","Ngororero","Nyabihu","Nyamasheke",
  "Rubavu","Rusizi","Rutsiro"
];

const VictimRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "verify" | "success">("form");
  const [verifyMethod, setVerifyMethod] = useState<"phone" | "email">("phone");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [district, setDistrict] = useState("");
  const [ageGroup, setAgeGroup] = useState<"adult" | "child">("adult");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [generatedPin, setGeneratedPin] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [isRequestingPin, setIsRequestingPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError("Please enter your full name"); return; }
    if (!identifier.trim()) { setError(`Please enter your ${verifyMethod === "phone" ? "phone number" : "email address"}`); return; }
    if (!district) { setError("Please select your district"); return; }
    if (!password) { setError("Please create a password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");

    if (verifyMethod === "email") {
      setIsRequestingPin(true);
      try {
        const response = await requestVictimEmailPin({
          username: identifier.trim(),
          password,
          email: identifier.trim(),
          role: "VICTIM",
          displayName: fullName.trim(),
          district,
          ageGroup,
        });
        setGeneratedPin(response.verificationPin ?? "");
        setEnteredPin("");
        setStep("verify");
        toast.success(response.message || `Verification PIN sent to ${identifier} via email`);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to send the verification PIN right now.");
      } finally {
        setIsRequestingPin(false);
      }
      return;
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(pin);
    setEnteredPin("");
    setStep("verify");
    toast.success(`Verification PIN sent to ${identifier} via SMS`);
  };

  const handleVerify = async () => {
    if (!enteredPin) { setError("Please enter the PIN"); return; }

    setIsSubmitting(true);
    setError("");
    try {
      if (verifyMethod === "email") {
        await verifyVictimEmailPin({
          email: identifier.trim(),
          pin: enteredPin.trim(),
        });
      } else {
        if (enteredPin !== generatedPin) {
          setError("Incorrect PIN. Please try again.");
          return;
        }

        await registerVictim({
          username: identifier.trim(),
          password,
          role: "VICTIM",
          displayName: fullName.trim(),
          district,
          ageGroup,
        });
      }
      toast.success("Your account has been created successfully.");
      setStep("success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Top bar */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-heading text-sm font-semibold text-foreground">GBV Monitor</span>
        <span className="text-xs text-muted-foreground">— Ministry of Gender and Family Promotion</span>
      </div>

      <div className="flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">

          {/* Back link */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* STEP — Form */}
          {step === "form" && (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                  <HeartHandshake className="w-7 h-7 text-primary" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Create Your Account</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Create an account to track your case, receive updates, and access support services.
                </p>
              </div>

              {/* Confidentiality note */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-5 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your information is completely confidential. Only authorized officers handling your case will have access.
                </p>
              </div>

              {/* Form */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">

                {/* Full Name */}
                <div>
                  <label className="label-text mb-1.5 block">Full Name</label>
                  <input
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(""); }}
                  />
                </div>

                {/* Verification method */}
                <div>
                  <label className="label-text mb-2 block">How would you like to verify your account?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setVerifyMethod("phone"); setIdentifier(""); }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                        verifyMethod === "phone"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <Phone className={`w-4 h-4 shrink-0 ${verifyMethod === "phone" ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-xs font-medium ${verifyMethod === "phone" ? "text-primary" : "text-foreground"}`}>Phone Number</p>
                        <p className="text-[10px] text-muted-foreground">PIN via SMS</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setVerifyMethod("email"); setIdentifier(""); }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                        verifyMethod === "email"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <Mail className={`w-4 h-4 shrink-0 ${verifyMethod === "email" ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-xs font-medium ${verifyMethod === "email" ? "text-primary" : "text-foreground"}`}>Email Address</p>
                        <p className="text-[10px] text-muted-foreground">PIN via email</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Phone or Email */}
                <div>
                  <label className="label-text mb-1.5 block">
                    {verifyMethod === "phone" ? "Phone Number" : "Email Address"}
                  </label>
                  <input
                    type={verifyMethod === "email" ? "email" : "tel"}
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    placeholder={verifyMethod === "phone" ? "+250 7XX XXX XXX" : "your@email.com"}
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setError(""); }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">This will be used to log in to your account</p>
                </div>

                {/* District */}
                <div>
                  <label className="label-text mb-1.5 block">Your District</label>
                  <select
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    value={district}
                    onChange={e => { setDistrict(e.target.value); setError(""); }}
                  >
                    <option value="">Select your district</option>
                    {rwandaDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label className="label-text mb-2 block">Age Group</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAgeGroup("adult")}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        ageGroup === "adult"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      Adult (18 and above)
                    </button>
                    <button
                      onClick={() => setAgeGroup("child")}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        ageGroup === "child"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      Child (Under 18)
                    </button>
                  </div>
                  {ageGroup === "child" && (
                    <div className="mt-2 bg-info/10 border border-info/20 rounded-lg p-2.5">
                      <p className="text-xs text-info">A social worker will be notified to assist you.</p>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="label-text mb-1.5 block">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="h-10 w-full rounded-lg bg-background border border-border px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label-text mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="h-10 w-full rounded-lg bg-background border border-border px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showConfirm ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isRequestingPin}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isRequestingPin ? "Sending PIN..." : "Create Account"}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/login")} className="text-primary hover:underline">
                    Sign In
                  </button>
                </p>
              </div>
            </>
          )}

          {/* STEP — Verify PIN */}
          {step === "verify" && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                  {verifyMethod === "phone" ? <Phone className="w-5 h-5 text-primary" /> : <Mail className="w-5 h-5 text-primary" />}
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">Verify Your Account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A 6-digit PIN was sent to <span className="font-medium text-foreground">{identifier}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {verifyMethod === "phone" ? "Check your SMS messages" : "Check your email inbox"}
                </p>
              </div>

              {generatedPin && (
                <div className="bg-secondary border border-border rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Demo PIN: <span className="font-mono font-bold text-foreground tracking-widest">{generatedPin}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="label-text mb-1.5 block">Enter 6-Digit PIN</label>
                <input
                  className="h-12 w-full rounded-xl bg-background border border-border px-3 text-center text-2xl font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  value={enteredPin}
                  onChange={e => { setEnteredPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleVerify()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mt-3">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mt-4"
              >
                {isSubmitting ? "Verifying..." : "Verify and Create Account"}
              </button>

              <button
                onClick={() => { setStep("form"); setEnteredPin(""); setError(""); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
              >
                Go back and change contact details
              </button>
            </div>
          )}

          {/* STEP — Success */}
          {step === "success" && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Account Created!</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your account has been created successfully. You can now log in to track your case and access support services.
              </p>

              <div className="bg-secondary border border-border rounded-xl p-4 mt-5 text-left space-y-2">
                <p className="text-xs font-semibold text-foreground mb-1">Your Login Details</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {verifyMethod === "phone" ? "Phone Number" : "Email"}
                  </span>
                  <span className="text-xs font-mono font-medium text-foreground">{identifier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Password</span>
                  <span className="text-xs text-muted-foreground">The password you created</span>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mt-3">
                <p className="text-xs text-warning">Save your login details. You will need them every time you log in.</p>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mt-5"
              >
                Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VictimRegister;
