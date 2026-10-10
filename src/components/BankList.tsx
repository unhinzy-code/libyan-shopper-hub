import { Copy } from "lucide-react";
import { toast } from "sonner";
import { BANKS } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BankList({ selected, onSelect }: { selected?: string | null; onSelect?: (name: string) => void }) {
  const list = onSelect ? BANKS : BANKS.filter((b) => !selected || b.name === selected);
  return (
    <div className="space-y-2">
      {list.map((b) => (
        <div
          key={b.iban}
          onClick={() => onSelect?.(b.name)}
          className={cn(
            "flex items-center justify-between gap-2 rounded-xl border-2 p-3",
            onSelect && "cursor-pointer",
            selected === b.name ? "border-primary bg-accent" : "bg-card",
          )}
        >
          <div>
            <p className="font-bold">{b.name}</p>
            <p dir="ltr" className="font-mono text-sm tracking-wide">{b.iban}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(b.iban);
              toast.success("تم نسخ رقم الحساب");
            }}
            className="rounded-lg p-2 text-primary hover:bg-muted"
            aria-label="نسخ"
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
