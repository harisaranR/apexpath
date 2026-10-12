import { useState } from "react";
import { Save, Radio, Map, Building2 } from "lucide-react";
import type { Preferences } from "../../types";
import { defaultPreferences } from "../../lib/preferences";
export function Settings({
  preferences,
  onSave,
}: {
  preferences: Preferences;
  onSave: (value: Preferences) => void;
}) {
  const [draft, setDraft] = useState(preferences),
    [error, setError] = useState("");
  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.workspaceName.trim()) return setError("Enter a workspace name.");
    setError("");
    onSave({ ...draft, workspaceName: draft.workspaceName.trim() });
  }
  return (
    <form onSubmit={submit} className="settings-form">
      <section className="panel settings-section">
        <header className="panel-heading">
          <div>
            <h3>Workspace preferences</h3>
            <p>These preferences are stored in this browser when saved.</p>
          </div>
        </header>
        <div className="settings-fields">
          <label>
            Workspace name
            <input
              required
              maxLength={40}
              value={draft.workspaceName}
              onChange={(e) =>
                setDraft({ ...draft, workspaceName: e.target.value })
              }
            />
          </label>
          <div className="setting-description">
            <Building2 size={21} />
            <span>
              Chennai, India<small>Demo center: 13.0827° N · 80.2707° E</small>
            </span>
          </div>
        </div>
      </section>
      <section className="panel settings-section">
        <header className="panel-heading">
          <div>
            <h3>Tracking simulation</h3>
            <p>
              Synthetic GPS and GSM telemetry. No physical hardware is
              connected.
            </p>
          </div>
          <Radio size={17} />
        </header>
        <div className="settings-fields">
          <label>
            Telemetry update interval
            <select
              value={draft.intervalMs}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  intervalMs: Number(
                    e.target.value,
                  ) as Preferences["intervalMs"],
                })
              }
            >
              <option value={1000}>Every 1 second</option>
              <option value={2000}>Every 2 seconds</option>
              <option value={5000}>Every 5 seconds</option>
            </select>
          </label>
          <p className="setting-description">
            Use Pause / Resume simulation in the toolbar to control the demo.
            The interval applies across vehicle markers and device status
            panels.
          </p>
        </div>
      </section>
      <section className="panel settings-section">
        <header className="panel-heading">
          <div>
            <h3>Map & route display</h3>
            <p>Display controls for the real OpenFreeMap workspace</p>
          </div>
          <Map size={17} />
        </header>
        <div className="settings-fields">
          <label>
            Default camera view
            <select
              value={draft.default3D ? "3d" : "2d"}
              onChange={(e) =>
                setDraft({ ...draft, default3D: e.target.value === "3d" })
              }
            >
              <option value="2d">2D overview</option>
              <option value="3d">3D tilted view</option>
            </select>
          </label>
          <div className="setting-checks">
            {[
              { key: "showBuildings", label: "Show 3D building extrusions" },
              { key: "showTruckRoutes", label: "Show four-wheeler routes" },
              { key: "showBikeRoutes", label: "Show two-wheeler routes" },
            ].map((item) => (
              <label key={item.key}>
                <input
                  type="checkbox"
                  checked={draft[item.key as keyof Preferences] === true}
                  onChange={(e) =>
                    setDraft({ ...draft, [item.key]: e.target.checked })
                  }
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </section>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="settings-actions">
        <button className="primary" type="submit">
          <Save size={15} />
          Save preferences
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft({ ...defaultPreferences });
            setError("");
          }}
        >
          Restore defaults
        </button>
        <span className="subtle">
          Restore defaults fills this form; save to apply.
        </span>
      </div>
    </form>
  );
}
