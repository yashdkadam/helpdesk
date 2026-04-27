interface Props {
  message?: string;
}

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}
