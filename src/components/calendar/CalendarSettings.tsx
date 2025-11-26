import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tables } from "@/integrations/supabase/types";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type CalendarRule = Tables<"calendar_rules">;
type CalendarBlackout = Tables<"calendar_blackouts">;

const formatTimeLabel = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(`1970-01-01T${value}`);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatDateRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();

  const startDate = start.toLocaleDateString([], { month: "short", day: "numeric" });
  const startTime = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endDate = end.toLocaleDateString([], { month: "short", day: "numeric" });
  const endTime = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return sameDay
    ? `${startDate} ${startTime} – ${endTime}`
    : `${startDate} ${startTime} – ${endDate} ${endTime}`;
};

export function CalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRule, setNewRule] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
  });
  const [blackoutForm, setBlackoutForm] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    reason: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["calendar-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("calendar_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: rules, isLoading: isLoadingRules } = useQuery({
    queryKey: ["calendar-rules"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("calendar_rules")
        .select("*")
        .eq("provider_id", user.id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data as CalendarRule[]) || [];
    },
  });

  const { data: blackouts, isLoading: isLoadingBlackouts } = useQuery({
    queryKey: ["calendar-blackouts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("calendar_blackouts")
        .select("*")
        .eq("provider_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data as CalendarBlackout[]) || [];
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("calendar_settings")
        .upsert({
          user_id: user.id,
          ...values,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-settings"] });
      toast({
        title: "Settings saved",
        description: "Your calendar settings have been updated.",
      });
    },
  });

  const createRule = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { day_of_week, start_time, end_time, buffer_before_minutes, buffer_after_minutes } = newRule;

      if (!start_time || !end_time) {
        throw new Error("Start and end time are required");
      }

      if (end_time <= start_time) {
        throw new Error("End time must be after start time");
      }

      const { error } = await supabase
        .from("calendar_rules")
        .insert({
          provider_id: user.id,
          day_of_week,
          start_time,
          end_time,
          buffer_before_minutes,
          buffer_after_minutes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-rules"] });
      toast({
        title: "Availability saved",
        description: "Recurring availability window added.",
      });
      setNewRule((prev) => ({
        ...prev,
        start_time: "09:00",
        end_time: "17:00",
        buffer_before_minutes: 0,
        buffer_after_minutes: 0,
      }));
    },
    onError: (error) => {
      toast({
        title: "Unable to add availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRuleStatus = useMutation({
    mutationFn: async (payload: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("calendar_rules")
        .update({ is_active: payload.is_active })
        .eq("id", payload.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-rules"] });
    },
    onError: () => {
      toast({
        title: "Unable to update rule",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-rules"] });
      toast({
        title: "Availability removed",
        description: "Recurring window deleted.",
      });
    },
  });

  const createBlackout = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!blackoutForm.startDate || !blackoutForm.startTime || !blackoutForm.endDate || !blackoutForm.endTime) {
        throw new Error("Start and end date/time required");
      }

      const start = new Date(`${blackoutForm.startDate}T${blackoutForm.startTime}`);
      const end = new Date(`${blackoutForm.endDate}T${blackoutForm.endTime}`);

      if (end <= start) {
        throw new Error("End must be after start");
      }

      const { error } = await supabase
        .from("calendar_blackouts")
        .insert({
          provider_id: user.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          reason: blackoutForm.reason || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-blackouts"] });
      toast({
        title: "Blackout saved",
        description: "Time blocked on calendar.",
      });
      setBlackoutForm({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        reason: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to block time",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBlackout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_blackouts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-blackouts"] });
      toast({
        title: "Blackout removed",
        description: "Time slot reopened.",
      });
    },
  });

  const isBusy = isLoading || isLoadingRules || isLoadingBlackouts;

  if (isBusy) {
    return (
      <Card className="p-6">
        <Skeleton className="h-96 w-full" />
      </Card>
    );
  }

  const defaultSettings = {
    advance_notice_hours: 24,
    max_advance_days: 90,
    allow_same_day_booking: false,
    buffer_time_minutes: 0,
    min_appointment_duration_minutes: 60,
    max_appointment_duration_minutes: 480,
    auto_confirm_appointments: false,
    cancellation_notice_hours: 24,
  };

  const currentSettings = settings || defaultSettings;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Calendar Settings</h2>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const values = {
              advance_notice_hours: parseInt(formData.get("advance_notice_hours") as string),
              max_advance_days: parseInt(formData.get("max_advance_days") as string),
              allow_same_day_booking: formData.get("allow_same_day_booking") === "on",
              buffer_time_minutes: parseInt(formData.get("buffer_time_minutes") as string),
              min_appointment_duration_minutes: parseInt(formData.get("min_appointment_duration_minutes") as string),
              max_appointment_duration_minutes: parseInt(formData.get("max_appointment_duration_minutes") as string),
              auto_confirm_appointments: formData.get("auto_confirm_appointments") === "on",
              cancellation_notice_hours: parseInt(formData.get("cancellation_notice_hours") as string),
            };
            saveSettings.mutate(values);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="advance_notice_hours">Advance Notice Required (hours)</Label>
              <Input
                id="advance_notice_hours"
                name="advance_notice_hours"
                type="number"
                defaultValue={currentSettings.advance_notice_hours}
                min="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum time required before an appointment can be booked
              </p>
            </div>

            <div>
              <Label htmlFor="max_advance_days">Maximum Advance Booking (days)</Label>
              <Input
                id="max_advance_days"
                name="max_advance_days"
                type="number"
                defaultValue={currentSettings.max_advance_days}
                min="1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                How far in advance clients can book appointments
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow_same_day_booking">Allow Same-Day Booking</Label>
                <p className="text-sm text-muted-foreground">
                  Let clients book appointments for today
                </p>
              </div>
              <Switch
                id="allow_same_day_booking"
                name="allow_same_day_booking"
                defaultChecked={currentSettings.allow_same_day_booking}
              />
            </div>

            <div>
              <Label htmlFor="buffer_time_minutes">Buffer Time Between Appointments (minutes)</Label>
              <Input
                id="buffer_time_minutes"
                name="buffer_time_minutes"
                type="number"
                defaultValue={currentSettings.buffer_time_minutes}
                min="0"
                step="15"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Gap automatically added between appointments
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_appointment_duration_minutes">Min Duration (minutes)</Label>
                <Input
                  id="min_appointment_duration_minutes"
                  name="min_appointment_duration_minutes"
                  type="number"
                  defaultValue={currentSettings.min_appointment_duration_minutes}
                  min="15"
                  step="15"
                />
              </div>
              <div>
                <Label htmlFor="max_appointment_duration_minutes">Max Duration (minutes)</Label>
                <Input
                  id="max_appointment_duration_minutes"
                  name="max_appointment_duration_minutes"
                  type="number"
                  defaultValue={currentSettings.max_appointment_duration_minutes}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_confirm_appointments">Auto-Confirm Appointments</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm bookings without manual approval
                </p>
              </div>
              <Switch
                id="auto_confirm_appointments"
                name="auto_confirm_appointments"
                defaultChecked={currentSettings.auto_confirm_appointments}
              />
            </div>

            <div>
              <Label htmlFor="cancellation_notice_hours">Cancellation Notice (hours)</Label>
              <Input
                id="cancellation_notice_hours"
                name="cancellation_notice_hours"
                type="number"
                defaultValue={currentSettings.cancellation_notice_hours}
                min="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum notice required for cancellations
              </p>
            </div>
          </div>

          <Button type="submit" disabled={saveSettings.isPending}>
            Save Settings
          </Button>
        </form>
      </Card>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold">Recurring Availability</h3>
          <p className="text-sm text-muted-foreground">
            Define weekly windows that clients can request.
          </p>
        </div>

        <form
          className="grid gap-4 lg:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            createRule.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Day</Label>
            <Select
              value={String(newRule.day_of_week)}
              onValueChange={(value) => setNewRule((prev) => ({ ...prev, day_of_week: Number(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose day" />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-start">Start</Label>
            <Input
              id="rule-start"
              type="time"
              value={newRule.start_time}
              onChange={(e) => setNewRule((prev) => ({ ...prev, start_time: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-end">End</Label>
            <Input
              id="rule-end"
              type="time"
              value={newRule.end_time}
              onChange={(e) => setNewRule((prev) => ({ ...prev, end_time: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buffer-before">Buffer Before (min)</Label>
            <Input
              id="buffer-before"
              type="number"
              min="0"
              step="5"
              value={newRule.buffer_before_minutes}
              onChange={(e) => setNewRule((prev) => ({ ...prev, buffer_before_minutes: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buffer-after">Buffer After (min)</Label>
            <Input
              id="buffer-after"
              type="number"
              min="0"
              step="5"
              value={newRule.buffer_after_minutes}
              onChange={(e) => setNewRule((prev) => ({ ...prev, buffer_after_minutes: Number(e.target.value) }))}
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={createRule.isPending}>
              {createRule.isPending ? "Saving..." : "Add window"}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {rules && rules.length > 0 ? (
            rules.map((rule) => (
              <div key={rule.id} className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {dayNames[rule.day_of_week]} · {formatTimeLabel(rule.start_time)} – {formatTimeLabel(rule.end_time)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Buffers: {rule.buffer_before_minutes}m before / {rule.buffer_after_minutes}m after
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Active</Label>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => updateRuleStatus.mutate({ id: rule.id, is_active: checked })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => deleteRule.mutate(rule.id)}
                    disabled={deleteRule.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recurring availability yet.</p>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold">Blackouts & Travel</h3>
          <p className="text-sm text-muted-foreground">
            Block specific windows (vacations, appointments, recovery time).
          </p>
        </div>

        <form
          className="grid gap-4 lg:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            createBlackout.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="blackout-start-date">Start Date</Label>
            <Input
              id="blackout-start-date"
              type="date"
              value={blackoutForm.startDate}
              onChange={(e) => setBlackoutForm((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blackout-start-time">Start Time</Label>
            <Input
              id="blackout-start-time"
              type="time"
              value={blackoutForm.startTime}
              onChange={(e) => setBlackoutForm((prev) => ({ ...prev, startTime: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blackout-end-date">End Date</Label>
            <Input
              id="blackout-end-date"
              type="date"
              value={blackoutForm.endDate}
              onChange={(e) => setBlackoutForm((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blackout-end-time">End Time</Label>
            <Input
              id="blackout-end-time"
              type="time"
              value={blackoutForm.endTime}
              onChange={(e) => setBlackoutForm((prev) => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="blackout-reason">Reason (optional)</Label>
            <Textarea
              id="blackout-reason"
              placeholder="Traveling, wellness day, etc."
              value={blackoutForm.reason}
              rows={1}
              onChange={(e) => setBlackoutForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={createBlackout.isPending}>
              {createBlackout.isPending ? "Saving..." : "Block time"}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {blackouts && blackouts.length > 0 ? (
            blackouts.map((blackout) => (
              <div key={blackout.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{formatDateRange(blackout.start_time, blackout.end_time)}</p>
                  {blackout.reason ? (
                    <p className="text-sm text-muted-foreground">{blackout.reason}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => deleteBlackout.mutate(blackout.id)}
                  disabled={deleteBlackout.isPending}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No blackout windows scheduled.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
