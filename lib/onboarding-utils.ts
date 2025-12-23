export function isOnboardingComplete(metabolicProfile: unknown): boolean {
  if (metabolicProfile === null || metabolicProfile === undefined) {
    return false;
  }

  if (typeof metabolicProfile === 'string') {
    const trimmed = metabolicProfile.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return false;
    }
    try {
      return isOnboardingComplete(JSON.parse(trimmed));
    } catch {
      return false;
    }
  }

  if (Array.isArray(metabolicProfile)) {
    return metabolicProfile.length > 0;
  }

  if (typeof metabolicProfile === 'object') {
    const record = metabolicProfile as Record<string, unknown>;
    if (Object.keys(record).length === 0) {
      return false;
    }
    if (typeof record.completed === 'boolean') {
      return record.completed === true;
    }
    return true;
  }

  return false;
}
