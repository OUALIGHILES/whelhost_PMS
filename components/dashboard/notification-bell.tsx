'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Mail, FileText, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Define notification types
interface Notification {
  id: string;
  type: 'message' | 'invoice' | 'billing' | 'booking' | 'task';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  hotelId: string;
}

interface NotificationBellProps {
  hotelId: string;
  userId: string;
}

export function NotificationBell({ hotelId, userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const supabase = createClient();

  // Function to get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Mail className="h-4 w-4" />;
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'billing':
        return <Receipt className="h-4 w-4" />;
      case 'booking':
        return <Clock className="h-4 w-4" />;
      case 'task':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Function to get color based on notification type
  const getColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-800';
      case 'invoice':
        return 'bg-green-100 text-green-800';
      case 'billing':
        return 'bg-purple-100 text-purple-800';
      case 'booking':
        return 'bg-orange-100 text-orange-800';
      case 'task':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch notifications from the database
  const fetchNotifications = async () => {
    if (!hotelId || !userId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      // Map the data to our notification interface
      const mappedNotifications: Notification[] = data.map((item: any) => ({
        id: item.id,
        type: item.notification_type || 'general',
        title: item.subject || 'Notification',
        description: item.content || item.message || 'You have a new notification',
        timestamp: item.created_at,
        isRead: item.is_read || false,
        hotelId: item.hotel_id,
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.isRead).length);
    }
  };

  // Initialize and subscribe to real-time updates
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          console.log('Notification change:', payload);
          fetchNotifications(); // Refresh notifications when there's a change
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, userId]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('hotel_id', hotelId)
      .is('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[0.625rem] text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/10 focus:outline-none">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
            
            <div className="mt-4 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border ${!notification.isRead ? 'bg-blue-50 border-blue-200' : 'border-border'}`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge className={`${getColor(notification.type)} rounded-full`}>
                          {getIcon(notification.type)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleString([], { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}