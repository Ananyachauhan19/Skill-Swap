import React from 'react';

// TODO: Replace with backend API call to fetch live streams
// Example: fetch('/api/livestreams').then(...)
const LiveStream = ({ liveStreams = [] }) => {
  return (
    <section className="mb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">Live Streams</h2>
      {liveStreams.length === 0 ? (
        <div className="text-gray-500">No live streams found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {liveStreams.map(stream => (
            <div key={stream.id} className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col justify-between w-full">
              <div>
                <div className="text-lg font-semibold text-blue-800">{stream.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Course:</span> {stream.course} &nbsp;|
                  <span className="font-medium ml-2">Unit:</span> {stream.unit} &nbsp;|
                  <span className="font-medium ml-2">Topic:</span> {stream.topic}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Tutor:</span> {stream.tutor}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Date:</span> {stream.date} &nbsp;|
                  <span className="font-medium ml-2">Time:</span> {stream.time}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{stream.status}</span>
                {stream.status === 'Live' && (
                  <a href={stream.joinUrl || '#'} target="_blank" rel="noopener noreferrer" className="ml-4 px-4 py-2 bg-green-500 text-white rounded-full font-semibold text-sm hover:bg-green-600 transition w-full sm:w-auto text-center">Join</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default LiveStream;
