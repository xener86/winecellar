export type WineInfo = {
  name: string;
  vintage?: number;
  domain?: string;
  appellation?: string;
  region?: string;
  alcoholPercentage?: number;
};

export function formatDisplayName(name: string, domain?: string): string {
  let displayName = name;
  if (domain && name.includes(domain)) {
    const remainingName = name.replace(domain, '').trim();
    if (remainingName) {
      displayName = remainingName;
    }
  }
  return displayName;
}
