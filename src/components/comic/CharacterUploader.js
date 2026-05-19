"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Trash2, ArrowRight, Sparkles, Sun, User, Smile, Camera } from "lucide-react";
import { AiErrorModal } from "@/components/comic/AiErrorModal";

const FACE_ISSUE_MESSAGES = {
    no_face: "ფოტოზე სახე ვერ ვიპოვეთ. ატვირთე ფოტო სადაც სახე კარგად ჩანს.",
    multiple_faces:
        "ფოტოზე რამდენიმე სახეა — ერთი პერსონაჟისთვის ერთი სახე უნდა იყოს. გადახარისხე ფოტო.",
    blurry: "ფოტო ბუნდოვანია. სცადე უფრო მკაფიო, ფოკუსში მყოფი ფოტო.",
    too_dark: "ფოტო ძალიან ბნელია. გვჭირდება უკეთ განათებული ფოტო.",
    face_too_small: "ფოტოზე სახე ძალიან შორსაა. სცადე ფოტო სადაც სახე უფრო კარგად ჩანს.",
    occluded:
        "სახე დაფარულია (ნიღაბი/ხელი). გვჭირდება ფოტო სადაც სრული სახე ჩანს.",
    low_resolution: "ფოტოს გარჩევადობა დაბალია. ატვირთე უფრო მაღალი ხარისხის ფოტო.",
    not_a_person: "ფოტოზე ადამიანი არ ჩანს. გვჭირდება პერსონაჟის ფოტო.",
};

export function CharacterUploader({ projectId, initialCharacters }) {
    const router = useRouter();
    const fileInput = useRef(null);
    const [characters, setCharacters] = useState(initialCharacters);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [aiError, setAiError] = useState(null); // { code, detail }
    const [advancing, setAdvancing] = useState(false);

    const [draft, setDraft] = useState({ name: "", description: "" });
    const [draftFile, setDraftFile] = useState(null);

    const pickFile = () => fileInput.current?.click();

    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (f) setDraftFile(f);
    };

    const addCharacter = async () => {
        if (!draftFile) {
            setError("ფოტოს ატვირთვა აუცილებელია");
            return;
        }
        if (!draft.name.trim()) {
            setError("შეიყვანე სახელი");
            return;
        }
        setUploading(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append("file", draftFile);
            fd.append("name", draft.name.trim());
            fd.append("description", draft.description.trim());

            const res = await fetch(`/api/comic/projects/${projectId}/characters`, {
                method: "POST",
                body: fd,
            });
            const json = await res.json();
            if (!res.ok) {
                if (json.error === "face_quality") {
                    throw new Error(
                        FACE_ISSUE_MESSAGES[json.issue] ||
                            "ფოტო არ შეესაბამება მოთხოვნებს. სცადე სხვა ფოტო."
                    );
                }
                if (json.error === "ai_unavailable" || json.error === "ai_failed") {
                    setAiError({ code: json.error, detail: json.detail || "" });
                    return; // modal handles UX; don't show inline error too
                }
                throw new Error(json.error || "Failed");
            }
            setCharacters((cs) => [...cs, json.character]);
            setDraft({ name: "", description: "" });
            setDraftFile(null);
            if (fileInput.current) fileInput.current.value = "";
        } catch (e) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    };

    const removeCharacter = async (id) => {
        await fetch(`/api/comic/projects/${projectId}/characters/${id}`, { method: "DELETE" });
        setCharacters((cs) => cs.filter((c) => c.id !== id));
    };

    const proceed = async () => {
        if (characters.length === 0) {
            setError("მინიმუმ ერთი პერსონაჟი მაინც დაამატე");
            return;
        }
        setAdvancing(true);
        try {
            await fetch(`/api/comic/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "styling" }),
            });
            router.push(`/comic/${projectId}/style`);
        } catch (e) {
            setAdvancing(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Photo guidance — shown only when there are no characters yet,
                so first-time users avoid face_quality rejections */}
            {characters.length === 0 && (
                <div className="bg-amber-50/40 border border-amber-100/80 rounded-2xl p-5">
                    <div className="flex items-baseline gap-2 mb-3">
                        <Camera size={14} className="text-primary translate-y-[2px]" />
                        <h3 className="font-serif font-bold text-text-dark text-sm">
                            რა არის კარგი ფოტო?
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: User, label: "ერთი სახე ფოტოზე" },
                            { icon: Sun, label: "კარგი განათება" },
                            { icon: Smile, label: "ღია სახე" },
                            { icon: Camera, label: "ფოკუსში, არ ბუნდოვანი" },
                        ].map(({ icon: Icon, label }, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center text-center gap-2 p-2"
                            >
                                <span className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center border border-amber-100">
                                    <Icon size={16} strokeWidth={1.75} />
                                </span>
                                <span className="text-[11px] text-text-mutted leading-tight">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Existing */}
            {characters.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {characters.map((c) => (
                        <div key={c.id} className="bg-rose-50/30 rounded-2xl border border-rose-100 p-4">
                            <div className="flex gap-3">
                                <div className="w-20 h-20 rounded-xl bg-rose-50 overflow-hidden relative flex-shrink-0">
                                    {c.reference_image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={c.reference_image_url}
                                            alt={c.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary/30 text-2xl font-serif">
                                            {c.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-serif font-bold text-text-dark">{c.name}</h4>
                                        <button
                                            onClick={() => removeCharacter(c.id)}
                                            className="text-text-mutted hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    {c.description && <p className="text-xs text-text-mutted mt-1 line-clamp-2">{c.description}</p>}
                                    {c.persona && (
                                        <p className="text-[10px] text-green-700 mt-2 inline-flex items-center gap-1">
                                            <Sparkles size={10} /> AI-მ შეისწავლა სახე
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add new */}
            <div className="bg-rose-50/20 rounded-2xl border-2 border-dashed border-rose-200 p-6">
                <div className="flex items-baseline justify-between mb-4">
                    <h3 className="font-serif text-lg text-text-dark">
                        {characters.length === 0 ? "დაამატე პერსონაჟი" : "კიდევ ერთი პერსონაჟი"}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-mutted/70">
                        {characters.length}/8
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
                    <button
                        type="button"
                        onClick={pickFile}
                        className="aspect-square rounded-xl border-2 border-dashed border-rose-300 bg-white flex flex-col items-center justify-center text-text-mutted hover:border-primary hover:text-primary transition-colors p-4"
                    >
                        {draftFile ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={URL.createObjectURL(draftFile)}
                                alt="preview"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <>
                                <Upload size={28} />
                                <span className="text-xs mt-2">ფოტო</span>
                            </>
                        )}
                    </button>
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        onChange={onFile}
                        className="hidden"
                    />

                    <div className="space-y-3">
                        <input
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            placeholder="სახელი (მაგ: ნინო)"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                        <textarea
                            value={draft.description}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            placeholder="აღწერა (მაგ: ჩემი და, 24 წლის. გრძელი ყავისფერი თმა, ხშირად აცვია ჯემპერი.)"
                            rows={2}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

                <button
                    onClick={addCharacter}
                    disabled={uploading}
                    className="elegant-btn mt-4 text-sm inline-flex items-center gap-2"
                >
                    {uploading ? (
                        <span className="inline-flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            AI ამოწმებს ფოტოს...
                        </span>
                    ) : (
                        <>
                            <Plus size={16} /> დამატება
                        </>
                    )}
                </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-rose-50">
                <button
                    onClick={proceed}
                    disabled={advancing || characters.length === 0}
                    className="elegant-btn inline-flex items-center gap-2 disabled:opacity-40"
                >
                    შემდეგი: სტილი <ArrowRight size={16} />
                </button>
            </div>

            <AiErrorModal
                error={aiError}
                onClose={() => setAiError(null)}
            />
        </div>
    );
}
