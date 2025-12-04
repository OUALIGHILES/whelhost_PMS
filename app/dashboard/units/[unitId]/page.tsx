import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UnitForm } from "@/components/dashboard/unit-form"
import type { Unit } from "@/lib/types"

interface Props {
  params: {
    unitId: string
  }
}

export default async function ViewUnitPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: hotel } = await supabase.from("hotels").select("id").eq("owner_id", user.id).single()

  if (!hotel) redirect("/dashboard")

  // Get the unit data
  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id, name, room_type_id, floor, status, smart_lock_id, notes, is_visible, created_at, updated_at")
    .eq("id", params.unitId)
    .eq("hotel_id", hotel.id)
    .single() as { data: Unit | null, error: any }

  if (unitError || !unit) {
    console.error("Error fetching unit or unit not found:", unitError?.message);
    redirect("/dashboard/units")
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Unit Details</h1>
        <p className="text-muted-foreground">Information about {unit.name}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700">Unit Name</h3>
            <p>{unit.name}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Status</h3>
            <p className="capitalize">{unit.status}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Floor</h3>
            <p>{unit.floor || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Visibility</h3>
            <p>{unit.is_visible ? 'Shown on rooms page' : 'Hidden from rooms page'}</p>
          </div>
          {unit.notes && (
            <div className="col-span-2">
              <h3 className="font-medium text-gray-700">Notes</h3>
              <p>{unit.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}