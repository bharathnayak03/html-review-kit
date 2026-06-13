import type {
  AddCommentInput,
  ArtifactComment,
  ArtifactInfo,
  ArtifactReviewPacket,
  CommentStorageAdapter,
} from "../types";
import { exportReviewPacket } from "./exportReviewPacket";

export interface CreateCommentStoreOptions {
  artifact: ArtifactInfo;
  comments?: ArtifactComment[];
  storage?: CommentStorageAdapter;
  onCommentCreate?: (comment: ArtifactComment) => void;
  onCommentUpdate?: (comment: ArtifactComment) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentsChange?: (comments: ArtifactComment[]) => void;
}

export interface CommentStore {
  getComments(): ArtifactComment[];
  loadComments(): Promise<ArtifactComment[]>;
  saveComments(): Promise<void>;
  addComment(input: AddCommentInput): ArtifactComment;
  updateComment(id: string, patch: Partial<ArtifactComment>): void;
  deleteComment(id: string): void;
  exportReviewPacket(instructions?: string): ArtifactReviewPacket;
  importReviewPacket(packet: ArtifactReviewPacket): void;
}

let fallbackIdCounter = 0;

function createCommentId(): string {
  if (globalThis.crypto?.randomUUID) {
    return `cmt_${globalThis.crypto.randomUUID()}`;
  }

  fallbackIdCounter += 1;
  return `cmt_${Date.now()}_${fallbackIdCounter}`;
}

function cloneComment(comment: ArtifactComment): ArtifactComment {
  return structuredClone(comment);
}

function cloneComments(comments: ArtifactComment[]): ArtifactComment[] {
  return comments.map(cloneComment);
}

export function createCommentStore(options: CreateCommentStoreOptions): CommentStore {
  let comments = cloneComments(options.comments ?? []);

  const saveComments = async () => {
    if (!options.storage) return;
    await options.storage.save(cloneComments(comments));
  };

  const emitChange = () => {
    options.onCommentsChange?.(cloneComments(comments));
    void saveComments().catch(() => undefined);
  };

  return {
    getComments() {
      return cloneComments(comments);
    },

    async loadComments() {
      if (!options.storage) return cloneComments(comments);
      comments = cloneComments(await options.storage.load());
      options.onCommentsChange?.(cloneComments(comments));
      return cloneComments(comments);
    },

    saveComments,

    addComment(input) {
      const comment: ArtifactComment = {
        id: createCommentId(),
        artifactId: options.artifact.artifactId,
        status: "open",
        body: input.body,
        aiInstruction: input.aiInstruction,
        target: { ...input.target },
        author: input.author ? { ...input.author } : undefined,
        metadata: input.metadata ? { ...input.metadata } : undefined,
        createdAt: new Date().toISOString(),
      };

      comments = [...comments, comment];
      options.onCommentCreate?.(cloneComment(comment));
      emitChange();
      return cloneComment(comment);
    },

    updateComment(id, patch) {
      let updated: ArtifactComment | undefined;
      comments = comments.map((comment) => {
        if (comment.id !== id) return comment;
        updated = cloneComment({
          ...comment,
          ...patch,
          id,
          target: patch.target ? { ...patch.target } : comment.target,
          updatedAt: new Date().toISOString(),
        });
        return updated;
      });

      if (updated) {
        options.onCommentUpdate?.(cloneComment(updated));
        emitChange();
      }
    },

    deleteComment(id) {
      const beforeLength = comments.length;
      comments = comments.filter((comment) => comment.id !== id);
      if (comments.length !== beforeLength) {
        options.onCommentDelete?.(id);
        emitChange();
      }
    },

    exportReviewPacket(instructions) {
      return exportReviewPacket(options.artifact, comments, instructions);
    },

    importReviewPacket(packet) {
      comments = cloneComments(packet.comments);
      emitChange();
    },
  };
}
