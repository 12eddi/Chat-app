import { useEffect, useRef, useState } from "react";
import { getGoogleConfigRequest } from "../api/auth";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function GoogleSignInButton({
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getGoogleConfigRequest();
        setClientId(data.clientId);
      } catch {
        setClientId(null);
      }
    };

    void loadConfig();
  }, []);

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (!credential) {
            onError("Google login did not return a credential");
            return;
          }

          void onCredential(credential);
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        width: 320,
        text: "continue_with",
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google) {
        initializeGoogle();
      } else {
        existingScript.addEventListener("load", initializeGoogle, { once: true });
      }

      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", initializeGoogle, { once: true });
    script.addEventListener("error", () => {
      onError("Failed to load Google sign-in");
    });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initializeGoogle);
    };
  }, [clientId, onCredential, onError]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="google-signin-block">
      <div className="auth-divider">
        <span>or</span>
      </div>
      <div ref={containerRef} className="google-signin-button" />
    </div>
  );
}
