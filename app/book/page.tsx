import dynamic from 'next/dynamic'

// Load the form only on the client
const AppointmentForm = dynamic(() => import('@/components/AppointmentForm'), { ssr: false })

export default function BookPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Book an appointment</h1>
      <AppointmentForm />
      <p className="text-sm text-gray-500">
        You’ll get confirmations and reminders after you submit.
      </p>
    </div>
  )
}
