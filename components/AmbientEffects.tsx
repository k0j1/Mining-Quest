
import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';

// --- HOME: Campfire & Sparks ---
export const CampEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // 1. Warm Glow Pulse
      gsap.to('.camp-glow', {
        opacity: 0.6,
        scale: 1.1,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      // 2. Rising Sparks/Smoke
      const createSpark = () => {
        if (!containerRef.current) return;
        const spark = document.createElement('div');
        spark.className = 'absolute bottom-0 w-1 h-1 bg-amber-400 rounded-full blur-[1px] opacity-0 pointer-events-none';
        // Random position at bottom
        spark.style.left = `${20 + Math.random() * 60}%`; 
        containerRef.current.appendChild(spark);

        gsap.fromTo(spark, 
          { y: 0, opacity: 1, scale: Math.random() * 1.5 },
          { 
            y: -150 - Math.random() * 100, 
            x: (Math.random() - 0.5) * 50,
            opacity: 0, 
            duration: 2 + Math.random() * 3,
            ease: "power1.out",
            onComplete: () => spark.remove()
          }
        );
      };

      // Create sparks periodically
      const interval = setInterval(createSpark, 400);
      return () => clearInterval(interval);

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Warm bottom gradient */}
      <div className="camp-glow absolute bottom-[-10%] left-[-10%] right-[-10%] h-[40%] bg-gradient-to-t from-orange-900/60 via-amber-900/20 to-transparent blur-3xl opacity-30"></div>
    </div>
  );
};

// --- PARTY: Lively Particles & Notes ---
export const PartyEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      
      const createNote = () => {
        if (!containerRef.current) return;
        const el = document.createElement('div');
        const isNote = Math.random() > 0.5;
        el.innerText = isNote ? '♪' : '✨';
        el.className = `absolute text-white/20 font-bold pointer-events-none select-none ${isNote ? 'text-xl' : 'text-xs'}`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.bottom = '0%';
        
        containerRef.current.appendChild(el);

        gsap.fromTo(el, 
          { y: 0, opacity: 0, rotation: 0 },
          { 
            y: -300 - Math.random() * 200, 
            x: (Math.random() - 0.5) * 100,
            rotation: (Math.random() - 0.5) * 90,
            opacity: 0.6,
            duration: 4 + Math.random() * 4,
            ease: "sine.out",
            yoyo: true, // fade out at end handled by tween timeline usually, but simple here
            onStart: () => gsap.to(el, { opacity: 0, duration: 1, delay: 3 }),
            onComplete: () => el.remove()
          }
        );
      };

      const interval = setInterval(createNote, 800);
      return () => clearInterval(interval);

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
       <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay"></div>
    </div>
  );
};

// --- QUEST: Mining Dust & Atmosphere ---
export const MiningEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      
      // Falling Dust
      const createDust = () => {
        if (!containerRef.current) return;
        const dust = document.createElement('div');
        dust.className = 'absolute w-0.5 h-0.5 bg-slate-400/30 rounded-full pointer-events-none';
        dust.style.top = '-10px';
        dust.style.left = `${Math.random() * 100}%`;
        
        containerRef.current.appendChild(dust);

        gsap.to(dust, {
          y: window.innerHeight + 20,
          opacity: 0,
          duration: 3 + Math.random() * 5,
          ease: "none",
          onComplete: () => dust.remove()
        });
      };

      const interval = setInterval(createDust, 300);

      // Occasional "Quake" or heavy impact suggestion
      const quakeInterval = setInterval(() => {
         gsap.fromTo(containerRef.current, 
            { y: 0 },
            { y: 1, duration: 0.1, yoyo: true, repeat: 3, ease: "power1.inOut" }
         );
      }, 8000);

      return () => {
          clearInterval(interval);
          clearInterval(quakeInterval);
      };

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Cave Darkness Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none"></div>
    </div>
  );
};
