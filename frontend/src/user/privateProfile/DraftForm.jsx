import React, { useState, useEffect } from "react";

const DraftForm = ({ onSubmit, editData, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Initialize form with edit data
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDescription(editData.description || "");
      setThumbnailPreview(editData.thumbnail || null);
      setThumbnail(null);
      setVideoPreview(editData.videoUrl || null);
      setVideoFile(null);
    } else {
      setTitle("");
      setDescription("");
      setThumbnail(null);
      setThumbnailPreview(null);
      setVideoFile(null);
      setVideoPreview(null);
    }
  }, [editData]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const draftData = {
      title,
      description,
      thumbnail: thumbnailPreview,
      videoUrl: videoPreview || "",
      userId: editData?.userId || "user123",
      isDraft: true,
      draftId: editData?.draftId || Date.now().toString(),
    };
    onSubmit(draftData);
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">{editData ? "Edit Draft" : "Create Draft"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter draft title"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your draft"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Thumbnail</label>
          <input type="file" accept="image/*" onChange={handleThumbnailChange} />
          {thumbnailPreview && <img src={thumbnailPreview} alt="Preview" className="w-32 h-20 mt-2 object-cover rounded" />}
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Video (Optional)</label>
          <input type="file" accept="video/*" onChange={handleVideoChange} />
          {videoPreview && <video src={videoPreview} controls className="w-32 h-20 mt-2 object-cover rounded" />}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700"
            disabled={!title || !thumbnailPreview}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded mt-2 hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DraftForm;