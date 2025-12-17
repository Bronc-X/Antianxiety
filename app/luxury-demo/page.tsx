'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, Moon, Activity } from 'lucide-react';

export default function LuxuryDemoPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] relative overflow-hidden">
      {/* Grid Lines */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-between px-8 md:px-16 max-w-[1600px] mx-auto">
        <div className="bg-grid-lines w-full h-full absolute inset-0 mix-blend-multiply opacity-[0.4]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
        <div className="hidden md:block w-px h-full bg-[#1A1A1A] opacity-[0.03]" />
      </div>

      {/* Noise Texture */}
      <div className="bg-noise" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-8 md:px-16 py-20">
        {/* Header */}
        <header className="mb-20">
          <span className="block text-xs font-medium tracking-[0.25em] uppercase text-[#D4AF37] mb-6">
            Design System Demo
          </span>
          <h1 className="font-heading text-6xl md:text-8xl font-normal leading-[0.9] tracking-tight text-[#1A1A1A]">
            Luxury <span className="italic font-light text-[#D4AF37]">Editorial</span>
          </h1>
          <p className="mt-8 text-lg text-[#1A1A1A]/70 max-w-xl leading-relaxed">
            A design system inspired by high-end magazines. Sharp edges, metallic gold accents, and generous whitespace.
          </p>
        </header>

        {/* Color Palette */}
        <section className="mb-20 border-t border-[#1A1A1A]/10 pt-12">
          <h2 className="font-heading text-3xl mb-8">Color <span className="italic text-[#D4AF37]">Palette</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="aspect-square bg-[#F9F8F6] border border-[#1A1A1A]/10 flex flex-col justify-end p-4">
              <span className="text-xs font-mono">Warm Alabaster</span>
              <span className="text-[10px] text-[#1A1A1A]/50">#F9F8F6</span>
            </div>
            <div className="aspect-square bg-[#1A1A1A] flex flex-col justify-end p-4">
              <span className="text-xs font-mono text-white">Rich Charcoal</span>
              <span className="text-[10px] text-white/50">#1A1A1A</span>
            </div>
            <div className="aspect-square bg-[#D4AF37] flex flex-col justify-end p-4">
              <span className="text-xs font-mono text-white">Metallic Gold</span>
              <span className="text-[10px] text-white/50">#D4AF37</span>
            </div>
            <div className="aspect-square bg-[#EBE5DE] border border-[#1A1A1A]/10 flex flex-col justify-end p-4">
              <span className="text-xs font-mono">Pale Taupe</span>
              <span className="text-[10px] text-[#1A1A1A]/50">#EBE5DE</span>
            </div>
            <div className="aspect-square bg-[#6C6863] flex flex-col justify-end p-4">
              <span className="text-xs font-mono text-white">Warm Grey</span>
              <span className="text-[10px] text-white/50">#6C6863</span>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-20 border-t border-[#1A1A1A]/10 pt-12">
          <h2 className="font-heading text-3xl mb-8">Typography</h2>
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-2 block">Display / Playfair Display</span>
              <h1 className="font-heading text-6xl md:text-8xl">The Art of Calm</h1>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-2 block">Body / Inter</span>
              <p className="text-lg leading-relaxed max-w-2xl">
                Luxury is not about addition. It is about the removal of everything that is not essential. 
                In a world of infinite noise, we offer the ultimate luxury: a quiet mind.
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-20 border-t border-[#1A1A1A]/10 pt-12">
          <h2 className="font-heading text-3xl mb-8">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-luxury h-12 px-10">
              <span>Primary Action</span>
            </button>
            <button className="px-8 py-3 text-xs uppercase tracking-widest border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all duration-500">
              Secondary
            </button>
            <button className="px-8 py-3 text-xs uppercase tracking-widest border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all duration-500">
              Gold Accent
            </button>
          </div>
        </section>

        {/* Glass Panel */}
        <section className="mb-20 border-t border-[#1A1A1A]/10 pt-12">
          <h2 className="font-heading text-3xl mb-8">Glass <span className="italic text-[#D4AF37]">Panel</span></h2>
          <div className="glass-panel p-8 border-l-2 border-l-[#D4AF37]">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-[#EBE5DE] flex items-center justify-center">
                <Brain className="w-8 h-8 text-[#1A1A1A]" strokeWidth={1} />
              </div>
              <div>
                <h3 className="font-heading text-2xl mb-2">Daily Insight</h3>
                <p className="text-[#1A1A1A]/70 leading-relaxed">
                  Your HRV indicates optimal recovery. Consider maintaining your current sleep schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-20 border-t border-[#1A1A1A]/10 pt-12">
          <h2 className="font-heading text-3xl mb-8">Feature Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Sparkles, title: 'Symptom Assessment', subtitle: 'AI Diagnostic' },
              { icon: Brain, title: 'Bayesian Loop', subtitle: 'Cognitive Model' },
            ].map((card, i) => (
              <motion.div 
                key={i}
                className="group cursor-pointer"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="aspect-[2/1] relative overflow-hidden mb-6 bg-[#EBE5DE]">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-400 grayscale group-hover:grayscale-0 transition-all duration-[1500ms] group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <card.icon className="w-12 h-12 text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors duration-700" strokeWidth={1} />
                  </div>
                </div>
                <div className="px-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">{card.subtitle}</span>
                  <h4 className="text-xl font-heading group-hover:text-[#D4AF37] transition-colors duration-500">{card.title}</h4>
                  <div className="h-px w-8 bg-[#1A1A1A] mt-4 group-hover:w-16 group-hover:bg-[#D4AF37] transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1A1A1A]/10 pt-12 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#1A1A1A]/40">
            AntiAnxiety™ Design System · 2024
          </span>
        </footer>
      </div>
    </div>
  );
}
