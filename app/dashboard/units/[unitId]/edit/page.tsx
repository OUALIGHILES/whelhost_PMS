import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UnitForm } from "@/components/dashboard/unit-form"
import type { Unit } from "@/lib/types"

interface Props {
  params: {
    unitId: string
  }
}

export default async function EditUnitPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: hotel } = await supabase.from("hotels").select("id").eq("owner_id", user.id).single()

  if (!hotel) redirect("/dashboard")

  // Get the unit data with proper error handling
  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id, name, room_type_id, floor, status, smart_lock_id, notes, is_visible, created_at, updated_at")
    .eq("id", params.unitId)
    .eq("hotel_id", hotel.id)
    .single() as { data: Unit | null, error: any }

  if (unitError || !unit) {
    console.error("Error fetching unit or unit not found:", unitError?.message, "params.unitId:", params.unitId, "hotel.id:", hotel.id);
    redirect("/dashboard/units")
  }

  // Get available room types for the hotel
  const { data: roomTypes, error: roomTypesError } = await supabase.from("room_types").select("*").eq("hotel_id", hotel.id)

  if (roomTypesError) {
    console.error("Error fetching room types:", roomTypesError?.message);
    redirect("/dashboard/units")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Unit</h1>
        <p className="text-muted-foreground">Update information for {unit.name}</p>
      </div>
      <UnitForm hotelId={hotel.id} roomTypes={roomTypes || []} unit={unit} />
    </div>
  )
}