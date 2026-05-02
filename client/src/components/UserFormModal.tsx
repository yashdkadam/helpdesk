import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type User,
} from "core/schemas/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorAlert from "@/components/ErrorAlert";
import ErrorMessage from "@/components/ErrorMessage";

interface Props {
  open: boolean;
  user: User | null; // null = create mode
  onClose: () => void;
}

export default function UserFormModal({ open, user, onClose }: Props) {
  const isEditing = user !== null;
  const queryClient = useQueryClient();

  const schema = isEditing
    ? (updateUserSchema as unknown as typeof createUserSchema)
    : createUserSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", password: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name: user?.name ?? "", email: user?.email ?? "", password: "" });
    }
  }, [open, user?.id, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateUserInput) =>
      isEditing
        ? axios.patch(`/api/users/${user.id}`, data)
        : axios.post("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
      onClose();
    },
  });

  function handleClose() {
    reset();
    mutation.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          {mutation.error && (
            <ErrorAlert
              error={mutation.error}
              fallback={isEditing ? "Failed to update user." : "Failed to create user."}
            />
          )}

          <div className="space-y-1">
            <Label htmlFor="uf-name">Name</Label>
            <Input id="uf-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <ErrorMessage message={errors.name.message} />}
          </div>

          <div className="space-y-1">
            <Label htmlFor="uf-email">Email</Label>
            <Input
              id="uf-email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && <ErrorMessage message={errors.email.message} />}
          </div>

          <div className="space-y-1">
            <Label htmlFor="uf-password">
              {isEditing ? "New Password (optional)" : "Password"}
            </Label>
            <Input
              id="uf-password"
              type="password"
              {...(isEditing ? { placeholder: "Leave blank to keep unchanged" } : {})}
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && <ErrorMessage message={errors.password.message} />}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? isEditing ? "Saving..." : "Creating..."
                : isEditing ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
