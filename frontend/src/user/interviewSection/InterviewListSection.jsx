import React, { useState } from 'react';

const InterviewRulesModal = ({ open, onClose }) => (
  open ? (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-blue-200 relative">
        <button className="absolute top-3 right-3 text-gray-500 text-xl hover:text-gray-700 transition-colors" onClick={onClose}>
          ×
        </button>
        <h3 className="text-xl font-bold text-blue-900 mb-3">Interview Rules & Guidelines</h3>
        <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
          <li>Be punctual and join on time.</li>
          <li>Dress appropriately for the interview.</li>
          <li>Keep your camera and mic ready.</li>
          <li>Be respectful and professional.</li>
          <li>Follow the expert's instructions.</li>
        </ul>
      </div>
    </div>
  ) : null
);

const MiniBioButton = ({ bio }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      <button className="ml-2 text-xs text-blue-600 underline hover:text-blue-700 transition-colors" onClick={() => setShow(true)}>
        Mini Bio
      </button>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-scaleIn">
          <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs w-full border border-blue-200 relative">
            <button className="absolute top-2 right-2 text-gray-500 text-xl hover:text-gray-700 transition-colors" onClick={() => setShow(false)}>
              ×
            </button>
            <div className="text-sm text-gray-700">{bio}</div>
          </div>
        </div>
      )}
    </>
  );
};

const getProfilePic = (profilePic, name) => {
  if (profilePic) return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DBEAFE&color=1E40AF&bold=true`;
};

const InterviewCard = ({ interview }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col w-full max-w-xs mx-auto sm:mx-0">
    <div className="flex items-center mb-3">
      <img
        src={getProfilePic(interview.expert.profilePic, interview.expert.name)}
        alt={interview.expert.name}
        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
      />
      <div className="ml-3">
        <div className="font-semibold text-gray-900">{interview.expert.name}</div>
        <div className="text-xs text-gray-600 mt-1">{interview.expert.miniBio}</div>
      </div>
    </div>
    <div className="text-gray-700 text-sm mb-2 flex items-center gap-1">
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {new Date(interview.date).toLocaleDateString()} • {interview.time.replace('-', ' - ')}
    </div>
    <div className="text-gray-700 text-sm mb-3">
      {interview.seats}/5 Students Available
    </div>
    <div className="flex flex-wrap gap-2 mb-4">
      {Array.isArray(interview?.tags) && interview.tags.map((tag, idx) => (
        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{tag}</span>
      ))}
    </div>
    <button
      className="px-4 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed w-full"
      disabled={interview.seats === 0 || interview.expired}
    >
      Book Slot
    </button>
    {interview.expired && (
      <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">Expired</span>
    )}
  </div>
);

const InterviewListSection = ({ interviews, loading, error, directionMsg }) => {
  return (
    <section className="w-full flex flex-col items-center py-12 bg-home-bg">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-7xl">
        {loading ? (
          <div className="text-blue-700 text-lg font-semibold py-12 text-center">Loading interviews...</div>
        ) : error ? (
          <div className="text-red-600 text-lg font-semibold py-12 text-center">{error}</div>
        ) : directionMsg ? (
          <div className="text-lg text-blue-800 text-center py-12">{directionMsg}</div>
        ) : (
          <div>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center w-full">
              {!Array.isArray(interviews) || interviews.length === 0 ? (
                <div className="col-span-full text-gray-500 text-center">No interviews found</div>
              ) : (
                interviews.map(interview => (
                  <InterviewCard key={interview?.id || Math.random()} interview={interview} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InterviewListSection;