import { NextRequest, NextResponse } from "next/server";

export const PASSKEY_CHALLENGE_COOKIE = "passkey_challenge";
export const PASSKEY_USER_COOKIE = "passkey_user";

const cookieMaxAgeSeconds = 5 * 60;

export const getRpId = (request: NextRequest) => {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const host = request.headers.get("host") ?? new URL(request.url).hostname;
  return host.split(":")[0];
};

export const getOrigin = (request: NextRequest) => {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN;
  return request.headers.get("origin") ?? new URL(request.url).origin;
};

export const setPasskeyCookies = (
  response: NextResponse,
  challenge: string,
  userId: string,
) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: cookieMaxAgeSeconds,
    path: "/",
  };

  response.cookies.set(PASSKEY_CHALLENGE_COOKIE, challenge, cookieOptions);
  response.cookies.set(PASSKEY_USER_COOKIE, userId, cookieOptions);
};

export const clearPasskeyCookies = (response: NextResponse) => {
  response.cookies.set(PASSKEY_CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(PASSKEY_USER_COOKIE, "", { maxAge: 0, path: "/" });
};

export const bufferToBase64Url = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes).toString("base64url");
};

export const base64UrlToBuffer = (value: string) => {
  return Buffer.from(value, "base64url");
};

export const uuidToBuffer = (uuid: string) => {
  const normalized = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return Buffer.from(bytes);
};
