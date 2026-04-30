import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../api/auth";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import {
  isStrongEnoughPassword,
  isValidEmail,
  isValidUsername,
  normalizeInput,
} from "../utils/validation";
import "./Auth.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const showToast = useToastStore((state) => state.showToast);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      firstName: normalizeInput(form.firstName),
      lastName: normalizeInput(form.lastName),
      email: normalizeInput(form.email).toLowerCase(),
      username: normalizeInput(form.username),
      password: form.password,
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.username || !payload.password) {
      const message = "All fields are required";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (payload.firstName.length < 2 || payload.lastName.length < 2) {
      const message = "First and last name must be at least 2 characters";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!isValidEmail(payload.email)) {
      const message = "Please enter a valid email address";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!isValidUsername(payload.username)) {
      const message =
        "Username must be 3-20 characters and use only letters, numbers, or underscores";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!isStrongEnoughPassword(payload.password)) {
      const message = "Password must be at least 6 characters long";
      setError(message);
      showToast(message, "error");
      return;
    }

    setLoading(true);

    try {
      const data = await registerRequest(payload);
      showToast("Account created. Please verify your email.", "success");
      const verifyParams = new URLSearchParams({
        email: payload.email,
      });

      if (data.verificationUrl) {
        verifyParams.set("verificationUrl", data.verificationUrl);
      }

      navigate(`/verify-email?${verifyParams.toString()}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Registration failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (credential: string) => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle(credential);
      showToast("Account created with Google", "success");
      navigate("/chats");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Google sign-up failed";
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
            <h1>Create account</h1>
            <p>
              Join the app and set up your space for simple, focused conversations.
            </p>
          </div>

          <div className="auth-brand-bottom">
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Quick setup</strong>
                <span>Create your profile in seconds.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Start chatting</strong>
                <span>Search users and create conversations.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Clean interface</strong>
                <span>Same design across the whole app.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-inner">
            <span className="auth-eyebrow">Register</span>
            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">
              Fill in your details to get started.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label>First name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="First name"
                  />
                </div>

                <div className="auth-field">
                  <label>Last name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Email"
                />
              </div>

              <div className="auth-field">
                <label>Username</label>
                <input
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="Username"
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Password"
                />
              </div>

              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <GoogleSignInButton
              onCredential={handleGoogleRegister}
              onError={(message) => {
                setError(message);
                showToast(message, "error");
              }}
            />

            <div className="auth-footer">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
