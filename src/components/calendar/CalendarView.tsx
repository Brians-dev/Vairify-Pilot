import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

type CalendarEvent = Tables<"calendar_events">;

export function CalendarView({ selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: events } = useQuery({
    queryKey: ["calendar-events", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time");

      if (error) throw error;
      return (data as CalendarEvent[]) || [];
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events?.filter(event => 
      isSameDay(new Date(event.start_time), day)
    ) || [];
  };

  return (
    <Card className="p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "min-h-[100px] p-2 rounded-lg border transition-colors text-left relative",
                !isCurrentMonth && "text-muted-foreground bg-muted/30",
                isSelected && "border-primary bg-primary/5",
                isToday && "border-primary",
                "hover:bg-accent"
              )}
            >
              <div className="font-medium text-sm mb-1">
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs px-1 py-0.5 rounded truncate",
                      event.status === "confirmed" && "bg-green-500/20 text-green-700 dark:text-green-300",
                      event.status === "pending" && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
                      event.status === "cancelled" && "bg-red-500/20 text-red-700 dark:text-red-300",
                      event.status === "hold" && "bg-blue-500/10 text-blue-700 dark:text-blue-300",
                      event.status === "completed" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    )}
                  >
                    {format(new Date(event.start_time), "h:mm a")}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
