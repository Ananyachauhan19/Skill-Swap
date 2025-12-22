import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from "date-fns";
import { BACKEND_URL } from "../../config.js";
import { useAuth } from "../../context/AuthContext.jsx";

const VideoCard = ({
  video,
  onEdit,
  onArchive,
  onRemove,
  onReport,
  onShare,
  onDelete,
  onUnArchive,
  onSave,
  onPost,
  menuOptions = [],
  openMenu,
  setOpenMenu,
  menuRef,
  onSaveToPlaylist,
  userId, 
}) => {
  const {
    id,
    thumbnail,
    title,
    description,
    uploadDate,
    userId: videoUserId,
    skillmates,
    views: initialViews = 0,
    likes,
    dislikes,
    likeCount: initialLikeCount,
    dislikeCount: initialDislikeCount,
    isLive,
    scheduledTime,
    videoUrl,
  } = video;

  const videoRef = useRef(null);
  const { user, isAuthenticated } = useAuth() || {};

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(null);
  const [viewCount, setViewCount] = useState(initialViews || 0);
  const [hasRecordedView, setHasRecordedView] = useState(false);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    typeof initialLikeCount === "number"
      ? initialLikeCount
      : Array.isArray(likes)
        ? likes.length
        : typeof likes === "number"
          ? likes
          : 0
  );
  const [dislikeCount, setDislikeCount] = useState(
    typeof initialDislikeCount === "number"
      ? initialDislikeCount
      : Array.isArray(dislikes)
        ? dislikes.length
        : typeof dislikes === "number"
          ? dislikes
          : 0
  );

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

  // Reset counts when the underlying video changes
  useEffect(() => {
    setViewCount(initialViews || 0);
    setLikeCount(
      typeof initialLikeCount === "number"
        ? initialLikeCount
        : Array.isArray(likes)
          ? likes.length
          : typeof likes === "number"
            ? likes
            : 0
    );
    setDislikeCount(
      typeof initialDislikeCount === "number"
        ? initialDislikeCount
        : Array.isArray(dislikes)
          ? dislikes.length
          : typeof dislikes === "number"
            ? dislikes
            : 0
    );
    setHasRecordedView(false);
  }, [id, initialViews, initialLikeCount, initialDislikeCount, likes, dislikes]);

  // Initialize like/dislike flags based on current user
  useEffect(() => {
    if (!user) {
      setUserLiked(false);
      setUserDisliked(false);
      return;
    }

    if (Array.isArray(likes)) {
      setUserLiked(likes.some((uid) => uid === user._id));
    }
    if (Array.isArray(dislikes)) {
      setUserDisliked(dislikes.some((uid) => uid === user._id));
    }
  }, [user, likes, dislikes]);

  const formatDuration = (d) => {
    if (!d && d !== 0) return "";
    const min = Math.floor(d / 60);
    const sec = Math.floor(d % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const ensureAuthenticated = () => {
    if (!isAuthenticated) {
      alert("Please log in to interact with videos.");
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!ensureAuthenticated()) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}/like`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to toggle like");
      }

      setLikeCount(data.likes ?? 0);
      setDislikeCount(data.dislikes ?? 0);
      setUserLiked(!!data.userHasLiked);
      setUserDisliked(!!data.userHasDisliked);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDislike = async () => {
    if (!ensureAuthenticated()) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${id}/dislike`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to toggle dislike");
      }

      setLikeCount(data.likes ?? 0);
      setDislikeCount(data.dislikes ?? 0);
      setUserLiked(!!data.userHasLiked);
      setUserDisliked(!!data.userHasDisliked);
    } catch (error) {
      console.error("Error toggling dislike:", error);
    }
  };

  const handleTimeUpdate = async () => {
    if (!videoRef.current || !duration || hasRecordedView) return;

    const currentTime = videoRef.current.currentTime || 0;
    const progress = duration > 0 ? currentTime / duration : 0;

    if (progress >= 2 / 3 && !hasRecordedView) {
      setHasRecordedView(true);

      if (!isAuthenticated) {
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/videos/${id}/view`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to record view");
        }

        if (typeof data.views === "number") {
          setViewCount(data.views);
        }
      } catch (error) {
        console.error("Error recording view:", error);
      }
    }
  };

  const handleShare = (video) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/watch/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard: " + shareUrl);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full border border-gray-100">
      {/* Video/Thumbnail */}
      <div className="relative w-full sm:w-[360px] aspect-video shrink-0 rounded-xl overflow-hidden bg-gray-900">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnail}
              className="w-full h-full object-cover"
              controls
              onPlay={() => {
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
            />
            {!isPlaying && (
              <div
                className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                onClick={() => videoRef.current?.play()}
              >
                <button
                  className="bg-white hover:bg-gray-100 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    videoRef.current?.play();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
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
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
            {formatDuration(duration)}
          </span>
        )}
        {isLive && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </span>
        )}
        {scheduledTime && !isLive && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {scheduledTime}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col justify-between w-full">
        <div className="flex justify-between items-start gap-3">
          <div className="flex flex-col gap-2 flex-1">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                @{videoUserId}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{(viewCount || 0).toLocaleString()}</span> views
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {(() => {
                  let dateObj;
                  try {
                    dateObj = new Date(uploadDate.replace("Saved: ", ""));
                    if (!uploadDate || isNaN(dateObj.getTime()))
                      throw new Error("Invalid date");
                    return formatDistanceToNow(dateObj, { addSuffix: true });
                  } catch {
                    return "some time ago";
                  }
                })()}
              </span>
              {video.lastEdited && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    {video.lastEdited}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
              onClick={() => setOpenMenu((prev) => !prev)}
              aria-label="More options"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="text-gray-600 group-hover:text-gray-900"
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {openMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1"
              >
                {menuOptions.includes("edit") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onEdit?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </button>
                )}
                {menuOptions.includes("delete") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onDelete?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                )}
                {menuOptions.includes("report") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onReport?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                    </svg>
                    Report
                  </button>
                )}
                {menuOptions.includes("archive") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onArchive?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Archive
                  </button>
                )}
                {menuOptions.includes("save") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onSave?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Save
                  </button>
                )}
                {menuOptions.includes("unarchive") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onUnArchive?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Unarchive
                  </button>
                )}
                {menuOptions.includes("post") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onPost?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Post
                  </button>
                )}
                {menuOptions.includes("remove") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onRemove?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                )}
                {menuOptions.includes("share") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onShare?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Share
                  </button>
                )}
                {menuOptions.includes("saveToPlaylist") && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setOpenMenu(false);
                      onSaveToPlaylist?.(video);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Save to Playlist
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Engagement Section */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              userLiked 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={userLiked ? "currentColor" : "none"}
              stroke="currentColor" 
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{likeCount.toLocaleString()}</span>
          </button>
          <button
            onClick={handleDislike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              userDisliked 
                ? "bg-red-600 text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={userDisliked ? "currentColor" : "none"}
              stroke="currentColor" 
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            <span>{dislikeCount.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;