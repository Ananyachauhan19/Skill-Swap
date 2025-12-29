import React, { useEffect, useMemo, useState } from 'react';

const HeroDashboard = ({ hero }) => {
  const bg = hero?.campusBackgroundImage;
  const instituteText = useMemo(() => hero?.instituteName || '', [hero?.instituteName]);
  const studentText = useMemo(() => hero?.studentName || '', [hero?.studentName]);

  const [typedInstitute, setTypedInstitute] = useState('');
  const [typedStudent, setTypedStudent] = useState('');

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms) =>
      new Promise((resolve) => {
        const t = setTimeout(resolve, ms);
        if (cancelled) clearTimeout(t);
      });

    const run = async () => {
      setTypedInstitute('');
      setTypedStudent('');

      await sleep(200);

      if (instituteText) {
        for (let i = 1; i <= instituteText.length; i += 1) {
          if (cancelled) return;
          setTypedInstitute(instituteText.slice(0, i));
          await sleep(28);
        }
      }

      await sleep(instituteText ? 200 : 0);

      if (studentText) {
        for (let i = 1; i <= studentText.length; i += 1) {
          if (cancelled) return;
          setTypedStudent(studentText.slice(0, i));
          await sleep(26);
        }
      }

      await sleep(5000);
      if (!cancelled) run();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [instituteText, studentText]);

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="relative h-[240px] sm:h-[280px] md:h-[320px] w-full"
          style={
            bg
              ? {
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center 18%',
                }
              : undefined
          }
        >
          {!bg && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-blue-700/10 to-white" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/45" />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-white/10" />

          <div className="relative h-full flex items-end">
            <div className="w-full px-3 sm:px-4 md:px-6 pb-4 sm:pb-5">
              <div className="max-w-3xl rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-sm px-4 sm:px-5 py-3.5">
                <p className="text-xs tracking-wide text-white/80">Campus Home</p>

                <div className="mt-1 overflow-hidden">
                  <div
                    className="inline-flex flex-col gap-0.5 whitespace-nowrap"
                  >
                    <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                      {typedInstitute}
                    </h1>
                    <p className="text-sm text-white/85">
                      {typedStudent}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroDashboard;
