/**
 * Parses pagination params from URLSearchParams.
 * @param {URLSearchParams} searchParams
 * @param {number} [defaultLimit=20]
 * @returns {{ limit: number, page: number, skip: number }}
 */
export function parsePagination(searchParams, defaultLimit = 20) {
  const rawLimit = parseInt(searchParams.get('limit') ?? String(defaultLimit));
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? defaultLimit : rawLimit), 100);
  const rawPage = parseInt(searchParams.get('page') ?? '1');
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  return { limit, page, skip: (page - 1) * limit };
}
