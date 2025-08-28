import webPush from 'web-push'

/**
 * Sends a push notification using web-push.  The VAPID keys and subject
 * must be provided via environment variables: VAPID_PUBLIC_KEY,
 * VAPID_PRIVATE_KEY, and VAPID_SUBJECT.  The subscription parameter should
 * be the object returned from pushManager.subscribe() on the client (as
 * received in the API request).
 */
export async function sendPushNotification(
  subscription: any,
  payload: string | Buffer | null = null
) {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:example@example.com'
  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not configured')
  }
  webPush.setVapidDetails(subject, publicKey, privateKey)
  await webPush.sendNotification(subscription, payload || JSON.stringify({ title: 'Scruffy Butts', body: 'Your appointment has been received!' }))
}
