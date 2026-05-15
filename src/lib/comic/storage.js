// Helpers for Supabase Storage paths and signed URLs.

export const CHARACTER_BUCKET = "comic-characters";
export const PANEL_BUCKET = "comic-panels";

export function characterPath({ userId, projectId, filename }) {
    return `${userId}/${projectId}/${filename}`;
}

export function panelPath({ userId, projectId, panelId, hq = false }) {
    return `${userId}/${projectId}/${panelId}${hq ? "-hq" : ""}.png`;
}

export async function signedUrl(supabase, bucket, path, expiresIn = 60 * 60) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
}
