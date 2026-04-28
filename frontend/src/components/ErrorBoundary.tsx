import React from "react";

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Keep a console trace for local debugging.
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 18,
        }}
      >
        <div
          style={{
            width: "min(760px, 100%)",
            borderRadius: 18,
            border: "1px solid rgba(148, 163, 184, 0.22)",
            background: "rgba(15, 23, 42, 0.72)",
            color: "#e2e8f0",
            padding: 18,
            boxShadow: "0 24px 48px rgba(2, 6, 23, 0.36)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
            {this.props.title || "Something went wrong"}
          </div>
          <div style={{ opacity: 0.9, marginBottom: 12 }}>
            The app hit a runtime error while rendering this screen.
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              fontSize: 13,
              lineHeight: 1.35,
              opacity: 0.92,
            }}
          >
            {error.name}: {error.message}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

