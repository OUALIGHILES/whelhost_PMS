'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, MapPin, Phone, Building2 } from "lucide-react"

interface ProfileCardProps {
  user: User | null
  profile: any
  hotel: any
}

export function ProfileCard({ user, profile, hotel }: ProfileCardProps) {
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No user data available
        </CardContent>
      </Card>
    )
  }

  const profileData = profile || user.user_metadata || {}

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profileData.avatar_url || profileData.avatar} alt={profileData.full_name || user.email} />
          <AvatarFallback>
            {profileData.full_name
              ? profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
              : (user.email?.charAt(0).toUpperCase() || 'U')
            }
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <CardTitle className="text-2xl">
            {profileData.full_name || profileData.name || user.email}
          </CardTitle>
          <div className="mt-1">
            <Badge variant="secondary">
              {profileData.role || 'User'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          {profileData.phone && (
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{profileData.phone}</span>
            </div>
          )}
          {profileData.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{profileData.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Joined {new Date(user.created_at || user.created_at).toLocaleDateString()}</span>
          </div>
          {hotel && (
            <div className="flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>Hotel: {hotel.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}