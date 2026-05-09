import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
  type Column,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { type Ticket } from "core/schemas/tickets";
import { TicketStatus, TicketCategory, categoryLabel } from "core/constants/ticket.ts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  tickets: Ticket[] | undefined;
  isPending: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

const columns: ColumnDef<Ticket>[] = [
  {
    id: "id",
    header: "ID",
    enableSorting: false,
    cell: ({ row }) => <span className="text-muted-foreground">#{row.original.id}</span>,
  },
  {
    id: "subject",
    accessorKey: "subject",
    header: "Subject",
    enableSorting: true,
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.subject}
      </Link>
    ),
  },
  {
    id: "senderName",
    accessorKey: "senderName",
    header: "Sender",
    enableSorting: true,
    cell: ({ row }) => (
      <div>
        <div className="text-foreground">{row.original.senderName}</div>
        <div className="text-muted-foreground text-xs">{row.original.senderEmail}</div>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    enableSorting: true,
    cell: ({ row }) =>
      row.original.category ? (
        <CategoryBadge category={row.original.category} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "assignedTo",
    header: "Assigned to",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.assignedTo ? (
        <span className="text-foreground">{row.original.assignedTo.name}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Received",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

const SKELETON_COLS = columns.length;

export default function TicketsTable({ tickets, isPending, sorting, onSortingChange }: Props) {
  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSortingRemoval: false,
  });

  if (isPending) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {Array.from({ length: SKELETON_COLS }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
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
                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
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
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b bg-muted/50">
              {hg.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <SortHeader column={header.column}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </SortHeader>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({ column, children }: { column: Column<Ticket>; children: React.ReactNode }) {
  if (!column.getCanSort()) return <span>{children}</span>;
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "flex items-center gap-1 hover:text-foreground transition-colors",
        sorted && "text-foreground"
      )}
    >
      {children}
      {sorted === "asc" ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : sorted === "desc" ? (
        <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
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
