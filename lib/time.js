/**
 * Lightweight relative time formatter to avoid external runtime dependency issues.
 * @param {Date|string|number} input
 * @param {{ addSuffix?: boolean }} options
 * @returns {string}
 */
export function formatDistanceToNow(input, options = {}) {
  const addSuffix = options.addSuffix !== false;
  const target = input instanceof Date ? input : new Date(input);
  const now = new Date();

  if (Number.isNaN(target.getTime())) {
    return addSuffix ? "just now" : "0 seconds";
  }

  const diffMs = target.getTime() - now.getTime();
  const past = diffMs < 0;
  const absSeconds = Math.max(1, Math.floor(Math.abs(diffMs) / 1000));

  const units = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  const unit = units.find((entry) => absSeconds >= entry.seconds) || units[units.length - 1];
  const value = Math.floor(absSeconds / unit.seconds);
  const suffix = value === 1 ? "" : "s";
  const base = `${value} ${unit.label}${suffix}`;

  if (!addSuffix) return base;
  return past ? `${base} ago` : `in ${base}`;
}