'use client';
import dynamic from 'next/dynamic';

// Load ChatBot client-side only — no SSR (uses browser APIs & floating position)
const ChatBot = dynamic(() => import('./ChatBot'), { ssr: false });

export default function ChatBotWrapper() {
  return <ChatBot />;
}
