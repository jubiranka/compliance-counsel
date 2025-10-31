// src/components/TestAPI.tsx
import React, { useEffect, useState } from "react";
import api from "../api/api"; // ✅ correct import

const TestAPI: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api
      .get("/acts")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔍 Testing Backend API Connection</h2>
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {data ? (
        <pre style={{ background: "#f5f5f5", padding: "10px" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default TestAPI;
