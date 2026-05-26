import { useMemo, useState } from "react";

type TriggerAction = {
  id: string;
  label: string;
  description: string;
  method?: "GET" | "POST";
  path?: string;
  url?: string;
  payload?: Record<string, string>;
};

type TriggerState = {
  loading: boolean;
  message?: string;
  error?: string;
};

const scriptBaseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_BASE_URL?.trim() ?? "";

const triggerActions: TriggerAction[] = [
  {
    id: "daily-report",
    label: "Run Daily Report",
    description: "Calls the Apps Script that generates the daily report.",
    method: "POST",
    payload: { action: "daily-report" },
  },
  {
    id: "sync-sheet",
    label: "Sync Sheet Data",
    description: "Refreshes spreadsheet data from the latest source.",
    method: "POST",
    payload: { action: "sync-sheet" },
  },
  {
    id: "send-summary",
    label: "Send Summary Email",
    description: "Triggers the email summary workflow from Apps Script.",
    method: "POST",
    payload: { action: "send-summary" },
  },
  {
    id: "health-check",
    label: "Check Script Status",
    description:
      "Uses a GET request to confirm the deployed script is reachable.",
    method: "GET",
    path: "?action=health-check",
  },
];

const getEndpoint = (action: TriggerAction) => {
  if (action.url) {
    return action.url;
  }

  if (!scriptBaseUrl) {
    return "";
  }

  if (!action.path) {
    return scriptBaseUrl;
  }

  return `${scriptBaseUrl}${action.path}`;
};

const readResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json(), null, 2);
  }

  return response.text();
};

export default function App() {
  const [triggerStates, setTriggerStates] = useState<
    Record<string, TriggerState>
  >({});

  const readyCount = useMemo(
    () =>
      triggerActions.filter((action) => Boolean(getEndpoint(action))).length,
    [],
  );

  const runTrigger = async (action: TriggerAction) => {
    const endpoint = getEndpoint(action);

    if (!endpoint) {
      setTriggerStates((current) => ({
        ...current,
        [action.id]: {
          loading: false,
          error:
            "Missing URL. Set VITE_GOOGLE_SCRIPT_BASE_URL or add a direct url for this button.",
        },
      }));
      return;
    }

    setTriggerStates((current) => ({
      ...current,
      [action.id]: {
        loading: true,
        message: undefined,
        error: undefined,
      },
    }));

    try {
      const response = await fetch(endpoint, {
        method: action.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          action.method === "GET"
            ? undefined
            : JSON.stringify(action.payload ?? { action: action.id }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result || `Request failed with status ${response.status}`,
        );
      }

      setTriggerStates((current) => ({
        ...current,
        [action.id]: {
          loading: false,
          message: result || "Completed successfully.",
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";

      setTriggerStates((current) => ({
        ...current,
        [action.id]: {
          loading: false,
          error: message,
        },
      }));
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">React + TypeScript</p>
        <h1>Workflow Trigger Panel</h1>
        <p className="hero-copy">
          A simple dashboard for running Google Apps Script workflows from one
          screen. Update the button config in <code>src/App.tsx</code> and point
          the app at your deployed script URL.
        </p>
        <div className="hero-stats">
          <div>
            <span className="stat-label">Configured actions</span>
            <strong>{triggerActions.length}</strong>
          </div>
          <div>
            <span className="stat-label">Ready to run</span>
            <strong>{readyCount}</strong>
          </div>
        </div>
      </section>

      <section className="actions-grid" aria-label="Trigger actions">
        {triggerActions.map((action) => {
          const state = triggerStates[action.id];

          return (
            <article className="action-card" key={action.id}>
              <div>
                <p className="action-kicker">
                  {action.method ?? "POST"} request
                </p>
                <h2>{action.label}</h2>
                <p className="action-description">{action.description}</p>
              </div>

              <button
                className="trigger-button"
                type="button"
                onClick={() => void runTrigger(action)}
                disabled={state?.loading}
              >
                {state?.loading ? "Running..." : action.label}
              </button>

              <div className="response-panel" aria-live="polite">
                {state?.message ? <pre>{state.message}</pre> : null}
                {state?.error ? (
                  <p className="error-message">{state.error}</p>
                ) : null}
                {!state?.message && !state?.error ? (
                  <p className="placeholder-text">
                    Response details will appear here after the script runs.
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
