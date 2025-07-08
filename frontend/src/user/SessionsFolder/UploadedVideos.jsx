import React from 'react';

// TODO: Replace with backend API call to fetch uploaded videos
// Example: fetch('/api/uploaded-videos').then(...)
const UploadedVideos = ({ videos = [] }) => {
  return (
    <section className="mb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">Uploaded Videos</h2>
      {videos.length === 0 ? (
        <div className="text-gray-500">No uploaded videos found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {videos.map(video => (
            <div key={video.id} className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col w-full">
              <div>
                <div className="text-lg font-semibold text-blue-800">{video.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Course:</span> {video.course} &nbsp;|
                  <span className="font-medium ml-2">Unit:</span> {video.unit} &nbsp;|
                  <span className="font-medium ml-2">Topic:</span> {video.topic}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Tutor:</span> {video.tutor}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Date:</span> {video.date}
                </div>
              </div>
              <div className="mt-4">
                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition w-full sm:w-auto text-center">Watch Video</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UploadedVideos;
