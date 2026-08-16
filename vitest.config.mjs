import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const migrations = await readD1Migrations(path.join(projectRoot, 'migrations'))

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: path.join(projectRoot, 'wrangler.jsonc') },
      miniflare: {
        bindings: { TEST_MIGRATIONS: migrations },
      },
    }),
  ],
  test: {
    include: ['tests/cloud/**/*.test.mjs'],
  },
})
