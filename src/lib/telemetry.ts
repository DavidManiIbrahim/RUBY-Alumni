// Telemetry disabled - Supabase removed
// TODO: Implement Redis-based telemetry if needed

type JsonRecord = Record<string, unknown>;

export async function ensureOnboardingRow(userId: string) {
  // Disabled - implement with Redis if needed
  console.log('Telemetry: ensureOnboardingRow', userId);
}

export function markProfileCompleted(userId: string) {
  // Disabled - implement with Redis if needed
  console.log('Telemetry: markProfileCompleted', userId);
}

export async function logAppEvent(params: {
  userId: string;
  eventName: string;
  path?: string;
  metadata?: JsonRecord;
}) {
  // Disabled - implement with Redis if needed
  console.log('Telemetry: logAppEvent', params);
}
