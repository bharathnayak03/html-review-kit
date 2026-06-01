export type ArtifactSourceType = "html" | "react" | "mdx" | "unknown";

export interface ArtifactInfo {
  artifactId: string;
  version?: string;
  title?: string;
  sourceType?: ArtifactSourceType;
  sourceFile?: string;
}

export type ReviewMode = "off" | "comment" | "inspect";
export type ArtifactCommentStatus = "open" | "resolved" | "ignored";

export interface ArtifactTarget {
  anchorId?: string;
  xpath?: string;
  cssSelector?: string;
  textQuote?: string;
  textPosition?: { start: number; end: number };
  beforeText?: string;
  afterText?: string;
  htmlSnippet?: string;
  elementFingerprint?: {
    tagName: string;
    id?: string;
    classNames?: string[];
    role?: string;
    ariaLabel?: string;
    headingContext?: string;
    nearbyText?: string;
  };
}

export interface ArtifactComment {
  id: string;
  artifactId: string;
  status: ArtifactCommentStatus;
  body: string;
  aiInstruction?: string;
  target: ArtifactTarget;
  author?: { name?: string; email?: string };
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
  resolution?: {
    summary: string;
    changedFiles: string[];
  };
}

export interface ArtifactReviewPacket {
  schemaVersion: "0.1";
  artifact: ArtifactInfo;
  comments: ArtifactComment[];
  exportedAt: string;
  instructions?: string;
}

export interface AddCommentInput {
  body: string;
  aiInstruction?: string;
  target: ArtifactTarget;
  author?: ArtifactComment["author"];
  metadata?: Record<string, unknown>;
}

export interface CommentStorageAdapter {
  load(): Promise<ArtifactComment[]>;
  save(comments: ArtifactComment[]): Promise<void>;
}

export interface CreateReviewLayerOptions {
  root: HTMLElement | Document;
  artifact: ArtifactInfo;
  mode?: ReviewMode;
  comments?: ArtifactComment[];
  autoGenerateAnchors?: boolean;
  readonly?: boolean;
  onCommentCreate?: (comment: ArtifactComment) => void;
  onCommentUpdate?: (comment: ArtifactComment) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentsChange?: (comments: ArtifactComment[]) => void;
}

export interface ReviewLayerInstance {
  enable(): void;
  disable(): void;
  setMode(mode: ReviewMode): void;
  getComments(): ArtifactComment[];
  addComment(input: AddCommentInput): ArtifactComment;
  updateComment(id: string, patch: Partial<ArtifactComment>): void;
  deleteComment(id: string): void;
  exportReviewPacket(): ArtifactReviewPacket;
  importReviewPacket(packet: ArtifactReviewPacket): void;
  destroy(): void;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}
