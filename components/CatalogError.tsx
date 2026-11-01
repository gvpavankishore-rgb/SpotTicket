import { AlertTriangle } from "lucide-react";

interface CatalogErrorProps {
  message: string;
}

export default function CatalogError({ message }: CatalogErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">We could not load the catalog.</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
          {message}
        </p>
      </div>
    </div>
  );
}
