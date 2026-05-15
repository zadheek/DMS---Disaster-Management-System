import { prisma } from "./prisma";

/**
 * Log an admin action to the AdminLog table.
 * Failures are swallowed to avoid breaking the primary operation.
 * @param {string} adminId
 * @param {string} action
 * @param {string|null} targetType
 * @param {string|null} targetId
 * @param {string|null} note
 */
export async function logAdminAction(
  adminId,
  action,
  targetType = null,
  targetId = null,
  note = null
) {
  try {
    await prisma.adminLog.create({
      data: { adminId, action, targetType, targetId, note },
    });
  } catch (err) {
    console.error("Failed to write admin log:", err);
  }
}
