import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "@/lib/api";

export default function InvoicePreview() {
  const { lrNumber } = useParams();
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/invoice/${encodeURIComponent(lrNumber)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(setHtml)
      .catch((e) => setError(String(e.message)))
      .finally(() => setLoading(false));
  }, [lrNumber]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial, sans-serif", color: "#666", fontSize: 15 }}>
        Loading invoice…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2 style={{ color: "#dc2626", marginBottom: 8 }}>Invoice Not Found</h2>
          <p style={{ color: "#666", fontSize: 14 }}>No invoice found for LR number <strong>{lrNumber}</strong>.</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title={`LR Invoice – ${lrNumber}`}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
    />
  );
}
