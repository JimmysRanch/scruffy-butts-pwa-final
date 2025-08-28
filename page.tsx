import dynamic from 'next/dynamic'

// Dynamically import the AppointmentForm component so it only runs on the client.
const AppointmentForm = dynamic(() => import('@/components/AppointmentForm'), {
  ssr: false
})

/**
 * Booking page wraps the AppointmentForm component.  A note informs clients
 * about potential deposits or reminders.
 */
export default function BookPage() {
  return (
    <div className="grid gap-6">
      <AppointmentForm />
      <p className="text-sm text-gray-500 max-w-prose">
        Please provide accurate contact information.  You will receive a
        confirmation via email and push notification once your booking is
        received.  A small deposit may be required for no‑show protection.
      </p>
    </div>
  )
}