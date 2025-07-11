import { motion } from 'framer-motion';
// Updated LiveStream component
const LiveStream = ({ liveStreams = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {liveStreams.map(stream => (
        <motion.div
          key={stream.id}
          className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col justify-between w-full hover-scale"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="text-lg font-semibold text-blue-800">{stream.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Course:</span> {stream.course} |
              <span className="font-medium ml-2">Unit:</span> {stream.unit} |
              <span className="font-medium ml-2">Topic:</span> {stream.topic}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Tutor:</span> {stream.tutor}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Date:</span> {stream.date} |
              <span className="font-medium ml-2">Time:</span> {stream.time}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Description:</span> {stream.description}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Views:</span> {stream.views} |
              <span className="font-medium ml-2">Likes:</span> {stream.likes} |
              <span className="font-medium ml-2">Skillmate:</span> {stream.skillmate}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{stream.status}</span>
            {stream.status === 'Live' && (
              <a
                href={stream.joinUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-green-500 text-white rounded-full font-semibold text-sm hover:bg-green-600 transition w-full sm:w-auto text-center"
              >
                Join
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LiveStream;
