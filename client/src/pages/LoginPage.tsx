import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod/v4";
import { useMutation } from "@tanstack/react-query";
import { signIn, useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorAlert from "@/components/ErrorAlert";
import ErrorMessage from "@/components/ErrorMessage";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Helpdesk</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => loginMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && <ErrorMessage message={errors.email.message} />}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
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
  );
}
