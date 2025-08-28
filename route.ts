import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { sendEmail } from '@/lib/email'
import { sendPushNotification } from '@/lib/push'

/**
 * Maps carrier names to their SMS gateway domains.  These domains allow us
 * to deliver simple text messages via email.  If a carrier is not
 * recognized the function returns null and SMS will be skipped.
 */
function carrierToGateway(carrier: string): string | null {
  const mapping: Record<string, string> = {
    'AT&T': 'txt.att.net',
    Verizon: 'vtext.com',
    'T-Mobile': 'tmomail.net',
    Cricket: 'mms.cricketwireless.net',
    'Boost Mobile': 'myboostmobile.com',
    'US Cellular': 'email.uscc.net',
    MetroPCS: 'mymetropcs.com',
    'Google Fi': 'msg.fi.google.com',
    'Straight Talk': 'vtext.com'
  }
  return mapping[carrier] || null
}

/**
 * POST /api/appointments
 * Creates a new appointment record in Supabase.  Accepts JSON body with
 * appointment details including push subscription and opt‑in flags.  After
 * storing the record the handler triggers notification delivery via email
 * and push.  SMS notifications are attempted via carrier gateway when
 * possible.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Validate required fields.
    const required = ['ownerName', 'phone', 'petName', 'date', 'time']
    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json(
          { error: `Missing required field ${key}` },
          { status: 400 }
        )
      }
    }
    // Insert into Supabase.
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        owner_name: body.ownerName,
        phone: body.phone,
        email: body.email,
        carrier: body.carrier || null,
        sms_opt_in: body.smsOptIn ?? true,
        push_subscription: body.pushSubscription || null,
        pet_name: body.petName,
        breed: body.breed,
        weight: body.weight,
        service: body.service,
        notes: body.notes,
        date: body.date,
        time: body.time,
        status: 'requested'
      })
      .select()
      .single()
    if (error) throw error

    // Send confirmation email if provided.
    if (body.email) {
      try {
        const text = `Thank you for booking with Scruffy Butts!\n\nWe received your appointment request for ${body.date} at ${body.time}. We will confirm your appointment shortly.\n\n– Scruffy Butts`
        await sendEmail({
          to: body.email,
          subject: 'Scruffy Butts Appointment Requested',
          text
        })
      } catch (e) {
        console.error('Email send failed:', e)
      }
    }
    // Send SMS via email gateway if opted in and carrier is known.
    if (body.smsOptIn && body.phone) {
      const domain = carrierToGateway(body.carrier)
      if (domain) {
        const address = `${body.phone.replace(/\D/g, '')}@${domain}`
        try {
          const text = `Scruffy Butts: Appointment requested for ${body.date} at ${body.time}. We will confirm soon.`
          await sendEmail({ to: address, subject: '', text })
        } catch (e) {
          console.error('SMS send failed:', e)
        }
      }
    }
    // Send push notification if subscription exists and opt in is true.
    if (body.pushOptIn && body.pushSubscription) {
      try {
        await sendPushNotification(body.pushSubscription, JSON.stringify({
          title: 'Scruffy Butts',
          body: `Appointment requested for ${body.date} at ${body.time}`,
          url: '/' // optional URL clients can open on click
        }))
      } catch (e) {
        console.error('Push notification failed:', e)
      }
    }
    return NextResponse.json({ ok: true, appointment: data })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * GET /api/appointments
 * Returns recent appointments for API consumers.  Accepts optional
 * query parameters such as `limit`.  This endpoint is unauthenticated
 * for demonstration purposes; in production you should protect it.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') || '10')
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data })
}