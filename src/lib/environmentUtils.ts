/**
 * @returns True when DATABASE_URL points to a local database instance
 */

export function isDatabaseLocal(): boolean {
  const dbUrl = process.env.DATABASE_URL ?? "";
  return /localhost|127\.0\.0\.1/.test(dbUrl);
}
