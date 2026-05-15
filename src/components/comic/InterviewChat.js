"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, ArrowRight } from "lucide-react";

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

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, streaming]);

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

            // Strip the READY_TO_GENERATE marker from display
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Chat */}
            <div className="flex flex-col h-[60vh] min-h-[400px] bg-rose-50/20 rounded-2xl border border-rose-100">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-text-mutted text-sm p-8">
                            <Sparkles size={28} className="mx-auto text-primary/40 mb-3" />
                            დაიწყე — დაწერე ისტორიის ნებისმიერი ნაწილი ქვევით.
                        </div>
                    )}
                    {messages.map((m, idx) => (
                        <ChatBubble key={idx} role={m.role}>{m.content}</ChatBubble>
                    ))}
                    {streaming && <ChatBubble role="assistant" streaming>{streaming}</ChatBubble>}
                </div>

                <form onSubmit={send} className="border-t border-rose-100 p-3 flex gap-2 bg-white rounded-b-2xl">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="დაწერე..."
                        disabled={sending}
                        className="flex-1 bg-bg-light border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="elegant-btn px-5 disabled:opacity-40"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

            {/* Side panel */}
            <aside className="space-y-4">
                <div className="bg-white rounded-2xl border border-rose-100 p-5">
                    <h3 className="font-serif font-bold text-text-dark text-sm mb-3">რჩევები</h3>
                    <ul className="text-xs text-text-mutted space-y-2 leading-relaxed">
                        <li>• დაიწყე კონკრეტული მომენტით, არა ზოგადი აღწერით</li>
                        <li>• ახსენე ვინ, სად, როდის</li>
                        <li>• რა გრძნობა გადმოგვცე უნდა? (ბედნიერი, მელანქოლიური, მხიარული)</li>
                    </ul>
                </div>

                {ready && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
                        <p className="text-sm font-medium text-green-800">ისტორია მზადაა!</p>
                        <p className="text-xs text-green-700 leading-relaxed">{story}</p>
                        <button
                            onClick={proceed}
                            disabled={advancing}
                            className="elegant-btn w-full text-sm py-2 inline-flex items-center justify-center gap-2"
                        >
                            შემდეგი: პერსონაჟები <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {!ready && messages.length >= 4 && (
                    <button
                        onClick={proceed}
                        disabled={advancing}
                        className="elegant-btn-outline w-full text-sm py-2 inline-flex items-center justify-center gap-2"
                    >
                        გადახტი პერსონაჟებზე <ArrowRight size={16} />
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    isUser
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white border border-rose-100 text-text-dark rounded-bl-sm"
                }`}
            >
                {children}
                {streaming && <span className="inline-block w-1.5 h-4 bg-current opacity-50 ml-0.5 animate-pulse" />}
            </div>
        </div>
    );
}
