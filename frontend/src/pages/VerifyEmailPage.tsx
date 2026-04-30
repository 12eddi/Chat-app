import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  resendVerificationRequest,
  verifyEmailRequest,
} from "../api/auth";
import { useToastStore } from "../store/toastStore";
import "./Auth.css";

export default function VerifyEmailPage() {
  const showToast = useToastStore((state) => state.showToast);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const verificationUrlParam = searchParams.get("verificationUrl") || "";
  const isTokenMode = useMemo(() => token.length > 0, [token]);

  const [message, setMessage] = useState(
    isTokenMode
      ? "Verifying your email..."
      : "Check your inbox for your verification email."
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isTokenMode);
  const [resending, setResending] = useState(false);
  const [devVerificationUrl, setDevVerificationUrl] = useState(verificationUrlParam);

  useEffect(() => {
    if (!isTokenMode) {
      return;
    }

    let cancelled = false;

    const runVerification = async () => {
      try {
        const data = await verifyEmailRequest(token);

        if (cancelled) {
          return;
        }

        setMessage(data.message);
        showToast(data.message, "success");
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        const message = err?.response?.data?.message || "Email verification failed";
        setError(message);
        showToast(message, "error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    runVerification();

    return () => {
      cancelled = true;
    };
  }, [isTokenMode, token]);

  const handleResend = async () => {
    if (!email) {
      setError("Email address is missing");
      return;
    }

    setError("");
    setResending(true);

    try {
      const data = await resendVerificationRequest(email);
      setMessage(data.message);
      setDevVerificationUrl(data.verificationUrl || "");
      showToast(data.message, "success");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Could not resend verification email";
      setError(message);
      showToast(message, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand-top">
            <div className="auth-logo">C</div>
            <h1>{isTokenMode ? "Verify your email" : "Check your inbox"}</h1>
            <p>
              {isTokenMode
                ? "We are confirming your email address so your account setup is complete."
                : "We sent a verification link to your email address. Open it to finish setting up your account."}
            </p>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-inner">
            <span className="auth-eyebrow">Email Verification</span>
            <h2 className="auth-title">
              {isTokenMode ? "Verify email" : "Confirm your email"}
            </h2>
            <p className="auth-subtitle">{message}</p>

            {loading && <p className="auth-subtitle">Please wait while we confirm your address.</p>}
            {error && <div className="auth-error">{error}</div>}

            {!isTokenMode && (
              <>
                {devVerificationUrl && (
                  <div className="auth-dev-link">
                    <strong>Verification link</strong>
                    <a href={devVerificationUrl}>{devVerificationUrl}</a>
                  </div>
                )}

                {email && (
                  <button
                    className="auth-button"
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? "Sending..." : "Resend verification email"}
                  </button>
                )}
              </>
            )}

            <div className="auth-footer">
              <Link to="/login">Back to login</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
