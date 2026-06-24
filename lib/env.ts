function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  signingSecret: () => required('SLACK_SIGNING_SECRET'),
  allowedTeamId: () => optional('SLACK_ALLOWED_TEAM_ID'),
  allowedChannelId: () => optional('SLACK_ALLOWED_CHANNEL_ID'),
  adminIds: () =>
    (optional('SLACK_ADMIN_IDS') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  timezone: () => optional('APP_TIMEZONE') || 'America/Sao_Paulo',
};
