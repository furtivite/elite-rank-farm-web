import type { NextConfig } from 'next'
import { normalizeBasePath } from './src/shared/config/basePath'

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? '')

const nextConfig: NextConfig = {
  output: 'export',
  agentRules: false,
  trailingSlash: true,
  ...(basePath === '' ? {} : { basePath }),
}

export default nextConfig
