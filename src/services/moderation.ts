import { containsBadWord } from "@/lib/badwords";

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

export const checkContent = async (message: string): Promise<ModerationResult> => {
  if (!message || !message.trim()) {
    return { safe: false, reason: 'Empty message' };
  }

  // Local implementation: check badwords
  const isSafe = !containsBadWord(message);

  if (!isSafe) {
    return { safe: false, reason: 'Content violates community guidelines' };
  }

  // Future: integrate Azure Content Safety API here
  // Example:
  // const isAzureSafe = await azureCheckContent(message);
  // if (!isAzureSafe) {
  //   return { safe: false, reason: 'Content violates policies' };
  // }

  return { safe: true };
};
