import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod/v4";
import { useMutation } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import ErrorAlert from "@/components/ErrorAlert";
import ErrorMessage from "@/components/ErrorMessage";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: standardSchemaResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await signIn.email({ email: values.email, password: values.password });
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => navigate("/"),
  });

  if (isPending) return null;
  if (session) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm px-4">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground mb-2">
              <LifeBuoy className="size-6" />
            </div>
            <h1 className="text-2xl leading-none font-semibold">Helpdesk</h1>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit((v) => loginMutation.mutate(v))}
              className="flex flex-col gap-5"
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <ErrorMessage message={errors.email.message} />}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && <ErrorMessage message={errors.password.message} />}
              </div>

              {loginMutation.error && (
                <ErrorAlert error={loginMutation.error} fallback="Invalid email or password." />
              )}

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
