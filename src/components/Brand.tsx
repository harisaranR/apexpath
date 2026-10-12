import { Route } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Route size={22} strokeWidth={2.5} />
      </span>
      <div>
        APEX<span>PATH</span>
        {!compact && <small>LAST-MILE, REIMAGINED</small>}
      </div>
    </div>
  );
}
