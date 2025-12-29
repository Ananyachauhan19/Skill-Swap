import React, { useEffect, useMemo, useState } from 'react';

const SkillThought = ({ thoughts }) => {
  const items = useMemo(() => {
    if (!Array.isArray(thoughts)) return [];
    return thoughts
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return { text: item };
        if (typeof item === 'object') {
          return {
            text: typeof item.text === 'string' ? item.text : typeof item.thought === 'string' ? item.thought : '',
            category: typeof item.category === 'string' ? item.category : undefined,
            source: typeof item.source === 'string' ? item.source : undefined,
          };
        }
        return null;
      })
      .filter((item) => item && item.text);
  }, [thoughts]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    if (items.length <= 1) return;

    const tick = setInterval(() => {
      setPhase('exit');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setPhase('enter');
        setTimeout(() => setPhase('idle'), 20);
      }, 260);
    }, 5000);

    return () => clearInterval(tick);
  }, [items.length]);

  const current = items[index] || null;
  const thoughtText = current?.text || '';
  const metaLine = [current?.category, current?.source].filter(Boolean).join(' • ');

  const motionClass =
    phase === 'exit'
      ? 'opacity-0 -translate-y-2'
      : phase === 'enter'
        ? 'opacity-0 translate-y-2'
        : 'opacity-100 translate-y-0';

  return (
    <section className="w-full flex justify-center">
      <div
        className="w-full min-h-[92px] sm:min-h-[104px] rounded-2xl bg-gradient-to-r from-blue-50/70 via-white/70 to-blue-50/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer px-4 sm:px-5"
        role="group"
      >
        <div className="h-full py-4 sm:py-5 flex flex-col items-center justify-center text-center">
          <div className="w-full max-w-5xl">
            <p
              className={`text-base sm:text-lg font-semibold text-blue-950 leading-relaxed tracking-tight transition-all duration-300 ${motionClass}`}
            >
              {thoughtText}
            </p>

            {metaLine ? (
              <p className="mt-1.5 text-[11px] text-blue-900/60">{metaLine}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillThought;
