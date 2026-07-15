import type { Attachment, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export type AttachmentWithUploader = Attachment & { uploader: User | null };

export async function listAttachmentsForEntity(entity: {
  kind: "resource" | "incident";
  id: string;
}): Promise<readonly AttachmentWithUploader[]> {
  return request(() => {
    const { attachments, users } = getDatabase();
    return attachments
      .filter((a) => a.entity.kind === entity.kind && a.entity.id === entity.id)
      .map((a) => ({
        ...a,
        uploader: users.find((u) => u.id === a.uploadedById) ?? null,
      }));
  });
}
