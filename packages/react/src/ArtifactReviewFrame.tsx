import type { ArtifactComment, ArtifactInfo, ReviewMode } from "@html-review-kit/core";
import { useCallback, useRef, useState } from "react";
import { useArtifactReview } from "./useArtifactReview";

export interface ArtifactReviewFrameProps {
  html: string;
  artifact: ArtifactInfo;
  reviewMode?: ReviewMode;
  comments?: ArtifactComment[];
  onCommentsChange?: (comments: ArtifactComment[]) => void;
  className?: string;
  iframeSandbox?: string;
}

export function ArtifactReviewFrame({
  html,
  artifact,
  reviewMode = "off",
  comments,
  onCommentsChange,
  className,
  iframeSandbox = "allow-scripts",
}: ArtifactReviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeDocument, setIframeDocument] = useState<Document | null>(null);

  const handleLoad = useCallback(() => {
    setIframeDocument(iframeRef.current?.contentDocument ?? null);
  }, []);

  useArtifactReview({
    root: iframeDocument,
    artifact,
    reviewMode,
    comments,
    onCommentsChange,
  });

  return (
    <iframe
      ref={iframeRef}
      title="HTML artifact review"
      className={className}
      sandbox={iframeSandbox}
      srcDoc={html}
      onLoad={handleLoad}
      style={{ width: "100%", height: "100%", border: 0 }}
    />
  );
}
