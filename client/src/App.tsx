import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Routes, Route } from "react-router-dom";
import ErrorAlert from "@/components/ErrorAlert";

function HealthCheck() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["health"],
    queryFn: () => axios.get<{ status: string }>("/api/health").then((r) => r.data),
  });

  return (
    <div className="p-6 max-w-sm mx-auto mt-10 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Helpdesk</h1>
      {isLoading && <p className="text-muted-foreground text-sm">Checking server…</p>}
      {error && <ErrorAlert error={error} fallback="Could not reach the server." />}
      {data && (
        <p className="text-sm text-green-600">
          Server status: <span className="font-medium">{data.status}</span>
        </p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HealthCheck />} />
    </Routes>
  );
}
