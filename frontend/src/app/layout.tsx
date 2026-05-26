import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA.transcript — Global AI Speech-to-Text Suite",
  description: "Convert spoken audio into written text in real-time. Features real-time neon spectrograms, persistent voice archives, and an elite suite of integrated AI assistant insights including summarization, translation, task checklist extraction, and tone adjustments.",
  keywords: ["speech-to-text", "voice transcriber", "AI translation", "audio spectrogram", "meeting transcript", "accessibility", "Flask STT", "Next.js AI"],
  authors: [{ name: "AURA Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#030206] text-[#f3f1f7]">
        {children}
      </body>
    </html>
  );
}
