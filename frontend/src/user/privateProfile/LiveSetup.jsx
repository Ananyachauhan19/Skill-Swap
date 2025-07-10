import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LiveSetup = ({ onSubmit, editData, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [step, setStep] = useState(1);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const navigate = useNavigate();

  // Restore previous data if editing
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDescription(editData.description || "");
      setThumbnailPreview(editData.thumbnail || null);
      setThumbnail(null);
      if (editData.scheduledTime) {
        setScheduled(true);
        setStep(1);
        const dateTime = new Date(editData.scheduledTime);
        setScheduleDate(dateTime.toISOString().split("T")[0]);
        setScheduleTime(dateTime.toTimeString().slice(0, 5));
      } else {
        setScheduled(false);
        setStep(1);
      }
    } else {
      setTitle("");
      setDescription("");
      setThumbnail(null);
      setThumbnailPreview(null);
      setScheduled(false);
      setScheduleDate("");
      setScheduleTime("");
      setStep(1);
    }
  }, [editData]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSchedule = () => {
    setScheduled(true);
    setStep(3);
  };

  const handleGoLive = () => {
    onSubmit({
      title,
      description,
      thumbnail: thumbnailPreview,
      isLive: true,
      scheduledTime: null,
      uploadDate: new Date().toLocaleString(),
      views: 0,
      likes: 0,
      dislikes: 0,
      userId: "user123",
      skillmates: 0,
      isRecorded: false,
    });
    // Removed navigation to prevent re-render issues
  };

  const handleScheduleSubmit = () => {
    if (!scheduleDate || !scheduleTime) return;
    onSubmit({
      title,
      description,
      thumbnail: thumbnailPreview,
      isLive: false,
      scheduledTime: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
      uploadDate: new Date().toLocaleString(),
      views: 0,
      likes: 0,
      dislikes: 0,
      userId: "user123",
      skillmates: 0,
      isRecorded: false,
    });
    // Removed navigation to prevent re-render issues
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6 mt-8">
      {step === 1 && (
        <>
          <h2 className="text-xl font-bold mb-4">{editData ? "Edit Live Session" : "Setup Live Session"}</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter session title"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your session"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Thumbnail</label>
            <input type="file" accept="image/*" onChange={handleThumbnailChange} />
            {thumbnailPreview && <img src={thumbnailPreview} alt="Preview" className="w-32 h-20 mt-2 object-cover rounded" />}
          </div>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
              onClick={handleNext}
              disabled={!title || !description || !thumbnailPreview}
            >
              Next
            </button>
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded mt-2"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h2 className="text-xl font-bold mb-4">Ready to Go Live?</h2>
          <div className="flex gap-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleGoLive}
            >
              Go Live Now
            </button>
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded"
              onClick={handleSchedule}
            >
              Schedule Live
            </button>
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <h2 className="text-xl font-bold mb-4">Schedule Live Session</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="time"
              className="w-full border rounded px-3 py-2"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mt-2 disabled:opacity-50"
              onClick={handleScheduleSubmit}
              disabled={!scheduleDate || !scheduleTime}
            >
              Schedule
            </button>
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded mt-2"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveSetup;