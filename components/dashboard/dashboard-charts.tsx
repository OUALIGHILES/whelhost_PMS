'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';

// Types for our data
interface BookingData {
  date: string;
  count: number;
  revenue: number;
}

interface OccupancyData {
  name: string;
  value: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface BookingStatusData {
  name: string;
  value: number;
}

interface BillingData {
  name: string;
  amount: number;
}

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const BAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

interface DashboardChartsProps {
  hotelId: string;
}

export default function DashboardCharts({ hotelId }: DashboardChartsProps) {
  const [bookingData, setBookingData] = useState<BookingData[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [bookingStatusData, setBookingStatusData] = useState<BookingStatusData[]>([]);
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();

        // Get the current user to ensure authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Authentication error:', authError);
          setLoading(false);
          return;
        }

        // Fetch booking data for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('status, total_amount, created_at')
          .eq('hotel_id', hotelId)
          .gte('created_at', sevenDaysAgo.toISOString())
          .in('status', ['confirmed', 'checked_in', 'checked_out', 'cancelled']);

        if (bookingsData) {
          // Group bookings by day of the week and calculate counts and revenue
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const groupedBookings: Record<string, { count: number; revenue: number }> = {
            'Sun': { count: 0, revenue: 0 },
            'Mon': { count: 0, revenue: 0 },
            'Tue': { count: 0, revenue: 0 },
            'Wed': { count: 0, revenue: 0 },
            'Thu': { count: 0, revenue: 0 },
            'Fri': { count: 0, revenue: 0 },
            'Sat': { count: 0, revenue: 0 }
          };

          bookingsData.forEach(booking => {
            const date = new Date(booking.created_at);
            const dayOfWeek = dayNames[date.getDay()];

            // Only count revenue for confirmed or checked-in/checked-out bookings
            if (booking.status !== 'cancelled') {
              groupedBookings[dayOfWeek].revenue += booking.total_amount || 0;
            }
            groupedBookings[dayOfWeek].count += 1;
          });

          // Format data for chart, ensuring all days are represented
          const bookingChartData: BookingData[] = dayNames.map(day => ({
            date: day,
            count: groupedBookings[day].count,
            revenue: groupedBookings[day].revenue
          }));

          setBookingData(bookingChartData);
        }

        // Fetch units data for occupancy status
        const { data: unitsData } = await supabase
          .from('units')
          .select('status')
          .eq('hotel_id', hotelId);

        if (unitsData) {
          const occupancyStats: Record<string, number> = {
            'Occupied': 0,
            'Available': 0,
            'Maintenance': 0
          };

          unitsData.forEach(unit => {
            if (unit.status === 'occupied') {
              occupancyStats['Occupied'] += 1;
            } else if (unit.status === 'maintenance') {
              occupancyStats['Maintenance'] += 1;
            } else {
              occupancyStats['Available'] += 1;
            }
          });

          const totalUnits = unitsData.length;
          const occupancyChartData: OccupancyData[] = Object.entries(occupancyStats)
            .filter(([_, count]) => count > 0) // Only include non-zero values
            .map(([status, count]) => ({
              name: status,
              value: totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0
            }));

          setOccupancyData(occupancyChartData);
        }

        // Fetch revenue data for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: revenueData } = await supabase
          .from('bookings')
          .select('total_amount, created_at')
          .eq('hotel_id', hotelId)
          .gte('created_at', sixMonthsAgo.toISOString())
          .neq('status', 'cancelled');

        if (revenueData) {
          // Create an array of the last 6 month names
          const monthNames = [];
          const currentDate = new Date();
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(currentDate.getMonth() - i);
            monthNames.push(date.toLocaleDateString('en-US', { month: 'short' }));
          }

          // Initialize revenue for each month
          const monthlyRevenue: Record<string, number> = {};
          monthNames.forEach(month => {
            monthlyRevenue[month] = 0;
          });

          revenueData.forEach(booking => {
            const month = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short' });
            if (monthlyRevenue.hasOwnProperty(month)) {
              monthlyRevenue[month] += booking.total_amount || 0;
            }
          });

          // Format data for chart, ensuring all months are represented
          const revenueChartData: RevenueData[] = monthNames.map(month => ({
            month,
            revenue: monthlyRevenue[month]
          }));

          setRevenueData(revenueChartData);
        }

        // Fetch booking status data
        const { data: bookingStatus } = await supabase
          .from('bookings')
          .select('status')
          .eq('hotel_id', hotelId);

        if (bookingStatus) {
          const statusCount: Record<string, number> = {};

          bookingStatus.forEach(booking => {
            if (!statusCount[booking.status]) {
              statusCount[booking.status] = 0;
            }
            statusCount[booking.status] += 1;
          });

          const bookingStatusChartData: BookingStatusData[] = Object.entries(statusCount).map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count
          }));

          setBookingStatusData(bookingStatusChartData);
        }

        // Fetch billing data for the last 6 months
        const { data: billingData } = await supabase
          .from('billings')
          .select('category, total_amount, date')
          .eq('hotel_id', hotelId)
          .gte('date', sixMonthsAgo.toISOString());

        if (billingData) {
          const categoryTotals: Record<string, number> = {};

          billingData.forEach(billing => {
            if (!categoryTotals[billing.category]) {
              categoryTotals[billing.category] = 0;
            }
            categoryTotals[billing.category] += billing.total_amount || 0;
          });

          const billingChartData: BillingData[] = Object.entries(categoryTotals).map(([category, amount]) => ({
            name: category,
            amount
          }));

          setBillingData(billingChartData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">Loading charts...</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">Loading charts...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue vs Bookings Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings & Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bookingData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'count') return [value, 'Bookings'];
                    if (name === 'revenue') return [`${value}`, 'Revenue'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Bookings" fill="#3b82f6" />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Occupancy Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Room Occupancy Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} bookings`, 'Bookings']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Billing Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Billing by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={billingData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend />
                <Bar dataKey="amount" name="Amount" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}