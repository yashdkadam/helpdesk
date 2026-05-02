import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type User } from "core/schemas/users";
import ErrorAlert from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import UserFormModal from "@/components/UserFormModal";
import UsersTable from "@/components/UsersTable";

type DialogState = null | { mode: "create" } | { mode: "edit"; user: User };

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users");
  return res.data.users;
}

export default function UsersPage() {
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button onClick={() => setDialog({ mode: "create" })}>New User</Button>
      </div>

      {error && <ErrorAlert error={error} fallback="Failed to load users." />}

      <UsersTable
        users={users}
        isPending={isPending}
        onEdit={(user) => setDialog({ mode: "edit", user })}
      />
      <UserFormModal
        open={dialog !== null}
        user={dialog?.mode === "edit" ? dialog.user : null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
