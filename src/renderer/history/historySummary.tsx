import { Skeleton } from "../components/ui/skeleton.tsx";

type HistorySummaryProps = { text: string | null; pending: boolean };

export function HistorySummary({ text, pending }: HistorySummaryProps) {
  if (text) {
    return (
      <span className="animate-fade-in-fast font-display text-summary">
        {text}
      </span>
    );
  }
  if (!pending) return null;
  return <Skeleton className="h-lh w-65 text-summary" />;
}
