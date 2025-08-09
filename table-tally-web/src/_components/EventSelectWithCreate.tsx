import { useState } from "react";
import CreateEventDialog from "@/_components/CreateEventDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function EventSelectWithCreate({
  events,
  value,
  onChange,
  token,
  apiBase,
  onEventCreated,
}: {
  events: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  token?: string;
  apiBase: string;
  onEventCreated?: (ev: { id: string; name: string }) => void;
}) {
  const [localEvents, setLocalEvents] = useState(events);

  function handleCreated(ev: { id: string; name: string }) {
    setLocalEvents((prev) => [...prev, ev]);
    onChange(ev.id);
    onEventCreated?.(ev);
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label>Event</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {localEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CreateEventDialog
        token={token}
        apiBase={apiBase}
        onCreated={handleCreated}
  trigger={<Button type="button" variant="outline" className="px-2">Add event&nbsp;+</Button>}
      />
    </div>
  );
}
