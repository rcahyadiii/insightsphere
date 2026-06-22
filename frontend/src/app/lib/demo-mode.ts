export function isDemoDataEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
}
