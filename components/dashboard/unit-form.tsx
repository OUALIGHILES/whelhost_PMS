"use client"

import type React from "react"
import { useState, useRef, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, X } from "lucide-react"
import type { RoomType, Unit } from "@/lib/types"

interface UnitFormProps {
  hotelId: string
  roomTypes: RoomType[]
  unit?: Unit
}

export function UnitForm({ hotelId, roomTypes, unit }: UnitFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: unit?.name || "",
    room_type_id: unit?.room_type_id || "",
    floor: unit?.floor?.toString() || "",
    status: unit?.status || "available",
    notes: unit?.notes || "",
    is_visible: unit?.is_visible ?? true,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      // Validate files
      for (const file of files) {
        if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
          alert(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP images are allowed.`);
          return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          return
        }
      }

      // Create previews
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
  }

  // Remove an image preview
  const removeImagePreview = (index: number) => {
    setImagePreviews(prev => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  // Upload images to Supabase storage
  const uploadImages = async (unitId: string) => {
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) return

    setImageLoading(true)

    const formData = new FormData()
    formData.append("unitId", unitId)

    Array.from(fileInputRef.current.files).forEach(file => {
      formData.append("images", file)
    })

    try {
      const response = await fetch("/api/rooms/images", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload images")
      }

      console.log("Images uploaded successfully:", result)
    } catch (error) {
      console.error("Error uploading images:", error)
      alert("Error uploading images: " + (error as Error).message)
    } finally {
      setImageLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Prepare the data for both create and update
    const data = {
      name: formData.name,
      room_type_id: formData.room_type_id || null,
      floor: formData.floor ? Number.parseInt(formData.floor) : null,
      status: formData.status,
      notes: formData.notes || null,
      is_visible: formData.is_visible,
    }

    let unitId: string | undefined
    let success = false

    try {
      if (unit) {
        // Update existing unit
        const { error } = await supabase
          .from("units")
          .update(data)
          .eq("id", unit.id)
          .eq("hotel_id", hotelId)

        if (error) {
          console.error("Error updating unit:", error)
          throw error
        }

        unitId = unit.id
        success = true
      } else {
        // Create new unit
        const { data: insertedUnit, error } = await supabase
          .from("units")
          .insert({ ...data, hotel_id: hotelId })
          .select("id")
          .single()

        if (error) {
          console.error("Error creating unit:", error)
          throw error
        }

        if (insertedUnit) {
          unitId = insertedUnit.id
          success = true
        }
      }

      if (success && unitId) {
        // If images were selected, upload them
        if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
          await uploadImages(unitId)
        }

        router.push("/dashboard/units")
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving unit:", error)
      alert("Failed to save unit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name *</Label>
            <Input
              id="name"
              placeholder="Room 101"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="room_type">Room Type</Label>
              <Select
                value={formData.room_type_id}
                onValueChange={(value) => setFormData({ ...formData, room_type_id: value })}
              >
                <SelectTrigger className="border-white">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.base_price} SAR
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                placeholder="1"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="border-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="border-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_visible">Show in Rooms Page</Label>
              <Switch
                id="is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Toggle this to show or hide this unit on the public rooms page
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this unit..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="border-white"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Unit Photos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload images of this unit</p>
                <p className="text-xs text-gray-500 mb-4">Supports JPEG, PNG, WebP. Max 5MB each</p>
                <Input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  ref={fileInputRef}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  Select Images
                </Button>
              </div>

              {/* Selected Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="rounded-md object-cover w-full h-24"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImagePreview(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || imageLoading}>
              {loading || imageLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {imageLoading ? "Uploading images..." : "Saving..."}
                </>
              ) : unit ? (
                "Update Unit"
              ) : (
                "Create Unit"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
