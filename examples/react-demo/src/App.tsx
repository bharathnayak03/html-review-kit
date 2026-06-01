import { useState } from "react";
import { ArtifactReviewFrame } from "@html-review-kit/react";
import type { ArtifactComment } from "@html-review-kit/core";

const html = `
  <main data-hrk-id="react-demo">
    <section data-hrk-id="hero">
      <h1>Quarterly launch plan</h1>
      <p>This artifact can be reviewed inside an iframe.</p>
    </section>
    <section data-hrk-id="metrics">
      <h2>Metrics</h2>
      <p>Activation, retention, and expansion need clearer hierarchy.</p>
    </section>
  </main>
`;

export function App() {
  const [comments, setComments] = useState<ArtifactComment[]>([]);

  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, height: "100vh" }}>
      <ArtifactReviewFrame
        html={html}
        artifact={{ artifactId: "react-demo", sourceType: "html", sourceFile: "artifact.html" }}
        reviewMode="comment"
        comments={comments}
        onCommentsChange={setComments}
      />
      <pre style={{ margin: 0, overflow: "auto", padding: 16 }}>
        {JSON.stringify({ schemaVersion: "0.1", comments }, null, 2)}
      </pre>
    </main>
  );
}
