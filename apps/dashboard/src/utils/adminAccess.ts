function parseAllowlist(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

const adminEmails = parseAllowlist(import.meta.env.VITE_ADMIN_EMAILS);

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return adminEmails.has(email.toLowerCase());
}
