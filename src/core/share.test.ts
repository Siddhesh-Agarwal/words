import { describe, expect, it, vi } from 'vitest'
import { type ShareEnvironment, shareText } from '@/core/share'

describe('shareText', () => {
  it('uses the native share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const environment: ShareEnvironment = { share }
    await expect(shareText('title', 'text', environment)).resolves.toBe(
      'shared',
    )
    expect(share).toHaveBeenCalledWith({ title: 'title', text: 'text' })
  })

  it('does not copy when the share sheet is cancelled', async () => {
    const error = new Error('cancelled')
    error.name = 'AbortError'
    const clipboard = { writeText: vi.fn() }
    const environment: ShareEnvironment = {
      share: vi.fn().mockRejectedValue(error),
      clipboard,
    }
    await expect(shareText('title', 'text', environment)).resolves.toBe(
      'cancelled',
    )
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  it('falls back to the clipboard', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    await expect(shareText('title', 'text', { clipboard })).resolves.toBe(
      'copied',
    )
    expect(clipboard.writeText).toHaveBeenCalledWith('text')
  })

  it('falls back to the clipboard when native share fails', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    const environment: ShareEnvironment = {
      share: vi.fn().mockRejectedValue(new Error('unavailable')),
      clipboard,
    }
    await expect(shareText('title', 'text', environment)).resolves.toBe(
      'copied',
    )
  })

  it('reports failure when no channel works', async () => {
    const environment: ShareEnvironment = {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
    }
    await expect(shareText('title', 'text', environment)).resolves.toBe(
      'failed',
    )
  })
})
