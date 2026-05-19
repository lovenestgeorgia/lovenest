"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Sparkles, ArrowRight, Heart, MapPin, Users, Clock } from "lucide-react";

const STARTERS = [
    {
        icon: Heart,
        label: "სიყვარულის ისტორია",
        seed: "მინდა მოვუყვე ჩვენი პირველი შეხვედრის ისტორია — როგორ შეგვხვდით, რა გავიფიქრე პირველად, რა იყო ის ერთი მომენტი როცა გავიგე რომ მისთვის განსაკუთრებული ვარ.",
    },
    {
        icon: MapPin,
        label: "ერთობლივი მოგზაურობა",
        seed: "ერთად მოგზაურობას ვაკეთებდით [ადგილზე]. გვინდა გადმოვცე ის გრძნობა — სად ვიყავით, რა ხდებოდა და ის ერთი მომენტი რომელიც დაუვიწყარი დარჩა.",
    },
    {
        icon: Users,
        label: "მეგობრებთან",
        seed: "ჩემს საუკეთესო მეგობარს უნდა ვაჩუქო — გვინდა გადმოვცე ჩვენი მეგობრობის ისტორია: როდის გავხდით ახლობლები, ერთი სასაცილო თუ მნიშვნელოვანი მომენტი, რას ნიშნავს ჩვენთვის ეს მეგობრობა.",
    },
    {
        icon: Clock,
        label: "წლისთავი",
        seed: "გვაქვს წლისთავი და მინდა ჩვენი ერთობლივი წლები გადმოვცე — როგორ დავიწყეთ, საუკეთესო მომენტი ერთად, რას ვუკეთებთ ერთმანეთს განსაკუთრებულს.",
    },
];

export function InterviewChat({ projectId, initialMessages, initialStory }) {
    const router = useRouter();
    const [messages, setMessages] = useState(initialMessages);
    const [story, setStory] = useState(initialStory);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [streaming, setStreaming] = useState("");
    const [ready, setReady] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const scrollRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, streaming, sending]);

    const send = async (e) => {
        e?.preventDefault();
        if (!draft.trim() || sending) return;
        const userMsg = { role: "user", content: draft.trim() };
        setMessages((m) => [...m, userMsg]);
        setDraft("");
        setSending(true);
        setStreaming("");

        try {
            const res = await fetch(`/api/comic/projects/${projectId}/interview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.content, story }),
            });
            if (!res.ok || !res.body) throw new Error("Network error");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let acc = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                acc += decoder.decode(value, { stream: true });
                setStreaming(acc);
            }

            const readyMatch = acc.match(/READY_TO_GENERATE:\s*([\s\S]+)/);
            if (readyMatch) {
                setReady(true);
                setStory(readyMatch[1].trim());
                acc = acc.replace(/READY_TO_GENERATE:[\s\S]+/, "").trim();
            }
            setMessages((m) => [...m, { role: "assistant", content: acc }]);
            setStreaming("");
        } catch (err) {
            setMessages((m) => [
                ...m,
                { role: "assistant", content: `(შეცდომა: ${err.message})` },
            ]);
            setStreaming("");
        } finally {
            setSending(false);
        }
    };

    const proceed = async () => {
        setAdvancing(true);
        try {
            await fetch(`/api/comic/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ story_text: story, status: "characters" }),
            });
            router.push(`/comic/${projectId}/characters`);
        } catch (e) {
            setAdvancing(false);
        }
    };

    const pickStarter = (seed) => {
        setDraft(seed);
        // Focus + put cursor at the end so user can immediately customize
        setTimeout(() => {
            const el = textareaRef.current;
            if (el) {
                el.focus();
                el.setSelectionRange(seed.length, seed.length);
            }
        }, 50);
    };

    const userMessageCount = messages.filter((m) => m.role === "user").length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Chat */}
            <div className="flex flex-col h-[60vh] min-h-[440px] bg-rose-50/20 rounded-2xl border border-rose-100 overflow-hidden">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {messages.length === 0 ? (
                        <div className="py-6 sm:py-8 max-w-md mx-auto">
                            <div className="text-center mb-6">
                                <Sparkles size={26} className="mx-auto text-primary/50 mb-3" />
                                <p className="text-sm text-text-dark font-medium mb-1">
                                    საიდან დავიწყოთ?
                                </p>
                                <p className="text-xs text-text-mutted">
                                    აირჩიე ვარიანტი — ან დაწერე საკუთარი ისტორია ქვევით
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {STARTERS.map(({ icon: Icon, label, seed }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => pickStarter(seed)}
                                        className="group flex items-start gap-3 p-3 bg-white border border-rose-100 rounded-xl text-left hover:border-primary hover:shadow-sm transition-all"
                                    >
                                        <span className="w-8 h-8 rounded-full bg-rose-50 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Icon size={14} />
                                        </span>
                                        <span className="text-xs font-medium text-text-dark leading-snug pt-1">
                                            {label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((m, idx) => (
                            <ChatBubble key={idx} role={m.role}>
                                {m.content}
                            </ChatBubble>
                        ))
                    )}
                    {streaming && (
                        <ChatBubble role="assistant" streaming>
                            {streaming}
                        </ChatBubble>
                    )}
                    {sending && !streaming && <TypingDots />}
                </div>

                <form
                    onSubmit={send}
                    className="border-t border-rose-100 p-3 flex gap-2 bg-white"
                >
                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        placeholder={
                            messages.length === 0
                                ? "დაიწყე აქ — ვინ, სად, რა მოხდა..."
                                : "უპასუხე..."
                        }
                        disabled={sending}
                        rows={1}
                        className="flex-1 bg-bg-light border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-50 resize-none max-h-32"
                    />
                    <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="elegant-btn px-4 disabled:opacity-40 self-end h-[46px]"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

            {/* Side panel */}
            <aside className="space-y-4">
                {/* Progress nudge — tells the user how the conversation is going */}
                <div className="bg-white rounded-2xl border border-rose-100 p-5">
                    <div className="flex items-baseline justify-between mb-3">
                        <h3 className="font-serif font-bold text-text-dark text-sm">პროგრესი</h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-mutted/70">
                            {userMessageCount} პასუხი
                        </span>
                    </div>
                    {/* Progress bar — fills to "ready" around 4 exchanges */}
                    <div className="h-1 bg-rose-100 rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full bg-primary transition-[width] duration-500 ease-out"
                            style={{
                                width: ready
                                    ? "100%"
                                    : `${Math.min(85, userMessageCount * 22)}%`,
                            }}
                        />
                    </div>
                    <p className="text-xs text-text-mutted leading-relaxed">
                        {ready
                            ? "ისტორია მზადაა გასაგრძელებლად!"
                            : userMessageCount === 0
                            ? "უპასუხე AI-ის შეკითხვებს. დაახლოებით 3-4 პასუხის შემდეგ მზადა ვიქნებით."
                            : userMessageCount < 3
                            ? `კიდევ ცოტა, ${3 - userMessageCount} პასუხის შემდეგ მზადა ვიქნებით.`
                            : "თუ მზადა ხარ, შეგიძლია გადახვიდე შემდეგ ნაბიჯზე."}
                    </p>
                </div>

                <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-5">
                    <h3 className="font-serif font-bold text-text-dark text-sm mb-3">რჩევები</h3>
                    <ul className="text-xs text-text-mutted space-y-2 leading-relaxed">
                        <li>• კონკრეტული მომენტი ჯობია ზოგად აღწერას</li>
                        <li>• ვინ მონაწილეობს, სად, როდის</li>
                        <li>• რა გრძნობა გადმოგვცე — ბედნიერი, მელანქოლიური, მხიარული</li>
                        <li>• ერთი დეტალი რომელიც დაუვიწყარია</li>
                    </ul>
                </div>

                {ready && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-3 shadow-sm">
                        <div className="flex items-baseline justify-between">
                            <p className="text-sm font-bold text-green-900">ისტორია მზადაა</p>
                            <Sparkles size={14} className="text-green-700" />
                        </div>
                        <p className="text-xs text-green-800 leading-relaxed">{story}</p>
                        <button
                            onClick={proceed}
                            disabled={advancing}
                            className="elegant-btn w-full text-sm py-2.5 inline-flex items-center justify-center gap-2"
                        >
                            შემდეგი: პერსონაჟები <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {!ready && userMessageCount >= 3 && (
                    <button
                        onClick={proceed}
                        disabled={advancing}
                        className="elegant-btn-outline w-full text-sm py-2.5 inline-flex items-center justify-center gap-2"
                    >
                        გადახტი პერსონაჟებზე <ArrowRight size={14} />
                    </button>
                )}
            </aside>
        </div>
    );
}

function ChatBubble({ role, children, streaming }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                    isUser
                        ? "bg-primary text-white rounded-br-sm shadow-sm"
                        : "bg-white border border-rose-100 text-text-dark rounded-bl-sm"
                }`}
            >
                {children}
                {streaming && (
                    <motion.span
                        className="inline-block w-[3px] h-4 bg-primary align-middle ml-1 rounded-[1px]"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>
        </div>
    );
}

function TypingDots() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex justify-start"
        >
            <div className="bg-white border border-rose-100 rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 h-4">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/70"
                            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                delay: i * 0.18,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
