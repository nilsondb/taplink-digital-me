import { Calendar, Clock, MapPin, Ticket } from "lucide-react";

export type EventData = {
  show_event?: boolean | null;
  event_title?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  event_location?: string | null;
  event_ticket_url?: string | null;
  event_description?: string | null;
};

function formatDate(d?: string | null) {
  if (!d) return null;
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
}

function formatTime(t?: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

export function EventCard({ event, onTicketClick }: { event: EventData; onTicketClick?: () => void }) {
  const hasEvent = !!(event.event_title?.trim());

  if (!event.show_event) return null;

  if (!hasEvent) {
    return (
      <div className="mt-5 rounded-3xl p-6 glass text-center">
        <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Em breve novos eventos.</p>
      </div>
    );
  }

  const date = formatDate(event.event_date);
  const time = formatTime(event.event_time);
  const url = event.event_ticket_url?.trim();
  const href = url ? (url.startsWith("http") ? url : `https://${url}`) : null;

  return (
    <div className="mt-5 rounded-3xl p-6 glass text-left relative overflow-hidden ring-1 ring-primary/30 shadow-[0_20px_60px_-20px_oklch(var(--primary)/0.5)]">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-primary/20 text-primary-foreground mb-3">
          <Calendar className="w-3 h-3" /> Próximo evento
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">{event.event_title}</h3>

        <div className="mt-3 space-y-1.5 text-sm">
          {date && (
            <div className="flex items-center gap-2 text-foreground/90">
              <Calendar className="w-4 h-4 text-primary shrink-0" /> {date}
            </div>
          )}
          {time && (
            <div className="flex items-center gap-2 text-foreground/90">
              <Clock className="w-4 h-4 text-primary shrink-0" /> {time}
            </div>
          )}
          {event.event_location && (
            <div className="flex items-center gap-2 text-foreground/90">
              <MapPin className="w-4 h-4 text-primary shrink-0" /> {event.event_location}
            </div>
          )}
        </div>

        {event.event_description && (
          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{event.event_description}</p>
        )}

        {href && (
          <a href={href} target="_blank" rel="noreferrer" onClick={onTicketClick}
            className="btn-primary mt-5 w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
            <Ticket className="w-4 h-4" /> Comprar Ingressos
          </a>
        )}
      </div>
    </div>
  );
}
