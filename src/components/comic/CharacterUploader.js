"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Upload, Trash2, ArrowRight, Sparkles } from "lucide-react";

export function CharacterUploader({ projectId, initialCharacters }) {
    const router = useRouter();
    const fileInput = useRef(null);
    const [characters, setCharacters] = useState(initialCharacters);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
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
            if (!res.ok) throw new Error(json.error || "Failed");
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
                <h3 className="font-serif text-lg text-text-dark mb-4">დაამატე პერსონაჟი</h3>

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
                        "ვამუშავებთ..."
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
        </div>
    );
}
