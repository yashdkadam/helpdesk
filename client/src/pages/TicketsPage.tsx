import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type Ticket } from "core/schemas/tickets";
import ErrorAlert from "@/components/ErrorAlert";
import TicketsTable from "@/components/TicketsTable";

async function fetchTickets(): Promise<Ticket[]> {
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets");
  return res.data.tickets;
}

export default function TicketsPage() {
  const { data: tickets, isPending, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Tickets</h1>
      {error && <ErrorAlert error={error} fallback="Failed to load tickets." />}
      <TicketsTable tickets={tickets} isPending={isPending} />
    </div>
  );
}
