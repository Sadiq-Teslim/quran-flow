import { z } from "zod";
import {
  apiFetch,
  clearAuthTokens,
  storeAuthTokens,
} from "@/lib/api/client";
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

const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default("bearer"),
  expires_in: z.number().optional(),
});

type Enable2FAResponse = {
  qr_code: string;
  secret: string;
  otpauth_uri_account: string;
};

export async function signup(payload: SignupPayload) {
  const parsed = SignupPayloadSchema.parse(payload);
  const tokens = TokenResponseSchema.parse(
    await apiFetch<unknown>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: parsed.email,
        password: parsed.password,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
      }),
    }),
  );
  storeAuthTokens(tokens);
  return tokens;
}

export async function createOnboardingAccount(payload: SignupPayload) {
  const parsed = SignupPayloadSchema.parse(payload);
  return signup(parsed);
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
  return { anonymous: true };
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

export async function enable2FA(): Promise<Enable2FAResponse> {
  throw new Error("Extra account protection is not ready yet.");
}

export async function confirm2FA(input: { code: string; secret: string }): Promise<{ ok: true }> {
  void input;
  throw new Error("Extra account protection is not ready yet.");
}

export async function disable2FA(): Promise<{ ok: true }> {
  throw new Error("Extra account protection is not ready yet.");
}
