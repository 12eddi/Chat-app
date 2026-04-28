import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";
import {
  updateProfileRequest,
  changePasswordRequest,
  uploadPhotoRequest,
} from "../api/users";
import {
  isStrongEnoughPassword,
  isValidEmail,
  isValidUsername,
  normalizeInput,
} from "../utils/validation";
import "./Auth.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const showToast = useToastStore((state) => state.showToast);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const payload = {
      firstName: normalizeInput(firstName),
      lastName: normalizeInput(lastName),
      username: normalizeInput(username),
      email: normalizeInput(email).toLowerCase(),
    };

    if (!payload.firstName || !payload.lastName || !payload.username || !payload.email) {
      const message = "All profile fields are required";
      setProfileError(message);
      showToast(message, "error");
      return;
    }

    if (payload.firstName.length < 2 || payload.lastName.length < 2) {
      const message = "First and last name must be at least 2 characters";
      setProfileError(message);
      showToast(message, "error");
      return;
    }

    if (!isValidUsername(payload.username)) {
      const message =
        "Username must be 3-20 characters and use only letters, numbers, or underscores";
      setProfileError(message);
      showToast(message, "error");
      return;
    }

    if (!isValidEmail(payload.email)) {
      const message = "Please enter a valid email address";
      setProfileError(message);
      showToast(message, "error");
      return;
    }

    setSavingProfile(true);

    try {
      const data = await updateProfileRequest(payload);

      setUser(data.user);
      setFirstName(payload.firstName);
      setLastName(payload.lastName);
      setUsername(payload.username);
      setEmail(payload.email);
      setProfileMessage(data.message || "Profile updated successfully");
      showToast(data.message || "Profile updated successfully", "success");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to update profile";
      setProfileError(message);
      showToast(message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!file) {
      setUploadError("Please choose a file first.");
      showToast("Please choose a file first.", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      const message = "Only image files are allowed";
      setUploadError(message);
      showToast(message, "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const message = "Image size must be 5MB or less";
      setUploadError(message);
      showToast(message, "error");
      return;
    }

    setUploadError("");
    setUploadMessage("");
    setUploadingPhoto(true);

    try {
      const data = await uploadPhotoRequest(file);
      setUser(data.user);
      setUploadMessage(data.message || "Profile photo updated successfully");
      setFile(null);
      showToast(data.message || "Profile photo updated successfully", "success");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to upload photo";
      setUploadError(message);
      showToast(message, "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      const message = "Please fill in all password fields.";
      setPasswordError(message);
      showToast(message, "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "New password and confirm password do not match.";
      setPasswordError(message);
      showToast(message, "error");
      return;
    }

    if (!isStrongEnoughPassword(newPassword)) {
      const message = "New password must be at least 6 characters.";
      setPasswordError(message);
      showToast(message, "error");
      return;
    }

    if (currentPassword === newPassword) {
      const message = "New password must be different from current password.";
      setPasswordError(message);
      showToast(message, "error");
      return;
    }

    setSavingPassword(true);

    try {
      const data = await changePasswordRequest({
        currentPassword,
        newPassword,
      });

      setPasswordMessage(data.message || "Password changed successfully");
      showToast(data.message || "Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to change password";
      setPasswordError(message);
      showToast(message, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand-top">
            <div className="auth-logo">P</div>
            <h1>Your profile</h1>
            <p>
              Manage your account details and keep your information up to date.
            </p>
          </div>

          <div className="auth-brand-bottom">
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Profile details</strong>
                <span>Update your name, username, and email address.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Account security</strong>
                <span>Change your password to keep your account secure.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-dot" />
              <div>
                <strong>Profile photo</strong>
                <span>Upload a photo so people can recognize you.</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="auth-card"
          style={{ alignItems: "flex-start", overflowY: "auto" }}
        >
          <div className="auth-card-inner profile-card-inner">
            <span className="auth-eyebrow">Profile</span>
            <h2 className="auth-title">Account settings</h2>
            <p className="auth-subtitle">
              Review and update your account information below.
            </p>

            <div className="profile-block">
              <div className="profile-avatar-row">
                <UserAvatar user={user} avatarClassName="profile-avatar" pixelSize={96} />
              </div>

              <div className="auth-form">
                <div className="auth-field">
                  <label htmlFor="photo">Profile photo</label>
                  <div className="profile-photo-picker">
                    <label htmlFor="photo" className="profile-photo-trigger">
                      Choose image
                    </label>
                    <span className="profile-photo-filename">
                      {file?.name || "No file selected"}
                    </span>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="auth-file-input"
                    />
                  </div>
                </div>

                {uploadError && <div className="auth-error">{uploadError}</div>}
                {uploadMessage && <div className="auth-success">{uploadMessage}</div>}

                <button
                  className="auth-button"
                  type="button"
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? "Uploading..." : "Upload photo"}
                </button>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleProfileSubmit}>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>

              {profileError && <div className="auth-error">{profileError}</div>}
              {profileMessage && <div className="auth-success">{profileMessage}</div>}

              <button
                className="auth-button"
                type="submit"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </form>

            <div className="profile-spacer" />

            <span className="auth-eyebrow">Appearance</span>
            <div className="appearance-settings">
              <button
                type="button"
                className="appearance-setting-row"
                onClick={toggleTheme}
                aria-pressed={theme === "dark"}
              >
                <span className="appearance-setting-icon" aria-hidden="true">
                  ☽
                </span>
                <span className="appearance-setting-title">Night Mode</span>
                <span className={`appearance-switch ${theme === "dark" ? "on" : ""}`}>
                  <span className="appearance-switch-thumb" />
                </span>
              </button>
            </div>

            <div className="profile-spacer" />

            <span className="auth-eyebrow">Security</span>
            <h2 className="auth-title auth-title-small">
              Change password
            </h2>
            <p className="auth-subtitle">
              Enter your current password and choose a new one.
            </p>

            <form className="auth-form" onSubmit={handlePasswordSubmit}>
              <div className="auth-field">
                <label htmlFor="currentPassword">Current password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && <div className="auth-error">{passwordError}</div>}
              {passwordMessage && <div className="auth-success">{passwordMessage}</div>}

              <button
                className="auth-button"
                type="submit"
                disabled={savingPassword}
              >
                {savingPassword ? "Changing..." : "Change password"}
              </button>
            </form>

            <div className="auth-footer auth-footer-left">
              <button
                type="button"
                onClick={() => navigate("/chats")}
                className="auth-link-button"
              >
                Back to chats
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
