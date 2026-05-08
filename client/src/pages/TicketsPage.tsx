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
import { Button } from "@/components/ui/button";
import ErrorAlert from "@/components/ErrorAlert";
import TicketsTable from "@/components/TicketsTable";

const PAGE_SIZE = 10;
const VISIBLE_STATUSES = [TicketStatus.open, TicketStatus.resolved, TicketStatus.closed] as const;

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [filters, setFilters] = useState<TicketFilterParams>({});
  const [page, setPage] = useState(1);

  const sortParams: TicketSortParams =
    sorting.length > 0
      ? { sortBy: sorting[0].id as SortableTicketField, sortOrder: sorting[0].desc ? "desc" : "asc" }
      : {};

  const queryParams = { ...sortParams, ...filters, page, pageSize: PAGE_SIZE };

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", queryParams],
    queryFn: () =>
      axios
        .get<TicketsResponse>("/api/tickets", { params: queryParams })
        .then((r) => r.data),
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  function updateFilters(next: TicketFilterParams) {
    setFilters(next);
    setPage(1);
  }

  function updateSorting(next: SortingState) {
    setSorting(next);
    setPage(1);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Tickets</h1>

      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Search tickets..."
          className="w-64"
          value={filters.search ?? ""}
          onChange={(e) =>
            updateFilters({ ...filters, search: e.target.value || undefined })
          }
        />
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            updateFilters({ ...filters, status: v === "all" ? undefined : (v as TicketStatus) })
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
            updateFilters({ ...filters, category: v === "all" ? undefined : (v as TicketCategory) })
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
        tickets={data?.tickets}
        isPending={isPending}
        sorting={sorting}
        onSortingChange={updateSorting}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {data && (
              <>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} of{" "}
                {data.total} tickets
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="w-8"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}
