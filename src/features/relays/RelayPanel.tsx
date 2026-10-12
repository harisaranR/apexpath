import { ArrowRight, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import type { Order, Relay } from "../../types";
export function RelayPanel({
  relays,
  orders,
  completed,
  onComplete,
  compact = false,
}: {
  relays: Relay[];
  orders: Order[];
  completed: string[];
  onComplete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <section className={`panel relay-panel ${compact ? "compact" : ""}`}>
      <header className="panel-heading">
        <div>
          <h3>
            Relay handovers <span className="count">{relays.length}</span>
          </h3>
          <p>Bulk freight → local doorstep</p>
        </div>
        <ArrowLeftRight size={16} className="subtle" />
      </header>
      <div className="relay-list">
        {relays.map((r) => {
          const freight = orders.filter(
              (o) => o.relayId === r.id && o.status !== "Delivered",
            ),
            done = completed.includes(r.id);
          return (
            <div key={r.id} className="relay-row">
              <div className={`relay-symbol ${done ? "done" : ""}`}>
                {done ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <ArrowLeftRight size={18} />
                )}
              </div>
              <div className="relay-content">
                <strong>{r.name}</strong>
                <p>
                  <span className="blue">{r.truckId}</span>
                  <ArrowRight size={11} />
                  <span className="amber">{r.bikeId}</span>
                </p>
                <small>
                  {freight.length} parcels ·{" "}
                  {freight.reduce((s, o) => s + o.weight, 0)} kg ·{" "}
                  {done ? "Handed over" : "Ready for transfer"}
                </small>
              </div>
              <button
                className={done ? "quiet" : "table-link"}
                disabled={done || !freight.length}
                onClick={() => onComplete(r.id)}
              >
                {done ? "Complete" : "Handover"}
              </button>
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="relay-explanation">
          Demo handovers link a bulk truck to a local two-wheeler. Completing a
          handover records the transfer in this session; telemetry remains
          simulated.
        </p>
      )}
    </section>
  );
}
