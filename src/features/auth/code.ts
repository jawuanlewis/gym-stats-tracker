/**
 * The emailed sign-in code, shared by the form (which submits itself once the
 * code is complete) and the Server Action (which validates it). Client-safe.
 */

/**
 * Must equal **Email OTP Length** in the Supabase dashboard (Authentication →
 * Providers → Email; 6 by default). If it is shorter, the form submits a code
 * before it is complete; if longer, it never submits by itself.
 */
export const CODE_LENGTH = 6;

/**
 * Just the digits of whatever was typed, pasted or autofilled, so a pasted
 * "Code: 123 456" or "123-456" reads as the code itself.
 */
export function normalizeCode(value: string): string {
  return value.replace(/\D/g, "");
}
