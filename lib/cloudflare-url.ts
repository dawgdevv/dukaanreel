export function assetPath(key: string): string {
  return `/api/assets/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function normalizeAssetUrl(value: string, legacyBaseUrl = ""): string {
  if (value.startsWith("/api/assets/")) return value;
  if (legacyBaseUrl && value.startsWith(`${legacyBaseUrl.replace(/\/$/, "")}/`)) {
    return assetPath(value.slice(legacyBaseUrl.replace(/\/$/, "").length + 1));
  }
  return value;
}
