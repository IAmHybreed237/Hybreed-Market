import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import fs from 'fs'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Resolves where a dashboard app lives:
// - in the source tree (development): ../../apps/<name>
// - in the production build artifact: hosts that deploy only `.medusa/server` (for example
//   Medusa Cloud) get the panels bundled into ./dashboards/<name> by
//   scripts/bundle-dashboards.mjs during `build`. The compiled config runs from the
//   artifact root, so __dirname points there.
const dashboardAppDir = (name: string) => {
  const bundled = path.join(__dirname, 'dashboards', name)
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, `../../apps/${name}`)
}

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    seller_registration: true
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: dashboardAppDir('admin'),
        path: '/dashboard',
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: dashboardAppDir('vendor'),
        path: '/seller',
      }
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          // Only register when credentials exist — an empty key would fail
          // provider validation and take down API startup.
          ...(process.env.NOTCHPAY_PUBLIC_KEY
            ? [
                {
                  resolve: './src/providers/notchpay',
                  id: 'notchpay',
                  options: {
                    publicKey: process.env.NOTCHPAY_PUBLIC_KEY,
                    privateKey: process.env.NOTCHPAY_PRIVATE_KEY,
                    webhookHash: process.env.NOTCHPAY_WEBHOOK_HASH,
                    apiUrl: process.env.NOTCHPAY_API_URL,
                    callbackUrl: process.env.NOTCHPAY_CALLBACK_URL,
                    lockedChannel: process.env.NOTCHPAY_LOCKED_CHANNEL,
                    lockedCountry:
                      process.env.NOTCHPAY_LOCKED_COUNTRY ?? 'CM',
                  },
                },
              ]
            : []),
          {
            resolve: './src/providers/wallet',
            id: 'wallet',
          },
        ],
      },
    },
    {
      resolve: './src/modules/auction',
    },
    {
      resolve: './src/modules/wallet',
    },
    {
      resolve: './src/modules/push-notifications',
    },
    {
      resolve: './src/modules/trending',
    },
    {
      resolve: './src/modules/review-extras',
    },
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              // The local provider bakes this into every uploaded file URL.
              // It must be the publicly reachable origin in production, or
              // images resolve to localhost and render broken.
              backend_url: process.env.FILE_BACKEND_URL || 'http://localhost:9000/static',
            },
          },
        ],
      },
    },
  ],
})
