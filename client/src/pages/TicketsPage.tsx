import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { type Ticket, type TicketSortParams, type SortableTicketField } from "core/schemas/tickets";
import ErrorAlert from "@/components/ErrorAlert";
import TicketsTable from "@/components/TicketsTable";

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const sortParams: TicketSortParams =
    sorting.length > 0
      ? {
          sortBy: sorting[0].id as SortableTicketField,
          sortOrder: sorting[0].desc ? "desc" : "asc",
        }
      : {};

  const { data: tickets, isPending, error } = useQuery({
    queryKey: ["tickets", sortParams],
    queryFn: () =>
      axios
        .get<{ tickets: Ticket[] }>("/api/tickets", { params: sortParams })
        .then((r) => r.data.tickets),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Tickets</h1>
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
