import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const [{ data: project }, { data: panels }] = await Promise.all([
        supabase
            .from("comic_projects")
            .select("id, title, paid_digital, user_id")
            .eq("id", id)
            .single(),
        supabase
            .from("comic_panels")
            .select("ord, caption, image_url, status")
            .eq("project_id", id)
            .order("ord", { ascending: true }),
    ]);

    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Explicit ownership check — never rely on RLS alone for paid deliverables.
    // Even when the dev bypass is active, the user must still own the project.
    if (project.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!project.paid_digital && !isDevUser(user)) {
        return NextResponse.json({ error: "not paid" }, { status: 402 });
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);

    // NOTE: pdf-lib's standard fonts (Helvetica) don't include Georgian glyphs.
    // To render Georgian text drop a TTF into public/fonts/noto-sans-georgian.ttf,
    // then load it here with pdf.registerFontkit + pdf.embedFont(ttfBytes).
    // Until then, we wrap drawText in try/catch so generation never fails on captions.
    const safeText = (page, text, opts) => {
        try {
            page.drawText(text, { font, ...opts });
        } catch {
            // Strip to ASCII as a last resort
            try {
                const ascii = text.replace(/[^\x20-\x7E]/g, "?");
                page.drawText(ascii, { font, ...opts });
            } catch {}
        }
    };

    // Cover page
    const cover = pdf.addPage([612, 792]); // US Letter
    cover.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(0.98, 0.96, 0.94) });
    safeText(cover, project.title || "My Comic", {
        x: 60,
        y: 500,
        size: 36,
        color: rgb(0.5, 0.12, 0.23),
        maxWidth: 492,
    });
    safeText(cover, "Generated with Lovenest", {
        x: 60,
        y: 460,
        size: 14,
        color: rgb(0.4, 0.4, 0.4),
    });

    for (const p of panels || []) {
        if (p.status !== "ready" || !p.image_url) continue;
        let pngBytes;
        try {
            const r = await fetch(p.image_url);
            pngBytes = new Uint8Array(await r.arrayBuffer());
        } catch (e) {
            continue;
        }
        const img = await pdf.embedPng(pngBytes).catch(async () => pdf.embedJpg(pngBytes));
        const page = pdf.addPage([612, 792]);
        const margin = 50;
        const maxW = 612 - margin * 2;
        const maxH = 660;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, {
            x: (612 - w) / 2,
            y: 792 - h - margin,
            width: w,
            height: h,
        });
        if (p.caption) {
            safeText(page, p.caption, {
                x: margin,
                y: 60,
                size: 12,
                color: rgb(0.2, 0.2, 0.2),
                maxWidth: maxW,
            });
        }
    }

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${(project.title || "comic").replace(/[^a-z0-9-]/gi, "_")}.pdf"`,
            "Cache-Control": "no-store",
        },
    });
}
