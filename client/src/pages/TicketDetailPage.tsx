import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type Ticket } from "core/schemas/tickets";
import { TicketStatus, TicketCategory, categoryLabel } from "core/constants/ticket.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorAlert from "@/components/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((r) => r.data),
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link to="/tickets">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to tickets
        </Link>
      </Button>

      {error && <ErrorAlert error={error} fallback="Failed to load ticket." />}

      {isPending ? (
        <TicketDetailSkeleton />
      ) : ticket ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
            <p className="text-sm text-muted-foreground mt-1">Ticket #{ticket.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={ticket.status} />
            {ticket.category && <CategoryBadge category={ticket.category} />}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{ticket.body}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Sender</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm font-medium">{ticket.senderName}</p>
              <p className="text-sm text-muted-foreground">{ticket.senderEmail}</p>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Received: {new Date(ticket.createdAt).toLocaleString()}</p>
            <p>Last updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
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
