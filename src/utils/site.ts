export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    'http://localhost:3000'

  return rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
}
