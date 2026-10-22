
import { useState } from "react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

export default function RedirectSimulator() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function simulateRedirect() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/next-activity/?threshold_reached=true`
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        "Could not contact Focus2Finish. Check that Django is running and try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={styles.card}>
      <h2>Smart Redirect</h2>

      <p>
        Simulate spending 30 minutes on a recreational app and
        see what Focus2Finish recommends next.
      </p>

      <button
        onClick={simulateRedirect}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Checking your plan..." : "Simulate 30-minute limit"}
      </button>

      {error && (
        <p role="alert" style={styles.error}>
          {error}
        </p>
      )}

      {result && (
        <div style={styles.result} aria-live="polite">
          <h3>
            {result.should_redirect
              ? "Ready for a focus session?"
              : result.title || "No redirect needed"}
          </h3>

          <p>{result.message}</p>

          {result.should_redirect && (
            <>
              <p>
                <strong>Suggested activity:</strong>{" "}
                {result.title}
              </p>

              {result.type && (
                <p>
                  <strong>Type:</strong> {result.type}
                </p>
              )}

              {result.estimated_minutes != null && (
                <p>
                  <strong>Estimated time:</strong>{" "}
                  {result.estimated_minutes} minutes
                </p>
              )}

              {result.description && (
                <p>{result.description}</p>
              )}

              {result.url && (
                <p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open learning resource
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

const styles = {
  card: {
    marginTop: "24px",
    padding: "24px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#1f2937",
  },
  button: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "15px",
  },
  result: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "8px",
    background: "#f3f4f6",
  },
  error: {
    color: "#b91c1c",
    marginTop: "16px",
  },
};
