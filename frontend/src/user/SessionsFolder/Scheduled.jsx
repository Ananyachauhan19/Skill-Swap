import { motion } from 'framer-motion';
const ScheduledSessions = ({ sessions = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {sessions.map(session => (
        <motion.div
          key={session.id}
          className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col justify-between w-full hover-scale"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="text-lg font-semibold text-blue-800">{session.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Course:</span> {session.course} |
              <span className="font-medium ml-2">Unit:</span> {session.unit} |
              <span className="font-medium ml-2">Topic:</span> {session.topic}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Tutor:</span> {session.tutor}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Date:</span> {session.date} |
              <span className="font-medium ml-2">Time:</span> {session.time}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Description:</span> {session.description}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Views:</span> {session.views} |
              <span className="font-medium ml-2">Likes:</span> {session.likes} |
              <span className="font-medium ml-2">Skillmate:</span> {session.skillmate}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{session.status}</span>
            <motion.button
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition w-full sm:w-auto text-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Session
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
export default ScheduledSessions;