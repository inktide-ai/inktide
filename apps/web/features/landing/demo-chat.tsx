'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { REGISTER_ROUTE } from '@/lib/routes';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGE_LIMIT = 5;
const TYPING_SPEED_MS = 18;
const AKANE_AVATAR = '/avatars/home-showcase-akane.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function TypewriterText({ text, onDone }: { text: string; onDone: () => void }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= text.length) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setVisible((v) => v + 1), TYPING_SPEED_MS);
    return () => clearTimeout(timer);
  }, [visible, text.length, onDone]);

  return <>{text.slice(0, visible)}</>;
}

export default function DemoChatWidget() {
  const { t } = useTranslation('landing');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('demoChat.welcome'),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gateShown, setGateShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userCount = messages.filter((m) => m.role === 'user').length;
  const remaining = Math.max(0, MESSAGE_LIMIT - userCount);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || gateShown) return;
    setInput('');
    setError(null);
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.id !== 'welcome' && m.id !== 'error')
        .map((m) => ({ role: m.role === 'user' ? 1 : 2, content: m.content }));
      const res = await fetch('/api/v1/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, history }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? body.detail ?? t('demoChat.errorResponse'));
      }
      const data = await res.json();
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('demoChat.errorGeneric'));
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('demoChat.errorMessage'),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, gateShown, messages, t]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const showGate = () => setGateShown(true);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[rgba(15,15,20,0.92)] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl transition-all duration-200 hover:border-white/[0.15] hover:bg-[rgba(20,20,28,0.94)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[image:var(--brand-gradient-hero)]">
              <img src={AKANE_AVATAR} alt="Akane" className="h-full w-full object-cover" />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[#0f0f14] bg-emerald-400" />
            </div>
            <span className="text-white/90">{t('demoChat.chatWith')}</span>
            {remaining <= 2 && remaining > 0 && (
              <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-2xs font-bold text-rose-400">
                {t('demoChat.left', { count: remaining })}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-6 right-6 z-50 flex h-[580px] w-[390px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(10,10,16,0.94)] shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[image:var(--brand-gradient-hero)]">
                  <img src={AKANE_AVATAR} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[#0a0a10] bg-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight text-white/90">Akane</p>
                  <p className="text-xs leading-tight text-emerald-400/80">{t('demoChat.status')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {remaining > 0 && (
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-2xs font-medium text-white/35">
                    {t('demoChat.free', { remaining, limit: MESSAGE_LIMIT })}
                  </span>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
                  aria-label={t('demoChat.close')}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
            >
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}>
                    {msg.role === 'assistant' && msg.id !== 'error' && (
                      <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[image:var(--brand-gradient-hero)]">
                        <img src={AKANE_AVATAR} alt="" className="h-full w-full object-cover opacity-90" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-body leading-[1.55] ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-[rgba(157,122,245,0.18)] text-[rgba(220,210,255,0.88)]'
                          : 'rounded-bl-md bg-white/[0.05] text-[rgba(200,200,215,0.85)]'
                      }`}
                    >
                      {msg.isStreaming ? (
                        <TypewriterText
                          text={msg.content}
                          onDone={() => {
                            setMessages((prev) =>
                              prev.map((m) => (m.id === msg.id ? { ...m, isStreaming: false } : m)),
                            );
                            if (userCount >= MESSAGE_LIMIT - 1) showGate();
                          }}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-end gap-2">
                    <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[image:var(--brand-gradient-hero)]">
                      <img src={AKANE_AVATAR} alt="" className="h-full w-full object-cover opacity-90" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white/[0.05] px-3.5 py-3">
                      {[0, 200, 400].map((delay) => (
                        <span
                          key={delay}
                          className="inline-block h-[5px] w-[5px] rounded-full bg-white/25 animate-bounce"
                          style={{ animationDelay: `${delay}ms`, animationDuration: '1.1s' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-400/80">{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/[0.06] p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[rgba(15,15,20,0.8)] px-3">
                <input
                  ref={inputRef}
                  className="flex-1 bg-transparent py-2.5 text-body text-white/85 outline-none placeholder:text-white/20"
                  placeholder={gateShown ? t('demoChat.signUpToContinue') : t('demoChat.typeMessage')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={loading || gateShown}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={500}
                />
                <button
                  onClick={() => void submit()}
                  disabled={loading || gateShown || !input.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-white/50 transition-all hover:bg-white/[0.14] hover:text-white/80 disabled:opacity-20"
                  aria-label={t('demoChat.send')}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Gate overlay */}
            <AnimatePresence>
              {gateShown && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-2xl bg-[rgba(10,10,16,0.92)] px-8 text-center backdrop-blur-md"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-white/[0.06]" style={{ background: 'linear-gradient(to bottom right, rgba(244,63,94,0.2), rgba(139,92,246,0.2))' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#gateGrad)" strokeWidth="1.5" strokeLinecap="round">
                      <defs>
                        <linearGradient id="gateGrad" x1="0" y1="0" x2="24" y2="24">
                          <stop stopColor="#f43f5e" />
                          <stop offset="1" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <path d="M12 2l3.5 7h7l-5.5 4 2 6.5L12 16l-7 3.5 2-6.5L1.5 9h7L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white/90">{t('demoChat.gateTitle')}</p>
                    <p className="mt-1.5 text-body leading-relaxed text-white/40">
                      {t('demoChat.gateDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(REGISTER_ROUTE)}
                    className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:opacity-90 hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]"
                    style={{ background: 'var(--brand-gradient-hero)' }}
                  >
                    {t('demoChat.signUpFree')}
                  </button>
                  <p className="text-xs text-white/20">{t('demoChat.noCreditCard')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
