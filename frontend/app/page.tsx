"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Engine returned ${response.status}`);
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch(() => setError("The local engine is not reachable yet."));
  }, []);

  return (
    <main>
      <h1>PorulAxiom</h1>
      <p>Realistic paper trading foundation.</p>
      {health ? <p>Engine: {health.status}</p> : null}
      {error ? <p>{error}</p> : null}
      {!health && !error ? <p>Checking engine connection…</p> : null}
    </main>
  );
}
