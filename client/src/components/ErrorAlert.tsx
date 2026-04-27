import axios from "axios";

interface Props {
  message?: string;
  error?: unknown;
  fallback?: string;
}

export default function ErrorAlert({ message, error, fallback }: Props) {
  let text = message;
  if (error) {
    if (axios.isAxiosError(error)) {
      text = error.response?.data?.error ?? error.message ?? fallback;
    } else if (error instanceof Error) {
      text = error.message;
    } else {
      text = fallback;
    }
  }
  if (!text) return null;
  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
      {text}
    </div>
  );
}
