import { supabase } from '@/lib/supabaseClient'

export default async function AdminPage() {
  // Fetch the latest 50 appointments
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return <p className="text-red-600">Error loading appointments: {error.message}</p>
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Recent Appointments</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Owner</th>
              <th className="text-left p-2">Pet</th>
              <th className="text-left p-2">Service</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((a: any) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{new Date(a.created_at).toLocaleString()}</td>
                <td className="p-2">{a.owner_name}</td>
                <td className="p-2">{a.pet_name}</td>
                <td className="p-2">{a.service}</td>
                <td className="p-2">{a.date}</td>
                <td className="p-2">{a.time}</td>
                <td className="p-2">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs">
        (Protect this page later with auth; for now it’s open so you can verify bookings.)
      </p>
    </div>
  )
}
