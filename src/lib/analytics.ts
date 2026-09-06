export function track(event: string, payload?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug(`[track] ${event}`, payload)
  }
}
