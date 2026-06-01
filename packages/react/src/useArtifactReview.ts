import {
  createReviewLayer,
  type ArtifactComment,
  type ArtifactInfo,
  type ReviewLayerInstance,
  type ReviewMode,
} from "@html-review-kit/core";
import { useEffect, useRef } from "react";

export interface UseArtifactReviewOptions {
  root: HTMLElement | Document | null;
  artifact: ArtifactInfo;
  reviewMode?: ReviewMode;
  comments?: ArtifactComment[];
  onCommentsChange?: (comments: ArtifactComment[]) => void;
}

export function useArtifactReview(options: UseArtifactReviewOptions): ReviewLayerInstance | null {
  const instanceRef = useRef<ReviewLayerInstance | null>(null);

  useEffect(() => {
    if (!options.root) return undefined;

    const review = createReviewLayer({
      root: options.root,
      artifact: options.artifact,
      mode: options.reviewMode,
      comments: options.comments,
      onCommentsChange: options.onCommentsChange,
    });
    review.enable();
    instanceRef.current = review;

    return () => {
      review.destroy();
      instanceRef.current = null;
    };
  }, [options.root, options.artifact, options.reviewMode]);

  useEffect(() => {
    const review = instanceRef.current;
    if (!review || !options.comments) return;

    review.importReviewPacket({
      schemaVersion: "0.1",
      artifact: options.artifact,
      comments: options.comments,
      exportedAt: new Date().toISOString(),
    });
  }, [options.comments, options.artifact]);

  return instanceRef.current;
}
