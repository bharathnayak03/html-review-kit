import type {
  AddCommentInput,
  ArtifactComment,
  ArtifactInfo,
  ArtifactReviewPacket,
} from "../types";
import { exportReviewPacket } from "./exportReviewPacket";

export interface CreateCommentStoreOptions {
  artifact: ArtifactInfo;
  comments?: ArtifactComment[];
  onCommentCreate?: (comment: ArtifactComment) => void;
  onCommentUpdate?: (comment: ArtifactComment) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentsChange?: (comments: ArtifactComment[]) => void;
}

export interface CommentStore {
  getComments(): ArtifactComment[];
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

function cloneComments(comments: ArtifactComment[]): ArtifactComment[] {
  return comments.map((comment) => ({ ...comment, target: { ...comment.target } }));
}

export function createCommentStore(options: CreateCommentStoreOptions): CommentStore {
  let comments = cloneComments(options.comments ?? []);

  const emitChange = () => {
    options.onCommentsChange?.(cloneComments(comments));
  };

  return {
    getComments() {
      return cloneComments(comments);
    },

    addComment(input) {
      const comment: ArtifactComment = {
        id: createCommentId(),
        artifactId: options.artifact.artifactId,
        status: "open",
        body: input.body,
        aiInstruction: input.aiInstruction,
        target: input.target,
        author: input.author,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
      };

      comments = [...comments, comment];
      options.onCommentCreate?.({ ...comment });
      emitChange();
      return { ...comment };
    },

    updateComment(id, patch) {
      let updated: ArtifactComment | undefined;
      comments = comments.map((comment) => {
        if (comment.id !== id) return comment;
        updated = { ...comment, ...patch, id, updatedAt: new Date().toISOString() };
        return updated;
      });

      if (updated) {
        options.onCommentUpdate?.({ ...updated });
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
