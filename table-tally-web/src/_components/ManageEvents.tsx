"use client";
import { EventOpt } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function ManageEvents({
  events,
  onFilter,
  onDelete,
  signedIn,
}: {
  events: EventOpt[];
  onFilter: (id: string) => void;
  onDelete: (id: string) => void;
  signedIn: boolean;
}) {
  if (!signedIn) return null;
  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Manage Events</h2>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="divide-y">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="truncate">{ev.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onFilter(ev.id)}>
                  Filter
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(ev.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
