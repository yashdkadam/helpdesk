import { type Ticket } from "core/schemas/tickets";
import { TicketStatus, TicketCategory, categoryLabel } from "core/constants/ticket.ts";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  tickets: Ticket[] | undefined;
  isPending: boolean;
}

export default function TicketsTable({ tickets, isPending }: Props) {
  if (isPending) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sender</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Received</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-md" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-28 rounded-md" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!tickets) return null;

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
        No tickets yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sender</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Received</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">#{ticket.id}</td>
              <td className="px-4 py-3 font-medium">{ticket.subject}</td>
              <td className="px-4 py-3">
                <div className="text-foreground">{ticket.senderName}</div>
                <div className="text-muted-foreground text-xs">{ticket.senderEmail}</div>
              </td>
              <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
              <td className="px-4 py-3">
                {ticket.category ? <CategoryBadge category={ticket.category} /> : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    [TicketStatus.new]: "bg-muted text-muted-foreground border-border",
    [TicketStatus.processing]: "bg-muted text-muted-foreground border-border",
    [TicketStatus.open]: "bg-blue-50 text-blue-700 border-blue-200",
    [TicketStatus.resolved]: "bg-green-50 text-green-700 border-green-200",
    [TicketStatus.closed]: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border-border">
      {categoryLabel[category]}
    </span>
  );
}
