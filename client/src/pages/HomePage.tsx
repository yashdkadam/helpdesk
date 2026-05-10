import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Bar, BarChart, XAxis } from "recharts";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import ErrorAlert from "@/components/ErrorAlert";

interface StatsResponse {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPct: number;
  avgResolutionMs: number | null;
  ticketsPerDay: { date: string; count: number }[];
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.round(hours / 24)}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const chartConfig = {
  count: { label: "Tickets", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function HomePage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      axios.get<StatsResponse>("/api/stats").then((r) => r.data),
  });

  const stats = [
    { label: "Total Tickets", value: data?.totalTickets ?? 0, subtitle: null },
    { label: "Open Tickets", value: data?.openTickets ?? 0, subtitle: null },
    { label: "AI Resolved", value: data?.aiResolvedTickets ?? 0, subtitle: null },
    {
      label: "AI Resolution Rate",
      value: data ? `${data.aiResolvedPct.toFixed(1)}%` : "0.0%",
      subtitle: "of all tickets",
    },
    {
      label: "Avg Resolution Time",
      value: formatDuration(data?.avgResolutionMs ?? null),
      subtitle: "for resolved tickets",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        {error && (
          <ErrorAlert error={error} fallback="Failed to load dashboard stats." />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isPending
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-28" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-16 mt-1" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.subtitle}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets per Day — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={data?.ticketsPerDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatAxisDate}
                    interval="preserveStartEnd"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => formatAxisDate(v as string)}
                      />
                    }
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
