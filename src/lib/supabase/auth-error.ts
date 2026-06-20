type AuthLikeError = {
  message?: string;
  status?: number;
  code?: string;
};

export function formatAuthError(error: AuthLikeError): string {
  const message = error.message?.trim();
  if (message && message !== '{}') {
    return message;
  }

  const details = [
    error.code ? `code: ${error.code}` : null,
    error.status ? `HTTP ${error.status}` : null,
  ].filter(Boolean);

  if (details.length > 0) {
    return `Auth-Fehler (${details.join(', ')})`;
  }

  return 'Authentifizierung fehlgeschlagen';
}
