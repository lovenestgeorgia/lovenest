// One-shot: roll a comic project back to the style step.
//   - Deletes every panel row for the given project
//   - Deletes every panel image in storage for that project
//   - Sets the project status back to "styling"
//
// Usage:
//   node --env-file=.env.local scripts/reset-to-style.mjs <project-id>

import { createClient } from "@supabase/supabase-js";

const projectId = process.argv[2];
if (!projectId) {
    console.error("Usage: node --env-file=.env.local scripts/reset-to-style.mjs <project-id>");
    process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const PANEL_BUCKET = "comic-panels";

const { data: project, error: projErr } = await admin
    .from("comic_projects")
    .select("id, user_id, title, status")
    .eq("id", projectId)
    .single();

if (projErr || !project) {
    console.error(`Project not found: ${projectId}`, projErr?.message || "");
    process.exit(1);
}

console.log(`Project: ${project.title || "(untitled)"}  user=${project.user_id}  status=${project.status}`);

const { data: panels, error: panelsErr } = await admin
    .from("comic_panels")
    .select("id, image_path")
    .eq("project_id", projectId);
if (panelsErr) throw panelsErr;
console.log(`Panels to delete: ${panels.length}`);

const storagePrefix = `${project.user_id}/${projectId}`;
const { data: storageList, error: listErr } = await admin.storage
    .from(PANEL_BUCKET)
    .list(storagePrefix, { limit: 1000 });
if (listErr) {
    console.warn(`storage list failed: ${listErr.message}`);
} else if (storageList?.length) {
    const paths = storageList.map((f) => `${storagePrefix}/${f.name}`);
    console.log(`Storage files to delete: ${paths.length}`);
    const { error: removeErr } = await admin.storage.from(PANEL_BUCKET).remove(paths);
    if (removeErr) console.warn(`storage remove failed: ${removeErr.message}`);
    else console.log("  ✓ storage cleared");
} else {
    console.log("Storage already empty.");
}

const { error: delErr } = await admin
    .from("comic_panels")
    .delete()
    .eq("project_id", projectId);
if (delErr) throw delErr;
console.log("  ✓ panel rows deleted");

const { error: updErr } = await admin
    .from("comic_projects")
    .update({ status: "styling" })
    .eq("id", projectId);
if (updErr) throw updErr;
console.log("  ✓ status → styling");

console.log("\nDone. Project is back at the style step.");
