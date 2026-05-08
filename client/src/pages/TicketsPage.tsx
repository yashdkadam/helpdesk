import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import {
  type Ticket,
  type TicketSortParams,
  type TicketFilterParams,
  type SortableTicketField,
} from "core/schemas/tickets";
import { TicketStatus, TicketCategory, categoryLabel } from "core/constants/ticket.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ErrorAlert from "@/components/ErrorAlert";
import TicketsTable from "@/components/TicketsTable";

const VISIBLE_STATUSES = [TicketStatus.open, TicketStatus.resolved, TicketStatus.closed] as const;

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [filters, setFilters] = useState<TicketFilterParams>({});

  const sortParams: TicketSortParams =
    sorting.length > 0
      ? { sortBy: sorting[0].id as SortableTicketField, sortOrder: sorting[0].desc ? "desc" : "asc" }
      : {};

  const queryParams = { ...sortParams, ...filters };

  const { data: tickets, isPending, error } = useQuery({
    queryKey: ["tickets", queryParams],
    queryFn: () =>
      axios
        .get<{ tickets: Ticket[] }>("/api/tickets", { params: queryParams })
        .then((r) => r.data.tickets),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Tickets</h1>

      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Search tickets..."
          className="w-64"
          value={filters.search ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value || undefined }))
          }
        />
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, status: v === "all" ? undefined : (v as TicketStatus) }))
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {VISIBLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, category: v === "all" ? undefined : (v as TicketCategory) }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.values(TicketCategory).map((c) => (
              <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorAlert error={error} fallback="Failed to load tickets." />}
      <TicketsTable
        tickets={tickets}
        isPending={isPending}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  );
}
