import { describe, expect, it } from 'vitest'
import { normalizeTeamDomain } from '../../worker/auth.mjs'

describe('Cloudflare Access configuration', () => {
  it('normalizes a bare team domain to the HTTPS issuer URL', () => {
    expect(normalizeTeamDomain('minerva-ranger-feiyut.cloudflareaccess.com')).toBe(
      'https://minerva-ranger-feiyut.cloudflareaccess.com',
    )
  })

  it('preserves an official HTTPS team domain', () => {
    expect(normalizeTeamDomain('https://minerva-ranger-feiyut.cloudflareaccess.com/')).toBe(
      'https://minerva-ranger-feiyut.cloudflareaccess.com',
    )
  })

  it('rejects insecure or path-bearing issuer URLs', () => {
    expect(normalizeTeamDomain('http://minerva-ranger-feiyut.cloudflareaccess.com')).toBe('')
    expect(normalizeTeamDomain('https://minerva-ranger-feiyut.cloudflareaccess.com/path')).toBe('')
  })
})
