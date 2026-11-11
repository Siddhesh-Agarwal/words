export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export type ShareEnvironment = {
  share?: (data: { title: string; text: string }) => Promise<void>
  clipboard?: { writeText(text: string): Promise<void> }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}

export function browserShareEnvironment(): ShareEnvironment {
  if (typeof navigator === 'undefined') return {}
  const share =
    typeof navigator.share === 'function'
      ? navigator.share.bind(navigator)
      : undefined
  const clipboard = navigator.clipboard
    ? { writeText: navigator.clipboard.writeText.bind(navigator.clipboard) }
    : undefined
  return { share, clipboard }
}

export async function shareText(
  title: string,
  text: string,
  environment: ShareEnvironment = browserShareEnvironment(),
): Promise<ShareResult> {
  if (environment.share) {
    try {
      await environment.share({ title, text })
      return 'shared'
    } catch (error) {
      if (isAbortError(error)) return 'cancelled'
    }
  }

  if (environment.clipboard) {
    try {
      await environment.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }

  return 'failed'
}
