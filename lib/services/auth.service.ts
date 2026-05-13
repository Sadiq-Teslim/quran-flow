import { z } from "zod";
import { apiFetch, clearAuthTokens, storeAuthTokens } from "@/lib/api/client";
import { clearProfileOverride } from "@/lib/services/user.service";

export const SignupPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userType: z.string().default("beginner"),
});
export type SignupPayload = z.infer<typeof SignupPayloadSchema>;

export const LoginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

const SignupResponseSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  message: z.string().default("User created successfully"),
});

const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default("bearer"),
  expires_in: z.number(),
});

const AnonymousLoginResponseSchema = TokenResponseSchema.extend({
  user_id: z.string(),
  anonymous: z.boolean().default(true),
});

const Enable2FAResponseSchema = z.object({
  qr_code: z.string(),
  secret: z.string(),
  otpauth_uri_account: z.string(),
});

export async function signup(payload: SignupPayload) {
  const parsed = SignupPayloadSchema.parse(payload);
  return SignupResponseSchema.parse(
    await apiFetch<unknown>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: parsed.email,
        password: parsed.password,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        user_type: parsed.userType,
      }),
    }),
  );
}

export async function login(payload: LoginPayload) {
  const parsed = LoginPayloadSchema.parse(payload);
  const tokens = TokenResponseSchema.parse(
    await apiFetch<unknown>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: parsed.email,
        password: parsed.password,
        totp_code: parsed.totpCode,
      }),
    }),
  );
  storeAuthTokens(tokens);
  return tokens;
}

export async function startAnonymousSession() {
  const tokens = AnonymousLoginResponseSchema.parse(
    await apiFetch<unknown>("/api/v1/auth/anonymous", {
      method: "POST",
    }),
  );
  storeAuthTokens(tokens);
  return tokens;
}

export async function logout() {
  try {
    await apiFetch("/api/v1/auth/logout", {
      auth: true,
      method: "POST",
    });
  } finally {
    clearProfileOverride();
    clearAuthTokens();
  }
}

export async function enable2FA() {
  return Enable2FAResponseSchema.parse(
    await apiFetch<unknown>("/api/v1/auth/enable-2fa", {
      auth: true,
      method: "POST",
    }),
  );
}

export async function confirm2FA(input: { code: string; secret: string }) {
  await apiFetch("/api/v1/auth/confirm-2fa", {
    auth: true,
    method: "POST",
    body: JSON.stringify(input),
  });
  return { ok: true };
}

export async function disable2FA() {
  await apiFetch("/api/v1/auth/disable-2fa", {
    auth: true,
    method: "POST",
  });
  return { ok: true };
}
