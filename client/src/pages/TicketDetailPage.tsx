import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Ticket } from "core/schemas/tickets";
import { type User } from "core/schemas/users";
import { TicketStatus, TicketCategory, categoryLabel } from "core/constants/ticket.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorAlert from "@/components/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const UNASSIGNED = "__unassigned__";
const NO_CATEGORY = "__none__";

const AGENT_STATUSES = [TicketStatus.open, TicketStatus.resolved, TicketStatus.closed] as const;

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((r) => r.data),
  });

  const { data: agentsData } = useQuery({
    queryKey: ["agents"],
    queryFn: () =>
      axios
        .get<{ users: Pick<User, "id" | "name" | "email">[] }>("/api/users/agents")
        .then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: { status?: TicketStatus; category?: TicketCategory | null }) =>
      axios.patch<Ticket>(`/api/tickets/${id}`, patch).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", id], updated);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch<Ticket>(`/api/tickets/${id}/assign`, { assignedToId }).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", id], updated);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
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
        <div className="grid grid-cols-[1fr_280px] gap-8 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
              <p className="text-sm text-muted-foreground mt-1">Ticket #{ticket.id}</p>
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

          {/* Right column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => updateMutation.mutate({ status: v as TicketStatus })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Select
                    value={ticket.category ?? NO_CATEGORY}
                    onValueChange={(v) =>
                      updateMutation.mutate({ category: v === NO_CATEGORY ? null : (v as TicketCategory) })
                    }
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>None</SelectItem>
                      {Object.values(TicketCategory).map((c) => (
                        <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {updateMutation.error && (
                  <ErrorAlert error={updateMutation.error} fallback="Failed to update ticket." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Assignee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select
                  value={ticket.assignedToId ?? UNASSIGNED}
                  onValueChange={(v) => assignMutation.mutate(v === UNASSIGNED ? null : v)}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {agentsData?.users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ticket.assignedTo && (
                  <p className="text-xs text-muted-foreground">{ticket.assignedTo.email}</p>
                )}
                {assignMutation.error && (
                  <ErrorAlert error={assignMutation.error} fallback="Failed to assign ticket." />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_280px] gap-8 items-start">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </div>
  );
}
