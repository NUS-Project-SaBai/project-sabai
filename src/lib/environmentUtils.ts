/**
 *
 * @returns True when the application is running in localhost
 */

export function isRunningInLocalhost(): boolean {
  const dbUrl = process.env.DATABASE_URL ?? "";
  return /localhost|127\.0\.0\.1/.test(dbUrl);
}
