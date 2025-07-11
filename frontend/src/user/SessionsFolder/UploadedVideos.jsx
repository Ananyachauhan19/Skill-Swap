import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Updated UploadedVideos component
const UploadedVideos = ({ videos = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {videos.map(video => (
        <motion.div
          key={video.id}
          className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col w-full hover-scale"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="text-lg font-semibold text-blue-800">{video.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Course:</span> {video.course} |
              <span className="font-medium ml-2">Unit:</span> {video.unit} |
              <span className="font-medium ml-2">Topic:</span> {video.topic}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Tutor:</span> {video.tutor}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Date:</span> {video.date}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Description:</span> {video.description}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Views:</span> {video.views} |
              <span className="font-medium ml-2">Likes:</span> {video.likes} |
              <span className="font-medium ml-2">Skillmate:</span> {video.skillmate}
            </div>
          </div>
          <div className="mt-4">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition w-full sm:w-auto text-center"
            >
              Watch Video
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
export default UploadedVideos;