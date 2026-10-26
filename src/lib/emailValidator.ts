/**
 * Smart Study AI — Strict Email Validation & Hygiene
 *
 * Implements RFC 5321 & RFC 5322 compliance with defensive safeguards
 * against email-related injection vulnerabilities:
 *  1. Header Injection / CRLF: Disallows \r, \n, null bytes, and control chars.
 *  2. Address Parser Spoofing (GHSA-85x2-q946-cp5h): Strictly disallows < and > angle brackets.
 *  3. Comment Mis-parsing & Recipient Bypass (GHSA-cc9r-2j5m-2m83): Disallows parentheses (), quotes "", brackets [], commas, and semicolons.
 *  4. Quadratic DKIM / Parser Resource Exhaustion (GHSA-39m8-27wv-hr27): Enforces hard length caps:
 *     - Total email <= 254 chars (RFC 5321 §4.5.3.1.3)
 *     - Local part <= 64 chars (RFC 5321 §4.5.3.1.1)
 *     - Domain <= 253 chars, labels <= 63 chars (RFC 1035 §2.3.4)
 */

export interface EmailValidationResult {
  valid: boolean;
  sanitizedEmail?: string;
  error?: string;
}

export function validateRegistrationEmail(rawEmail: unknown): EmailValidationResult {
  if (typeof rawEmail !== "string") {
    return { valid: false, error: "Email must be a string." };
  }

  const trimmed = rawEmail.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Email address cannot be empty." };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: "Email address exceeds maximum allowed length of 254 characters." };
  }

  // Reject CRLF, control characters (ASCII 0-31, 127), and whitespace
  if (/[\r\n\x00-\x1f\x7f\s]/.test(trimmed)) {
    return { valid: false, error: "Email address contains invalid whitespace or control characters." };
  }

  // Strictly forbid injection and parser confusion characters
  // Quotes ("), angle brackets (<, >), parentheses ((, )), brackets ([, ]), backslashes (\), commas (,), semicolons (;), colons (:)
  if (/[<>()[\]\\,;":]/.test(trimmed)) {
    return { valid: false, error: "Email address contains forbidden characters or quotes." };
  }

  // Must contain exactly one '@' symbol
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, error: "Email address must contain exactly one '@' symbol." };
  }

  const [localPart, domainPart] = trimmed.split("@");

  // Local-part checks (RFC 5321 §4.5.3.1.1: Max 64 octets)
  if (!localPart || localPart.length > 64) {
    return { valid: false, error: "Email username (local-part) must be between 1 and 64 characters." };
  }

  // Local-part cannot start or end with a dot, or have consecutive dots
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return { valid: false, error: "Email username cannot have leading, trailing, or consecutive dots." };
  }

  // Local-part character set: standard unquoted dot-atom
  const LOCAL_REGEX = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
  if (!LOCAL_REGEX.test(localPart)) {
    return { valid: false, error: "Email username contains unsupported special characters." };
  }

  // Domain checks (RFC 1035 §2.3.4, RFC 5321 §4.5.3.1.2: Max 253 octets)
  if (!domainPart || domainPart.length > 253) {
    return { valid: false, error: "Domain part must be between 1 and 253 characters." };
  }

  if (domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.includes("..")) {
    return { valid: false, error: "Domain part cannot have leading, trailing, or consecutive dots." };
  }

  const labels = domainPart.split(".");
  if (labels.length < 2) {
    return { valid: false, error: "Domain must include a valid top-level domain extension (e.g. .com)." };
  }

  // Validate each domain label
  const LABEL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return { valid: false, error: "Domain labels must be between 1 and 63 characters." };
    }
    if (!LABEL_REGEX.test(label)) {
      return { valid: false, error: "Domain labels must start and end with an alphanumeric character and contain only letters, numbers, or hyphens." };
    }
  }

  // TLD must be alphabetic and at least 2 characters (RFC 1123 / RFC 3696)
  const tld = labels[labels.length - 1];
  if (!/^[a-zA-Z]{2,63}$/.test(tld)) {
    return { valid: false, error: "Top-level domain extension must contain only letters and be at least 2 characters long." };
  }

  return {
    valid: true,
    sanitizedEmail: trimmed.toLowerCase(),
  };
}
