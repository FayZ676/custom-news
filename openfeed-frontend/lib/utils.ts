export interface UserLocation {
  city: string;
  lat: number;
  lon: number;
}

const APP_VERSIONS = [{ volume: 0, startDate: "2025-11-24" }] as const;

export function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function getUserLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
              headers: {
                "User-Agent":
                  "OpenFeed/1.0 (https://github.com/FayZ676/custom-news)",
              },
            },
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            data.address?.suburb ||
            data.address?.district ||
            data.address?.county ||
            data.address?.state ||
            null;
          resolve(city ? { city, lat, lon } : null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
    );
  });
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const toTitleCase = (str: string) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

export function getEdition(): { volume: number; edition: number } {
  const today = new Date();
  const current = [...APP_VERSIONS]
    .reverse()
    .find((v) => new Date(v.startDate) <= today)!;
  const edition =
    Math.floor(
      (today.getTime() - new Date(current.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  return { volume: current.volume, edition };
}
