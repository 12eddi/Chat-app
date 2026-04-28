import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { forgotPasswordRequest, resetPasswordRequest } from "../api/auth";
import { useToastStore } from "../store/toastStore";
import "./Auth.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const isResetMode = useMemo(() => token.length > 0, [token]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isResetMode) {
      if (!password.trim()) {
        setError("New password is required");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);

      try {
        const data = await resetPasswordRequest(token, password);
        setSubmitted(true);
        setMessage(data.message);
        showToast(data.message, "success");
        window.setTimeout(() => {
          navigate("/login");
        }, 1600);
      } catch (err: any) {
        const message = err?.response?.data?.message || "Password reset failed";
        setError(message);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const data = await forgotPasswordRequest(email.trim());
      setSubmitted(true);
      setMessage(data.message);
      setDevResetUrl(data.resetUrl || "");
      showToast(data.message, "success");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Could not send reset link";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand-top">
            <div className="auth-logo">C</div>
            <h1>{isResetMode ? "Create a new password" : "Reset password"}</h1>
            <p>
              {isResetMode
                ? "Choose a new password to finish restoring access to your account."
                : "Enter your email to receive reset instructions."}
            </p>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-inner">
            <span className="auth-eyebrow">
              {isResetMode ? "Reset Password" : "Password Help"}
            </span>
            <h2 className="auth-title">
              {isResetMode ? "Set new password" : "Forgot password"}
            </h2>
            {!submitted && (
              <p className="auth-subtitle">
                {isResetMode
                  ? "Choose a strong password and confirm it to finish resetting access."
                  : "We will send a reset link if an account matches this email."}
              </p>
            )}

            {error && <div className="auth-error">{error}</div>}

            {submitted ? (
              <>
                <p className="auth-subtitle">{message}</p>

                {devResetUrl && (
                  <div className="auth-dev-link">
                    <strong>Development reset link</strong>
                    <a href={devResetUrl}>{devResetUrl}</a>
                  </div>
                )}

                <div className="auth-footer">
                  <Link to="/login">Back to login</Link>
                </div>
              </>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                {!isResetMode ? (
                  <div className="auth-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                ) : (
                  <>
                    <div className="auth-field">
                      <label>New password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="auth-field">
                      <label>Confirm password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </>
                )}

                <button className="auth-button" disabled={loading} type="submit">
                  {loading
                    ? isResetMode
                      ? "Saving..."
                      : "Sending..."
                    : isResetMode
                      ? "Reset password"
                      : "Send reset link"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
