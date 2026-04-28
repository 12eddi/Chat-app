import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import "./Auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const showToast = useToastStore((state) => state.showToast);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      showToast("Logged in successfully", "success");
      navigate("/chats");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Login failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle(credential);
      showToast("Logged in with Google", "success");
      navigate("/chats");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Google login failed";
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
            <h1>Welcome back</h1>
            <p>
              Sign in to pick up your conversations and keep everything in sync.
            </p>
          </div>

          <div className="auth-brand-bottom">
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Real-time chat</strong>
                <span>Send messages instantly in a clean UI.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Modern design</strong>
                <span>Inspired by WhatsApp & Telegram.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Easy to use</strong>
                <span>Search, chat, and connect instantly.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-inner">
            <span className="auth-eyebrow">Login</span>
            <h2 className="auth-title">Sign in</h2>
            <p className="auth-subtitle">
              Enter your credentials to access your chats.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Username or email</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              <div className="auth-link-row">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <GoogleSignInButton
              onCredential={handleGoogleLogin}
              onError={(message) => {
                setError(message);
                showToast(message, "error");
              }}
            />

            <div className="auth-footer">
              No account? <Link to="/register">Register</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
