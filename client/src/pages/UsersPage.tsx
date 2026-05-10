import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type User } from "core/schemas/users";
import ErrorAlert from "@/components/ErrorAlert";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import UserFormModal from "@/components/UserFormModal";
import UsersTable from "@/components/UsersTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DialogState =
  | null
  | { mode: "create" }
  | { mode: "edit"; user: User }
  | { mode: "delete"; user: User };

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users");
  return res.data.users;
}

export default function UsersPage() {
  const [dialog, setDialog] = useState<DialogState>(null);
  const queryClient = useQueryClient();

  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialog(null);
    },
  });

  const deletingUser = dialog?.mode === "delete" ? dialog.user : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button onClick={() => setDialog({ mode: "create" })}>New User</Button>
      </div>

      {error && <ErrorAlert error={error} fallback="Failed to load users." />}

      <UsersTable
        users={users}
        isPending={isPending}
        onEdit={(user) => setDialog({ mode: "edit", user })}
        onDelete={(user) => setDialog({ mode: "delete", user })}
      />

      <UserFormModal
        open={dialog?.mode === "create" || dialog?.mode === "edit"}
        user={dialog?.mode === "edit" ? dialog.user : null}
        onClose={() => setDialog(null)}
      />

      <AlertDialog
        open={dialog?.mode === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
    </div>
  );
}
