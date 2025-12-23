import React, { useRef, useState, useEffect } from "react";
import { FaGithub, FaLinkedin, FaLink } from "react-icons/fa";

const getIcon = (type) => {
  if (type === "github") return <FaGithub className="inline mr-1" />;
  if (type === "linkedin") return <FaLinkedin className="inline mr-1" />;
  return <FaLink className="inline mr-1" />;
};

const BioLink = ({ bio = "", links = [] }) => {
  const [showBioPopup, setShowBioPopup] = useState(false);
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const bioPopupRef = useRef();
  const linksPopupRef = useRef();

  // Close popups on outside click
  useEffect(() => {
    function handleClick(e) {
      if (showBioPopup && bioPopupRef.current && !bioPopupRef.current.contains(e.target)) {
        setShowBioPopup(false);
      }
      if (showLinksPopup && linksPopupRef.current && !linksPopupRef.current.contains(e.target)) {
        setShowLinksPopup(false);
      }
    }
    if (showBioPopup || showLinksPopup) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showBioPopup, showLinksPopup]);

  const bioWords = bio.trim().split(/\s+/);
  const shortBio = bioWords.slice(0, 17).join(" ") + (bioWords.length > 8 ? "..." : "");
  const showReadMore = bioWords.length > 17;
  const visibleLinks = links.slice(0, 2);
  const showViewAll = links.length > 2;

  return (
    <div className="relative w-full max-w-md min-h-[120px] sm:min-h-[140px] bg-white rounded-lg shadow p-3 sm:p-4 border border-blue-100">
      {/* Bio section */}
      <div className="mb-6 sm:mb-8 text-gray-800 text-xs sm:text-sm leading-relaxed">
        {shortBio}
        {showReadMore && (
          <button
            className="ml-2 text-blue-600 underline text-xs hover:text-blue-800 font-medium"
            onClick={() => setShowBioPopup(true)}
          >
            Read more
          </button>
        )}
      </div>
      {/* Links section */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center mb-1">
        {visibleLinks.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-2 py-1 bg-blue-50 rounded text-blue-700 text-xs hover:bg-blue-100 border border-blue-100"
          >
            {getIcon(l.type)}{l.type.charAt(0).toUpperCase() + l.type.slice(1)}
          </a>
        ))}
        {showViewAll && (
          <button
            className="text-blue-600 underline text-xs ml-2"
            onClick={() => setShowLinksPopup(true)}
          >
            View all
          </button>
        )}
      </div>
      {/* Bio Popup */}
      {showBioPopup && (
        <div
          ref={bioPopupRef}
          className="fixed sm:absolute left-4 right-4 sm:left-1/2 top-20 sm:top-10 sm:-translate-x-1/2 z-50 bg-white border border-blue-200 shadow-xl rounded-lg p-4 sm:w-96 text-gray-800 text-sm max-h-[70vh] overflow-y-auto"
        >
          <div className="mb-2 leading-relaxed">{bio}</div>
        </div>
      )}
      {/* Links Popup */}
      {showLinksPopup && (
        <div
          ref={linksPopupRef}
          className="fixed sm:absolute left-4 right-4 sm:left-1/2 top-24 sm:top-20 sm:-translate-x-1/2 z-50 bg-white border border-blue-200 shadow-xl rounded-lg p-4 sm:w-96 max-h-[60vh] overflow-y-auto"
        >
          <div className="mb-2 font-semibold text-gray-700">All Links</div>
          <div className="flex flex-col gap-2">
            {links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-2 py-1 bg-blue-50 rounded text-blue-700 text-xs hover:bg-blue-100 border border-blue-100"
              >
                {getIcon(l.type)}{l.type.charAt(0).toUpperCase() + l.type.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BioLink;
