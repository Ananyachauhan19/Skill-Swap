import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
const VideoCard = ({
  video,
  onEdit,
  onArchive,
  onRemove,
  onReport,
  onShare,
  onDelete,
  onSave,
  onPost,
  menuOptions = [],
  openMenu,
  setOpenMenu,
  menuRef,
  onSaveToPlaylist,
}) => {
  const {
    thumbnail,
    title,
    description,
    uploadDate,
    userId,
    skillmates,
    views,
    likes = 0,
    dislikes = 0,
    isLive,
    scheduledTime,
    videoUrl,
  } = video;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(null);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(dislikes);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const handleLoadedMetadata = () => {
        setDuration(videoRef.current.duration);
      };
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      };
    }
  }, [videoUrl]);

  const formatDuration = (d) => {
    if (!d && d !== 0) return "";
    const min = Math.floor(d / 60);
    const sec = Math.floor(d % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const toggleLike = () => {
    if (userLiked) {
      setLikeCount(likeCount - 1);
      setUserLiked(false);
    } else {
      setLikeCount(likeCount + 1);
      if (userDisliked) {
        setDislikeCount(dislikeCount - 1);
        setUserDisliked(false);
      }
      setUserLiked(true);
    }
  };

  const toggleDislike = () => {
    if (userDisliked) {
      setDislikeCount(dislikeCount - 1);
      setUserDisliked(false);
    } else {
      setDislikeCount(dislikeCount + 1);
      if (userLiked) {
        setLikeCount(likeCount - 1);
        setUserLiked(false);
      }
      setUserDisliked(true);
    }
  };

  const handleShare = (video) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/watch/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard: " + shareUrl);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 border-b pb-6 pt-4 w-full">
      {/* Video/Thumbnail */}
      <div className="relative w-full sm:w-[360px] aspect-video shrink-0 rounded-lg overflow-hidden bg-gray-200">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnail}
              className="w-full h-full object-cover"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            {!isPlaying && (
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                onClick={() => videoRef.current?.play()}
              >
                <button
                  className="bg-white/90 hover:bg-white p-3 rounded-full shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    videoRef.current?.play();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <img
            src={thumbnail}
            alt="Thumbnail"
            className="w-full h-full object-cover"
          />
        )}
        {duration !== null && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(duration)}
          </span>
        )}
        {isLive && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            🔴 Live
          </span>
        )}
        {scheduledTime && !isLive && (
          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
            ⏰ {scheduledTime}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col justify-between w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-gray-700 font-medium">@{userId}</p>
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
            <div className="text-xs text-gray-500 mt-1">
              <span>
                {views} views •{" "}
                {(() => {
                  let dateObj;
                  try {
                    dateObj = new Date(uploadDate.replace("Saved: ", "")); // Remove "Saved: " prefix
                    if (!uploadDate || isNaN(dateObj.getTime()))
                      throw new Error("Invalid date");
                    return formatDistanceToNow(dateObj, { addSuffix: true });
                  } catch {
                    return "some time ago";
                  }
                })()}
              </span>
              {video.lastEdited && (
                <span className="ml-2">{video.lastEdited}</span>
              )}{" "}
              {/* Add lastEdited */}
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={() => setOpenMenu((prev) => !prev)}
            >
              <svg
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {openMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50"
              >
                {menuOptions.includes("edit") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onEdit?.(video);
                    }}
                  >
                    Edit
                  </button>
                )}
                {menuOptions.includes("delete") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onDelete?.(video);
                    }}
                  >
                    Delete
                  </button>
                )}
                {menuOptions.includes("report") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onReport?.(video);
                    }}
                  >
                    Report
                  </button>
                )}
                {menuOptions.includes("archive") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onArchive?.(video);
                    }}
                  >
                    Archive
                  </button>
                )}
                {menuOptions.includes("save") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onSave?.(video);
                    }}
                  >
                    Save
                  </button>
                )}
                {menuOptions.includes("unarchive") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onArchive?.(video);
                    }}
                  >
                    Unarchive
                  </button>
                )}
                {menuOptions.includes("post") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onPost?.(video);
                    }}
                  >
                    Post
                  </button>
                )}
                {menuOptions.includes("remove") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onRemove?.(video);
                    }}
                  >
                    Remove
                  </button>
                )}
                {menuOptions.includes("share") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onShare?.(video);
                    }}
                  >
                    Share
                  </button>
                )}
                {menuOptions.includes("saveToPlaylist") && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      onSaveToPlaylist?.(video);
                    }}
                  >
                    Save to Playlist
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Likes/Dislikes */}
        <div className="flex gap-4 mt-3 text-sm text-gray-700 items-center">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 ${
              userLiked ? "text-blue-600 font-semibold" : "hover:text-blue-600"
            }`}
          >
            👍 {likeCount}
          </button>
          <button
            onClick={toggleDislike}
            className={`flex items-center gap-1 ${
              userDisliked ? "text-red-600 font-semibold" : "hover:text-red-600"
            }`}
          >
            👎 {dislikeCount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
