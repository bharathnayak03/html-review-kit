import { createReviewLayer } from "@html-review-kit/core";

const review = createReviewLayer({
  root: document.body,
  artifact: {
    artifactId: "basic-html-demo",
    sourceType: "html",
    sourceFile: "index.html",
  },
  mode: "comment",
});

review.enable();

document.querySelector("#export-comments")?.addEventListener("click", () => {
  const packet = review.exportReviewPacket();
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "html-review-comments.json";
  link.click();
  URL.revokeObjectURL(url);
});
