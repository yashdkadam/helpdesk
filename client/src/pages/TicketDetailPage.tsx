import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type Ticket } from "core/schemas/tickets";
import { type User } from "core/schemas/users";
import { type TicketReply, createTicketReplySchema, type CreateTicketReplyInput } from "core/schemas/tickets";
import { TicketStatus, TicketCategory, categoryLabel, ReplySenderType } from "core/constants/ticket.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorAlert from "@/components/ErrorAlert";
import ErrorMessage from "@/components/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles } from "lucide-react";

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

  const { data: repliesData } = useQuery({
    queryKey: ["ticket-replies", id],
    queryFn: () =>
      axios.get<{ replies: TicketReply[] }>(`/api/tickets/${id}/replies`).then((r) => r.data),
    enabled: !!id,
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketReplyInput>({
    resolver: standardSchemaResolver(createTicketReplySchema),
  });

  const replyBody = watch("body", "");

  const replyMutation = useMutation({
    mutationFn: (data: CreateTicketReplyInput) =>
      axios.post<TicketReply>(`/api/tickets/${id}/replies`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-replies", id] });
      reset();
    },
  });

  const polishMutation = useMutation({
    mutationFn: (data: CreateTicketReplyInput) =>
      axios.post<{ polished: string }>(`/api/tickets/${id}/polish-reply`, data).then((r) => r.data),
    onSuccess: ({ polished }) => {
      setValue("body", polished, { shouldValidate: true });
    },
  });

  const replies = repliesData?.replies ?? [];

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

            {/* Reply thread */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Replies {replies.length > 0 && `(${replies.length})`}
              </h2>

              {replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                replies.map((reply) => (
                  <ReplyCard key={reply.id} reply={reply} senderName={ticket.senderName} />
                ))
              )}
            </div>

            {/* Reply form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit((data) => replyMutation.mutate(data))}
                  className="space-y-3"
                >
                  <div>
                    <Textarea
                      {...register("body")}
                      placeholder="Write a reply..."
                      rows={4}
                      disabled={replyMutation.isPending}
                      aria-invalid={!!errors.body}
                    />
                    {errors.body && <ErrorMessage message={errors.body.message} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!replyBody?.trim() || polishMutation.isPending || replyMutation.isPending}
                      onClick={() => polishMutation.mutate({ body: replyBody })}
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      {polishMutation.isPending ? "Polishing…" : "Polish"}
                    </Button>
                    <Button type="submit" disabled={!replyBody?.trim() || replyMutation.isPending || polishMutation.isPending}>
                      {replyMutation.isPending ? "Sending…" : "Send Reply"}
                    </Button>
                  </div>
                  {polishMutation.error && (
                    <ErrorAlert error={polishMutation.error} fallback="Failed to polish reply." />
                  )}
                  {replyMutation.error && (
                    <ErrorAlert error={replyMutation.error} fallback="Failed to send reply." />
                  )}
                </form>
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

function ReplyCard({ reply, senderName }: { reply: TicketReply; senderName: string }) {
  const isAgent = reply.senderType === ReplySenderType.agent;
  const displayName = isAgent ? (reply.author?.name ?? "Agent") : senderName;

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${isAgent ? "bg-muted/40" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{displayName}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(reply.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
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
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </div>
  );
}
