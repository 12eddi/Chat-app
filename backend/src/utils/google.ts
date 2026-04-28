import { env } from "../config/env";

type GoogleTokenInfo = {
  sub: string;
  email: string;
  email_verified: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string;
};

export const verifyGoogleIdToken = async (idToken: string) => {
  if (!env.googleClientId) {
    throw new Error("Google sign-in is not configured");
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error("Google token is invalid");
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo;

  if (tokenInfo.aud !== env.googleClientId) {
    throw new Error("Google token audience is invalid");
  }

  if (!tokenInfo.email || tokenInfo.email_verified !== "true" || !tokenInfo.sub) {
    throw new Error("Google account email is not verified");
  }

  return tokenInfo;
};
