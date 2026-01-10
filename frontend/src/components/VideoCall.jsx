import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import socket from '../socket.js';
import { 
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, 
  FaDesktop, FaPhone, FaComments, FaChalkboard, FaExpand, 
  FaCompress, FaCircle, FaVolumeUp, FaVolumeMute, FaImage,
  FaArrowLeft, FaSmile, FaTimes, FaUser, FaEraser, FaArrowRight, FaPlus,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';

/**
 * VideoCall - Redesigned Professional Version
 * - Both cameras OFF by default
 * - Small video tiles at top-right corner
 * - Expandable view with back button
 * - Question photo or whiteboard as main view
 * - 2-minute auto-off for cameras
 * - Professional icons and modern UI
 * - Fully responsive for mobile
 * - No camera switch on web
 */

const VideoCall = ({ sessionId, onEndCall, userRole, username, coinType }) => {
  console.info('[DEBUG] VideoCall: Init session:', sessionId, 'role:', userRole, 'coinType:', coinType);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const whiteboardContainerRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const annotationContextRef = useRef(null);
  const isRemoteScrolling = useRef(false);

  // Chat container ref
  const chatContainerRef = useRef(null);

  // Core media refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoContainerRef = useRef(null);
  const imageInputRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Call/session state
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [goldCoins, setGoldCoins] = useState(0);
  const [bronzeCoins, setBronzeCoins] = useState(0);
  const [initialCoins, setInitialCoins] = useState({ silver: 0, gold: 0, bronze: 0 }); // Store initial values
  const hasEndedRef = useRef(false);
  const sessionStartCoinsRef = useRef(null); // Track coins at session start for accurate backend calculation

  // AV controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // Both cameras OFF by default
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true); // Remote camera OFF by default
  const [isVideoEnabled, setIsVideoEnabled] = useState(false); // Track if video has been added to stream
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Controlled video feature - 2 minute auto-off
  const [videoTimeRemaining, setVideoTimeRemaining] = useState(0); // seconds remaining
  const [isVideoShuttingDown, setIsVideoShuttingDown] = useState(false);
  const videoTimerRef = useRef(null);
  const videoShutoffTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const networkQualityRef = useRef('good'); // 'good' | 'poor'
  
  // New layout states
  const [isVideoExpanded, setIsVideoExpanded] = useState(false); // Toggle between small tiles and expanded view
  
  // Draggable video tiles state
  const [videoTilesPosition, setVideoTilesPosition] = useState({ x: 0, y: 0 }); // Position offset from top-right
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoTilesRef = useRef(null);

  // Coin session state (requester-side only)
  const [sessionBalance, setSessionBalance] = useState(null); // { remaining, earned, lastTickMinutes }
  const [coinLowWarning, setCoinLowWarning] = useState(false);
  const coinBaselineSetRef = useRef(false);
  
  // Tutor earnings tracking (tutor-side only)
  const [tutorEarnings, setTutorEarnings] = useState(null); // { earned, lastTickMinutes }
  const tutorBaselineSetRef = useRef(false);

  const normalizedCoinType = useMemo(
    () => (coinType || '').toString().trim().toLowerCase(),
    [coinType]
  );

  const isStudentPayer = useMemo(
    () => (userRole === 'student' || userRole === 'learner') && (normalizedCoinType === 'silver' || normalizedCoinType === 'bronze'),
    [userRole, normalizedCoinType]
  );
  
  const isTutorEarner = useMemo(() => {
    const isEarner = (userRole === 'tutor' || userRole === 'teacher') && (normalizedCoinType === 'silver' || normalizedCoinType === 'bronze');
    console.log('[TUTOR EARNER CHECK]', { userRole, normalizedCoinType, isEarner });
    return isEarner;
  }, [userRole, normalizedCoinType]);

  const spendPerMinute = useMemo(() => {
    if (!isStudentPayer) return 0;
    return normalizedCoinType === 'bronze' ? 4 : 1;
  }, [isStudentPayer, normalizedCoinType]);

  const earnPerMinute = useMemo(() => {
    // Server uses 0.75x of spend; bronze 4 -> 3, silver 1 -> 0.75
    return normalizedCoinType === 'bronze' ? 3 : 0.75;
  }, [normalizedCoinType]);

  // Screen share / recording / background / fullscreen
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [virtualBackground, setVirtualBackground] = useState('none');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Layout and features
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'local-full' | 'remote-full'
  const [sharedImage, setSharedImage] = useState(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isAnnotationsEnabled, setIsAnnotationsEnabled] = useState(false);
  const [sessionQuestionImageFetched, setSessionQuestionImageFetched] = useState(false);
  const [isWhiteboardToolbarOpen, setIsWhiteboardToolbarOpen] = useState(true); // Toolbar visibility
  const [showChat, setShowChat] = useState(false);

  // Whiteboard state
  const [pages, setPages] = useState([{ number: 1, paths: [] }]);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentPathId, setCurrentPathId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTool, setDrawingTool] = useState('pen'); // 'pen' | 'highlighter' | 'eraser'
  const [drawingColor, setDrawingColor] = useState('#22c55e');
  const [brushSize, setBrushSize] = useState(3);

  // Chat/reactions
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [reactions, setReactions] = useState([]);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);

  // Audio outputs
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  // Constants for whiteboard
  const CANVAS_WIDTH = 2000;
  const CANVAS_HEIGHT = 1500;

  // Smooth scroll helper
  const smoothScrollIntoView = (el) => {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      el.scrollIntoView();
    }
  };

  // Current page memo
  const currentPage = useMemo(() => pages.find(p => p.number === currentPageNumber) || pages[0], [pages, currentPageNumber]);

  // Update paths helper
  const updatePaths = useCallback((updater) => {
    setPages(prev => prev.map(p => {
      if (p.number !== currentPageNumber) return p;
      const newPaths = updater(p.paths);
      return { ...p, paths: newPaths };
    }));
  }, [currentPageNumber]);

  // Distance to segment
  const pointToSegmentDistance = (p, a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const tClamped = Math.max(0, Math.min(1, t));
    const projX = a.x + tClamped * dx;
    const projY = a.y + tClamped * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  };

  // Get hit path
  const getHitPath = (x, y, paths) => {
    let minDist = Infinity;
    let hitId = null;
    for (let i = paths.length - 1; i >= 0; i--) {
      const path = paths[i];
      for (let j = 1; j < path.points.length; j++) {
        const dist = pointToSegmentDistance({ x, y }, path.points[j - 1], path.points[j]);
        if (dist < Math.max(path.size / 2, 5) + 5) {
          if (dist < minDist) {
            minDist = dist;
            hitId = path.id;
          }
        }
      }
    }
    return hitId;
  };

  // Redraw whiteboard
  const redraw = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    (currentPage?.paths || []).forEach(path => {
      if (path.points.length < 1) return;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.globalAlpha = path.tool === 'highlighter' ? 0.5 : 1;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let k = 1; k < path.points.length; k++) {
        ctx.lineTo(path.points[k].x, path.points[k].y);
      }
      ctx.stroke();
    });
  }, [currentPage]);

  // Fullscreen listeners
  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Fetch session question image on mount
  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId || sessionQuestionImageFetched) return;
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn('[SESSION-FETCH] No auth token found');
          // Set whiteboard as default if no image
          setShowWhiteboard(true);
          setSessionQuestionImageFetched(true);
          return;
        }

        const response = await fetch(`/api/session-requests/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const sessionData = await response.json();
          console.info('[SESSION-FETCH] Session details:', sessionData);
          
          // Check if question image exists
          if (sessionData.questionImageUrl && sessionData.questionImageUrl.trim()) {
            console.info('[SESSION-FETCH] Question image found:', sessionData.questionImageUrl);
            setSharedImage(sessionData.questionImageUrl);
            setShowWhiteboard(false); // Hide whiteboard when question image exists
          } else {
            console.info('[SESSION-FETCH] No question image, showing whiteboard as default');
            setShowWhiteboard(true); // Show whiteboard by default if no question image
          }
        } else {
          console.warn('[SESSION-FETCH] Failed to fetch session:', response.status);
          // Default to whiteboard on error
          setShowWhiteboard(true);
        }
      } catch (error) {
        console.error('[SESSION-FETCH] Error fetching session details:', error);
        // Default to whiteboard on error
        setShowWhiteboard(true);
      } finally {
        setSessionQuestionImageFetched(true);
      }
    };

    fetchSessionDetails();
  }, [sessionId, sessionQuestionImageFetched]);

  // Initial media + socket setup
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Request AUDIO ONLY - Video will be added on-demand (Filo-style)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false, // Start without video to save bandwidth
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (!mounted) return;

        setLocalStream(stream);
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Enumerate audio outputs
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioDevices(audioOutputs);

        // Respect previously selected sink if present
        const savedSinkId = localStorage.getItem('preferredSinkId');
        const defaultSink = savedSinkId && audioOutputs.find(d => d.deviceId === savedSinkId)
          ? savedSinkId
          : (audioOutputs[0]?.deviceId || '');

        setSelectedAudioDevice(defaultSink);

        // Wire critical listeners before joining to avoid race conditions
        const onSharedImage = (data) => {
          if (data && data.imageUrl) {
            setSharedImage(data.imageUrl);
            setShowWhiteboard(false); // Hide whiteboard when image is shared
          }
        };
        const onRemoveImage = () => {
          setSharedImage(null);
          setShowWhiteboard(true); // Show whiteboard when image is removed
        };
        socket.on('shared-image', onSharedImage);
        socket.on('remove-image', onRemoveImage);

        // Join room
        socket.emit('join-session', { sessionId, userRole, username });
        console.info('[DEBUG] Joined session room:', sessionId);
        // Immediately request a re-sync of shared image in case initial emit was missed
        socket.emit('request-shared-image', { sessionId });

        const onUserJoined = async () => {
          const pc = createPeerConnection();
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { sessionId, offer });
            // setIsInitiator(true);
          } catch (err) {
            console.error('[DEBUG] Error creating offer:', err);
          }
        };

        const onOffer = async (data) => {
          const pc = createPeerConnection();
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { sessionId, answer });
          } catch (err) {
            console.error('[DEBUG] Error in handleOffer:', err);
          }
        };

        const onAnswer = async (data) => {
          try {
            await peerConnectionRef.current?.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
          } catch (err) {
            console.error('[DEBUG] Error in handleAnswer:', err);
          }
        };

        const onIceCandidate = async (data) => {
          try {
            if (data?.candidate) {
              await peerConnectionRef.current?.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
            }
          } catch (err) {
            console.error('[DEBUG] Error adding ICE candidate:', err);
          }
        };

        const onUserLeft = () => {
          setRemoteStream(null);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          setCallStartTime(null);
          setElapsedSeconds(0);
          setSharedImage(null); // Clear shared image on user leave
        };

        const onChat = (data) => {
          setMessages(prev => [...prev, {
            sender: data.username || 'Partner',
            text: data.message,
            timestamp: new Date()
          }]);
        };

        const onReaction = (data) => {
          setReactions(prev => [...prev, {
            type: data.type,
            username: data.username,
            timestamp: Date.now()
          }]);
          setTimeout(() => {
            setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 5000));
          }, 5000);
        };

        const onHoldStatus = (data) => {
          if (data.username !== username) {
            const newStream = data.isOnHold ? null : localStreamRef.current;
            setRemoteStream(newStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = newStream;
            }
          }
        };

        const onCoinUpdate = ({ silverCoins, goldCoins, bronzeCoins }) => {
          // Store original values if this is the first update (for backend calculation accuracy)
          if (!sessionStartCoinsRef.current) {
            sessionStartCoinsRef.current = {
              silver: Number(silverCoins ?? 0),
              gold: Number(goldCoins ?? 0),
              bronze: Number(bronzeCoins ?? 0),
            };
          }

          // Only update coin display during initial setup (before call starts) or after call ends
          // During active call, frontend handles real-time updates to prevent double counting
          const isInitialSetup = !coinBaselineSetRef.current && !tutorBaselineSetRef.current;
          const callHasEnded = hasEndedRef.current;
          
          if (isInitialSetup || callHasEnded) {
            if (silverCoins !== undefined) setSilverCoins(Number(silverCoins ?? 0));
            if (goldCoins !== undefined) setGoldCoins(Number(goldCoins ?? 0));
            if (bronzeCoins !== undefined) setBronzeCoins(Number(bronzeCoins ?? 0));
          }

          // Initialize per-session balance for requester once, from wallet snapshot
          if (isStudentPayer && !coinBaselineSetRef.current) {
            const base = normalizedCoinType === 'bronze'
              ? Number(bronzeCoins ?? 0)
              : Number(silverCoins ?? 0);
            setSessionBalance({ remaining: base, earned: 0, lastTickMinutes: 0 });
            setInitialCoins({ 
              silver: Number(silverCoins ?? 0), 
              gold: Number(goldCoins ?? 0), 
              bronze: Number(bronzeCoins ?? 0) 
            });
            coinBaselineSetRef.current = true;
          }
          
          // Initialize tutor earnings tracking once
          if (isTutorEarner && !tutorBaselineSetRef.current) {
            setTutorEarnings({ earned: 0, lastTickMinutes: 0 });
            setInitialCoins({ 
              silver: Number(silverCoins ?? 0), 
              gold: Number(goldCoins ?? 0), 
              bronze: Number(bronzeCoins ?? 0) 
            });
            tutorBaselineSetRef.current = true;
          }
        };

        // Whiteboard sync events (both directions)
        const onWhiteboardToggle = ({ open }) => {
          setShowWhiteboard(Boolean(open));
          setTimeout(() => {
            if (open && canvasRef.current) smoothScrollIntoView(canvasRef.current);
          }, 80);
        };
        const onWhiteboardFocus = () => {
          setTimeout(() => {
            if (canvasRef.current) smoothScrollIntoView(canvasRef.current);
          }, 60);
        };

        const onWhiteboardScroll = (data) => {
          const container = whiteboardContainerRef.current;
          if (!container) return;
          const { scrollX, scrollY } = data;
          if (Math.abs(container.scrollLeft - scrollX) > 1 || Math.abs(container.scrollTop - scrollY) > 1) {
            isRemoteScrolling.current = true;
            container.scrollLeft = scrollX;
            container.scrollTop = scrollY;
          }
        };

        const handleRemoteStartPath = (data) => {
          const { pageNumber, pathId, tool, color, size, x, y } = data;
          setPages(prev => prev.map(p => {
            if (p.number !== pageNumber) return p;
            return { ...p, paths: [...p.paths, { id: pathId, tool, color, size, points: [{ x, y }] }] };
          }));
          redraw();
        };

        const handleRemoteAddPoint = (data) => {
          const { pageNumber, pathId, x, y } = data;
          setPages(prev => prev.map(p => {
            if (p.number !== pageNumber) return p;
            const newPaths = p.paths.map(path => {
              if (path.id !== pathId) return path;
              return { ...path, points: [...path.points, { x, y }] };
            });
            return { ...p, paths: newPaths };
          }));
          redraw();
        };

        const handleRemoteRemovePath = (data) => {
          const { pageNumber, pathId } = data;
          setPages(prev => prev.map(p => {
            if (p.number !== pageNumber) return p;
            return { ...p, paths: p.paths.filter(path => path.id !== pathId) };
          }));
          redraw();
        };

        const handleRemoteClearPage = (data) => {
          const { pageNumber } = data;
          setPages(prev => prev.map(p => p.number !== pageNumber ? p : { ...p, paths: [] }));
          redraw();
        };

        const handleRemoteAddPage = (data) => {
          const { pageNumber } = data;
          setPages(prev => {
            if (prev.some(p => p.number === pageNumber)) return prev;
            return [...prev, { number: pageNumber, paths: [] }];
          });
          setCurrentPageNumber(pageNumber);
          redraw();
        };

        const handleRemoteSwitchPage = (data) => {
          const { pageNumber } = data;
          setCurrentPageNumber(pageNumber);
          redraw();
        };

        socket.on('user-joined', onUserJoined);
        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('ice-candidate', onIceCandidate);
        socket.on('user-left', onUserLeft);

        socket.on('chat-message', onChat);
        socket.on('reaction', onReaction);
        socket.on('hold-status', onHoldStatus);
        socket.on('coin-update', onCoinUpdate);

        socket.on('whiteboard-toggle', onWhiteboardToggle);
        socket.on('whiteboard-focus', onWhiteboardFocus);
        socket.on('whiteboard-scroll', onWhiteboardScroll);

        socket.on('whiteboard-start-path', handleRemoteStartPath);
        socket.on('whiteboard-add-point', handleRemoteAddPoint);
        socket.on('whiteboard-remove-path', handleRemoteRemovePath);
        socket.on('whiteboard-clear-page', handleRemoteClearPage);
        socket.on('whiteboard-add-page', handleRemoteAddPage);
        socket.on('whiteboard-switch-page', handleRemoteSwitchPage);

  // (shared-image listeners already attached above)

        socket.on('end-call', ({ sessionId: endedSessionId }) => {
          if (endedSessionId === sessionId && !hasEndedRef.current) handleEndCall();
        });

        socket.on('annotation-draw', handleRemoteDraw);
        socket.on('annotation-clear', handleRemoteClear);

        // Video state synchronization
        socket.on('video-state-changed', ({ isVideoOn }) => {
          console.info('[VIDEO-STATE] Remote peer video state changed:', isVideoOn);
          setIsRemoteVideoOff(!isVideoOn);
        });

        setIsConnected(true);
      } catch (error) {
        console.error('[DEBUG] Error accessing media devices:', error);
        alert('Unable to access camera/microphone. Please check permissions.');
      }
    };

    initialize();

    return () => {
      mounted = false;
      console.info('[DEBUG] Cleanup listeners for session:', sessionId);
      cleanup();
      localStorage.removeItem('activeSession');

      socket.off('end-call');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');

      socket.off('chat-message');
      socket.off('reaction');
      socket.off('hold-status');
      socket.off('coin-update');

      socket.off('whiteboard-toggle');
      socket.off('whiteboard-focus');
      socket.off('whiteboard-scroll');

      socket.off('whiteboard-start-path');
      socket.off('whiteboard-add-point');
      socket.off('whiteboard-remove-path');
      socket.off('whiteboard-clear-page');
      socket.off('whiteboard-add-page');
      socket.off('whiteboard-switch-page');

      socket.off('shared-image');
      socket.off('remove-image');

      socket.off('annotation-draw');
      socket.off('annotation-clear');
      socket.off('video-state-changed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userRole, username]);

  // Start the timer when both streams are present
  useEffect(() => {
    if (isConnected && localStream && remoteStream && !callStartTime) {
      setCallStartTime(Date.now());
      setElapsedSeconds(0);
    }
  }, [isConnected, localStream, remoteStream, callStartTime]);

  // Monitor remote stream for video track changes
  useEffect(() => {
    if (!remoteStream) {
      setIsRemoteVideoOff(true);
      return;
    }

    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.info('[VIDEO-STATE] Remote stream has no video tracks');
      setIsRemoteVideoOff(true);
    } else {
      const videoTrack = videoTracks[0];
      console.info('[VIDEO-STATE] Remote video track status:', { 
        enabled: videoTrack.enabled, 
        readyState: videoTrack.readyState 
      });
      setIsRemoteVideoOff(!videoTrack.enabled || videoTrack.readyState === 'ended');
      
      // Listen for track state changes
      const handleTrackEnded = () => {
        console.info('[VIDEO-STATE] Remote video track ended');
        setIsRemoteVideoOff(true);
      };
      
      const handleTrackMute = () => {
        console.info('[VIDEO-STATE] Remote video track muted');
        setIsRemoteVideoOff(true);
      };
      
      const handleTrackUnmute = () => {
        console.info('[VIDEO-STATE] Remote video track unmuted');
        setIsRemoteVideoOff(false);
      };
      
      videoTrack.addEventListener('ended', handleTrackEnded);
      videoTrack.addEventListener('mute', handleTrackMute);
      videoTrack.addEventListener('unmute', handleTrackUnmute);
      
      return () => {
        videoTrack.removeEventListener('ended', handleTrackEnded);
        videoTrack.removeEventListener('mute', handleTrackMute);
        videoTrack.removeEventListener('unmute', handleTrackUnmute);
      };
    }
  }, [remoteStream]);

  // Sync timer when tab becomes visible again (prevent drift)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && callStartTime && !hasEndedRef.current) {
        // Recalculate elapsed time when tab becomes active
        const actualElapsed = Math.floor((Date.now() - callStartTime) / 1000);
        setElapsedSeconds(actualElapsed);
        console.info('[TIMER-SYNC] Tab visible, synced elapsed time:', actualElapsed);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [callStartTime]);

  // Tick timer with proper stop conditions
  useEffect(() => {
    if (!callStartTime) return;
    if (hasEndedRef.current) return; // Stop timer if call has ended
    
    const id = setInterval(() => {
      // Stop timer if call has ended
      if (hasEndedRef.current) {
        clearInterval(id);
        return;
      }
      
      // Pause timer if tab is hidden (save resources)
      if (document.hidden) {
        return;
      }
      
      const newElapsed = Math.floor((Date.now() - callStartTime) / 1000);
      setElapsedSeconds(newElapsed);
    }, 1000);
    
    return () => clearInterval(id);
  }, [callStartTime]);

  // Per-minute coin deduction for requester (student) based on elapsed time
  useEffect(() => {
    if (!isStudentPayer) return;
    if (!callStartTime) return;
    if (!sessionBalance) return;
    if (!spendPerMinute || !earnPerMinute) return;
    if (hasEndedRef.current) return; // Stop updates once call has ended

    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes <= 0) return;

    if (minutes <= sessionBalance.lastTickMinutes) return;

    const deltaMinutes = minutes - sessionBalance.lastTickMinutes;
    const coinsSpent = deltaMinutes * spendPerMinute;

    // Update wallet balance display in real-time (visual only, backend handles actual deduction)
    if (normalizedCoinType === 'bronze') {
      setBronzeCoins(Math.max(0, initialCoins.bronze - minutes * spendPerMinute));
    } else {
      setSilverCoins(Math.max(0, initialCoins.silver - minutes * spendPerMinute));
    }

    const newRemaining = Math.max(0, sessionBalance.remaining - coinsSpent);
    const newEarned = sessionBalance.earned + deltaMinutes * earnPerMinute;

    // Warn once at 5 coins remaining (>0) - for bronze, warn at 20 (5 minutes)
    const warnThreshold = normalizedCoinType === 'bronze' ? 20 : 5;
    if (!coinLowWarning && sessionBalance.remaining > warnThreshold && newRemaining <= warnThreshold && newRemaining > 0) {
      setCoinLowWarning(true);
    }

    // Apply updated session balance
    setSessionBalance(prev => {
      if (!prev) return prev;
      // Ensure we don't go backwards if another tick already updated
      if (minutes <= prev.lastTickMinutes) return prev;
      return {
        remaining: newRemaining,
        earned: newEarned,
        lastTickMinutes: minutes,
      };
    });

    // Auto-end when balance hits zero
    if (newRemaining <= 0 && sessionBalance.remaining > 0 && !hasEndedRef.current) {
      try {
        alert('Your coins for this session are exhausted. The call will now end.');
      } catch {
        // ignore alert failures (e.g., server-side rendering)
      }
      // Use microtask to avoid conflicts with state updates
      Promise.resolve().then(() => {
        if (!hasEndedRef.current) {
          handleEndCall();
        }
      });
    }
  }, [
    elapsedSeconds,
    isStudentPayer,
    callStartTime,
    sessionBalance,
    spendPerMinute,
    earnPerMinute,
    coinLowWarning,
    normalizedCoinType,
    initialCoins,
  ]);
  
  // Per-minute coin earning for tutor based on elapsed time
  useEffect(() => {
    if (!isTutorEarner) return;
    if (!callStartTime) return;
    if (!tutorEarnings) return;
    if (!earnPerMinute) return;
    if (hasEndedRef.current) return; // Stop updates once call has ended

    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes <= 0) return;

    if (minutes <= tutorEarnings.lastTickMinutes) return;

    const deltaMinutes = minutes - tutorEarnings.lastTickMinutes;
    const coinsEarned = deltaMinutes * earnPerMinute;

    console.log('[TUTOR EARNINGS]', { 
      minutes, 
      deltaMinutes, 
      coinsEarned, 
      earnPerMinute,
      initialCoins: initialCoins.bronze,
      newTotal: initialCoins.bronze + minutes * earnPerMinute 
    });

    // Update wallet balance display in real-time (visual only, backend handles actual credit)
    if (normalizedCoinType === 'bronze') {
      setBronzeCoins(initialCoins.bronze + minutes * earnPerMinute);
    } else {
      setSilverCoins(initialCoins.silver + minutes * earnPerMinute);
    }

    const newEarned = tutorEarnings.earned + coinsEarned;

    // Apply updated earnings
    setTutorEarnings(prev => {
      if (!prev) return prev;
      // Ensure we don't go backwards if another tick already updated
      if (minutes <= prev.lastTickMinutes) return prev;
      return {
        earned: newEarned,
        lastTickMinutes: minutes,
      };
    });
  }, [
    elapsedSeconds,
    isTutorEarner,
    callStartTime,
    tutorEarnings,
    earnPerMinute,
    normalizedCoinType,
    initialCoins,
  ]);

  // Keep chat scrolled
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Virtual background effect
  useEffect(() => {
    if (!localVideoRef.current) return;
    localVideoRef.current.style.filter = virtualBackground === 'blur' ? 'blur(5px)' : 'none';
  }, [virtualBackground]);

  // Page visibility monitoring - turn off video when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isVideoEnabled && !isVideoOff) {
        console.info('[VIDEO-CONTROL] Tab inactive, turning off video to save bandwidth');
        disableVideoTrack('Tab became inactive');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVideoEnabled, isVideoOff]);

  // User activity monitoring - turn off video after 30 seconds of inactivity
  useEffect(() => {
    if (!isVideoEnabled || isVideoOff) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime > 30000 && !isVideoOff) { // 30 seconds
        console.info('[VIDEO-CONTROL] User inactive for 30s, turning off video');
        disableVideoTrack('User inactivity detected');
      }
    }, 5000);

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [isVideoEnabled, isVideoOff]);

  // Network quality monitoring - simulate basic check via WebRTC stats
  useEffect(() => {
    if (!peerConnectionRef.current || !isVideoEnabled) return;

    const checkNetworkQuality = async () => {
      try {
        const stats = await peerConnectionRef.current.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
          }
        });

        const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
        
        if (lossRate > 0.1) { // >10% packet loss = poor network
          if (networkQualityRef.current === 'good') {
            console.warn('[VIDEO-CONTROL] Network quality degraded, turning off video');
            networkQualityRef.current = 'poor';
            if (!isVideoOff) {
              disableVideoTrack('Poor network quality detected');
            }
          }
        } else {
          networkQualityRef.current = 'good';
        }
      } catch (err) {
        console.warn('[VIDEO-CONTROL] Network quality check failed:', err);
      }
    };

    const intervalId = setInterval(checkNetworkQuality, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [isVideoEnabled, isVideoOff]);

  // Initialize whiteboard canvas
  useEffect(() => {
    if (!showWhiteboard || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = '100%'; // Responsive width
    canvas.style.height = '100%'; // Responsive height

    // Basic settings
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    contextRef.current = ctx;

    // Set cursor based on tool
    canvas.style.cursor = drawingTool === 'eraser' ? 'pointer' : 'crosshair';

    redraw();
  }, [showWhiteboard, drawingTool, redraw]);

  // Redraw on pages or current page change
  useEffect(() => {
    if (showWhiteboard) redraw();
  }, [pages, currentPageNumber, showWhiteboard, redraw]);

  // Whiteboard scroll sync emission
  useEffect(() => {
    if (!showWhiteboard || !whiteboardContainerRef.current) return;
    const container = whiteboardContainerRef.current;

    const handleScroll = () => {
      if (isRemoteScrolling.current) {
        isRemoteScrolling.current = false;
        return;
      }
      socket.emit('whiteboard-scroll', {
        sessionId,
        scrollX: container.scrollLeft,
        scrollY: container.scrollTop,
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [showWhiteboard, sessionId]);

  // Annotation canvas on screen share
  useEffect(() => {
    if (!(isScreenSharing && isAnnotationsEnabled && annotationCanvasRef.current && screenVideoRef.current)) return;
    const canvas = annotationCanvasRef.current;
    canvas.width = screenVideoRef.current.offsetWidth;
    canvas.height = screenVideoRef.current.offsetHeight;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = drawingTool === 'eraser' ? 'rgba(255,255,255,0)' : drawingColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = drawingTool === 'highlighter' ? 0.5 : 1;

    annotationContextRef.current = ctx;
  }, [isScreenSharing, isAnnotationsEnabled, drawingColor, brushSize, drawingTool]);

  // --- Peer connection helper
  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    const pc = new RTCPeerConnection(configuration);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn('[DEBUG] addTrack failed:', e);
        }
      });
    }

    // Remote track
    pc.ontrack = (event) => {
      console.info('[PEER-CONNECTION] ontrack event:', event.track.kind, event.track.enabled);
      const [stream] = event.streams || [];
      
      // Check if remote has video track enabled
      if (event.track.kind === 'video') {
        console.info('[VIDEO-STATE] Remote video track detected, enabled:', event.track.enabled);
        setIsRemoteVideoOff(!event.track.enabled);
        
        // Monitor track enabled/disabled changes
        event.track.onended = () => {
          console.info('[VIDEO-STATE] Remote video track ended');
          setIsRemoteVideoOff(true);
        };
        
        event.track.onmute = () => {
          console.info('[VIDEO-STATE] Remote video track muted');
          setIsRemoteVideoOff(true);
        };
        
        event.track.onunmute = () => {
          console.info('[VIDEO-STATE] Remote video track unmuted');
          setIsRemoteVideoOff(false);
        };
      }
      
      setRemoteStream(stream || null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream || null;
        applySinkId(remoteVideoRef.current, selectedAudioDevice);
      }
    };

    // Relay candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { sessionId, candidate: event.candidate });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [selectedAudioDevice, sessionId]);

  // --- Utilities

  const applySinkId = async (videoEl, sinkId) => {
    if (!videoEl || typeof videoEl.setSinkId !== 'function' || !sinkId) return;
    try {
      await videoEl.setSinkId(sinkId);
      localStorage.setItem('preferredSinkId', sinkId);
    } catch (err) {
      console.warn('[DEBUG] setSinkId failed:', err);
    }
  };

  const cleanup = () => {
    try {
      // Clear video control timers
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }
      if (videoShutoffTimeoutRef.current) {
        clearTimeout(videoShutoffTimeoutRef.current);
        videoShutoffTimeoutRef.current = null;
      }
      
      localStreamRef.current?.getTracks()?.forEach(t => t.stop());
      screenStream?.getTracks()?.forEach(t => t.stop());
      if (mediaRecorderRef.current && isRecording) {
        try { mediaRecorderRef.current.stop(); } catch (e) { console.warn('[DEBUG] recorder stop failed:', e); }
      }
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) { console.warn('[DEBUG] pc close failed:', e); }
        peerConnectionRef.current = null;
      }
      socket.emit('leave-session', { sessionId });
      if (sharedImage && typeof sharedImage === 'string' && sharedImage.startsWith('blob:')) {
        try { URL.revokeObjectURL(sharedImage); } catch { /* noop */ }
      }
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch (e) { console.warn('[DEBUG] exitFullscreen failed:', e); }
      }
    } catch (e) {
      console.warn('[DEBUG] cleanup issue:', e);
    }
  };

  // --- Whiteboard drawing handlers (improved for mobile)

  const getCanvasCoords = (e, ref, containerRef = null) => {
    const canvas = ref.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    const scrollX = containerRef?.current?.scrollLeft || 0;
    const scrollY = containerRef?.current?.scrollTop || 0;
    return {
      x: (clientX - rect.left) * scaleX + scrollX,
      y: (clientY - rect.top) * scaleY + scrollY,
    };
  };

  const startDrawing = (e, isAnnotation = false) => {
    e.preventDefault();
    if (isAnnotation) {
      const ctxRef = annotationContextRef;
      const ref = annotationCanvasRef;
      const containerRef = null;
      if (!ctxRef.current || !ref.current) return;
      const { x, y } = getCanvasCoords(e, ref, containerRef);
      setIsDrawing(true);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      socket.emit('annotation-draw', {
        sessionId,
        fromX: x,
        fromY: y,
        toX: x,
        toY: y,
        color: drawingTool === 'eraser' ? 'erase' : drawingColor,
        size: brushSize,
        tool: drawingTool,
      });
      return;
    }

    if (drawingTool === 'eraser') return;
    const ref = canvasRef;
    const containerRef = whiteboardContainerRef;
    if (!contextRef.current || !ref.current) return;
    const { x, y } = getCanvasCoords(e, ref, containerRef);
    const pathId = Date.now().toString() + Math.random().toString(36).slice(2);
    const newPath = { id: pathId, tool: drawingTool, color: drawingColor, size: brushSize, points: [{ x, y }] };
    updatePaths(prev => [...prev, newPath]);
    setCurrentPathId(pathId);
    setIsDrawing(true);
    socket.emit('whiteboard-start-path', {
      sessionId,
      pageNumber: currentPageNumber,
      pathId,
      tool: drawingTool,
      color: drawingColor,
      size: brushSize,
      x,
      y,
    });
  };

  const draw = (e, isAnnotation = false) => {
    if (!isDrawing) return;
    e.preventDefault();

    if (isAnnotation) {
      const ctxRef = annotationContextRef;
      const ref = annotationCanvasRef;
      const containerRef = null;
      if (!ctxRef.current || !ref.current) return;
      const { x, y } = getCanvasCoords(e, ref, containerRef);
      ctxRef.current.strokeStyle = drawingTool === 'eraser' ? 'rgba(255,255,255,0)' : drawingColor;
      ctxRef.current.lineWidth = brushSize;
      ctxRef.current.globalAlpha = drawingTool === 'highlighter' ? 0.5 : 1;
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
      socket.emit('annotation-draw', {
        sessionId,
        fromX: null,
        fromY: null,
        toX: x,
        toY: y,
        color: drawingTool === 'eraser' ? 'erase' : drawingColor,
        size: brushSize,
        tool: drawingTool,
      });
      return;
    }

    if (drawingTool === 'eraser' || !currentPathId) return;
    const ref = canvasRef;
    const containerRef = whiteboardContainerRef;
    if (!contextRef.current || !ref.current) return;
    const { x, y } = getCanvasCoords(e, ref, containerRef);
    updatePaths(prev => prev.map(path => path.id !== currentPathId ? path : { ...path, points: [...path.points, { x, y }] }));
    socket.emit('whiteboard-add-point', {
      sessionId,
      pageNumber: currentPageNumber,
      pathId: currentPathId,
      x,
      y,
    });
    redraw();
  };

  const stopDrawing = (isAnnotation = false) => {
    setIsDrawing(false);
    if (!isAnnotation) setCurrentPathId(null);
  };

  const handleErase = (e) => {
    if (drawingTool !== 'eraser') return;
    e.preventDefault();
    const ref = canvasRef;
    const containerRef = whiteboardContainerRef;
    if (!ref.current) return;
    const { x, y } = getCanvasCoords(e, ref, containerRef);
    const hitId = getHitPath(x, y, currentPage?.paths || []);
    if (hitId) {
      updatePaths(prev => prev.filter(p => p.id !== hitId));
      socket.emit('whiteboard-remove-path', {
        sessionId,
        pageNumber: currentPageNumber,
        pathId: hitId,
      });
      redraw();
    }
  };

  const handleRemoteDraw = (data) => {
    const ctxRef = annotationContextRef;
    const ref = annotationCanvasRef;
    if (!ctxRef.current || !ref.current) return;

    const ctx = ctxRef.current;
    const prevColor = ctx.strokeStyle;
    const prevSize = ctx.lineWidth;
    const prevAlpha = ctx.globalAlpha;

    ctx.strokeStyle = data.color === 'erase' ? 'rgba(255,255,255,0)' : data.color;
    ctx.lineWidth = data.size;
    ctx.globalAlpha = data.tool === 'highlighter' ? 0.5 : 1;

    ctx.beginPath();
    ctx.moveTo(data.fromX || data.toX, data.fromY || data.toY);
    ctx.lineTo(data.toX, data.toY);
    ctx.stroke();

    ctx.strokeStyle = prevColor;
    ctx.lineWidth = prevSize;
    ctx.globalAlpha = prevAlpha;
  };

  const handleRemoteClear = () => {
    const ctxRef = annotationContextRef;
    const ref = annotationCanvasRef;
    if (!ctxRef.current || !ref.current) return;
    ctxRef.current.clearRect(0, 0, ref.current.width, ref.current.height);
  };

  const clearWhiteboard = (isAnnotation = false) => {
    if (isAnnotation) {
      const ctxRef = annotationContextRef;
      const ref = annotationCanvasRef;
      if (!ctxRef.current || !ref.current) return;
      ctxRef.current.clearRect(0, 0, ref.current.width, ref.current.height);
      socket.emit('annotation-clear', { sessionId });
      return;
    }
    updatePaths(() => []);
    socket.emit('whiteboard-clear-page', { sessionId, pageNumber: currentPageNumber });
    redraw();
  };

  const addPage = () => {
    const maxNum = Math.max(...pages.map(p => p.number), 0);
    const newNum = maxNum + 1;
    if (newNum > 50) {
      alert('Maximum 50 pages allowed');
      return;
    }
    setPages([...pages, { number: newNum, paths: [] }]);
    setCurrentPageNumber(newNum);
    socket.emit('whiteboard-add-page', { sessionId, pageNumber: newNum });
  };

  const switchPage = (num) => {
    setCurrentPageNumber(num);
    socket.emit('whiteboard-switch-page', { sessionId, pageNumber: num });
  };

  // --- Image sharing
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setSharedImage(imageUrl);
    setShowWhiteboard(false); // Hide whiteboard when image is uploaded
    socket.emit('shared-image', { sessionId, imageUrl });
  // no-op: picker UI removed, image shared immediately
  };

  const removeSharedImage = () => {
    if (sharedImage) {
      URL.revokeObjectURL(sharedImage);
      setSharedImage(null);
      setShowWhiteboard(true); // Show whiteboard when image is removed
      socket.emit('remove-image', { sessionId });
    }
  };

  // --- Chat
  const sendMessage = (e) => {
    e.preventDefault();
    const msg = (newMessage || '').trim();
    if (!msg) return;
    socket.emit('chat-message', { sessionId, message: msg, username });
    setMessages(prev => [...prev, { sender: username, text: msg, timestamp: new Date() }]);
    setNewMessage('');
  };

  // --- Reactions
  const sendReaction = (type) => {
    socket.emit('reaction', { sessionId, type, username });
    setReactions(prev => [...prev, { type, username, timestamp: Date.now() }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 5000));
    }, 5000);
    setShowReactionsMenu(false);
  };

  // --- Save coin transaction to backend
  const saveCoinTransaction = async (durationSeconds, durationMinutes) => {
    try {
      // Determine transaction type and amount based on role
      let transactionType, amount, balanceBefore, balanceAfter;
      
      if (isStudentPayer) {
        // Student/learner spending coins
        transactionType = 'spent';
        amount = durationMinutes * spendPerMinute;
        
        if (normalizedCoinType === 'silver') {
          balanceBefore = initialCoins.silver;
          balanceAfter = silverCoins;
        } else if (normalizedCoinType === 'bronze') {
          balanceBefore = initialCoins.bronze;
          balanceAfter = bronzeCoins;
        }
      } else if (isTutorEarner) {
        // Tutor earning coins
        transactionType = 'earned';
        amount = durationMinutes * earnPerMinute;
        
        if (normalizedCoinType === 'silver') {
          balanceBefore = initialCoins.silver;
          balanceAfter = silverCoins;
        } else if (normalizedCoinType === 'bronze') {
          balanceBefore = initialCoins.bronze;
          balanceAfter = bronzeCoins;
        }
      } else {
        // No transaction for this role/coin type combination
        console.info('[COIN-TRANSACTION] No transaction to save for role:', userRole);
        return;
      }

      const transactionData = {
        sessionId,
        transactionType,
        coinType: normalizedCoinType,
        amount,
        balanceBefore,
        balanceAfter,
        sessionDuration: durationSeconds,
        userRole,
        partnerName: username, // Will be improved with actual partner name from session
        sessionStartTime: callStartTime,
        sessionEndTime: new Date()
      };

      console.info('[COIN-TRANSACTION] Saving:', transactionData);

      const response = await fetch('/api/coin-transactions/save-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transactionData)
      });

      const data = await response.json();
      
      if (data.success) {
        console.info('[COIN-TRANSACTION] Transaction saved successfully');
      } else {
        console.error('[COIN-TRANSACTION] Failed to save:', data.message);
      }
    } catch (error) {
      console.error('[COIN-TRANSACTION] Error saving transaction:', error);
    }
  };

  // --- Call controls

  const handleEndCall = () => {
    if (hasEndedRef.current) {
      console.warn('[CALL-END] Call already ended, ignoring duplicate call');
      return;
    }
    
    console.info('[CALL-END] Ending call, elapsed seconds:', elapsedSeconds);
    hasEndedRef.current = true;
    
    // Calculate final duration based on elapsed time
    const finalElapsed = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : elapsedSeconds;
    const minutes = Math.max(1, Math.floor(finalElapsed / 60));
    
    console.info('[CALL-END] Final duration:', minutes, 'minutes');
    
    // Save coin transaction to backend
    saveCoinTransaction(finalElapsed, minutes);
    
    try { 
      socket.emit('end-call', { sessionId, minutes, elapsedSeconds: finalElapsed }); 
    } catch (err) { 
      console.error('[CALL-END] Failed to emit end-call:', err);
    }
    
    // Stop timer and cleanup
    cleanup();
    setCallStartTime(null);
    setElapsedSeconds(0);
    
    // Notify parent component
    onEndCall && onEndCall(sessionId, minutes);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  // Enable video dynamically with LOW BANDWIDTH constraints (360p, 15fps)
  const enableVideoTrack = async () => {
    try {
      if (isVideoEnabled && !isVideoOff) {
        // Video already enabled, just turn it back on
        const videoTrack = localStreamRef.current?.getVideoTracks?.()?.[0];
        if (videoTrack) {
          videoTrack.enabled = true;
          setIsVideoOff(false);
          startVideoTimer(); // Start fresh 2-minute timer
          return;
        }
      }

      console.info('[VIDEO-CONTROL] Enabling video with low-bandwidth constraints');
      
      // LOW BANDWIDTH VIDEO CONSTRAINTS (Filo-style)
      const videoConstraints = {
        width: { ideal: 640, max: 640 },    // 360p width
        height: { ideal: 360, max: 360 },   // 360p height
        frameRate: { ideal: 15, max: 15 }   // Low FPS to save bandwidth
      };

      // Get video track separately
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false // Don't request audio again
      });

      const videoTrack = videoStream.getVideoTracks()[0];
      
      if (!videoTrack) {
        throw new Error('Failed to get video track');
      }

      // Add video track to existing stream
      localStreamRef.current.addTrack(videoTrack);
      
      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      // Add track to peer connection and trigger renegotiation
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.addTrack(videoTrack, localStreamRef.current);
        
        // Apply bitrate constraints for bandwidth optimization
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = 300000; // 300 kbps max (very low)
        await sender.setParameters(parameters);

        // Trigger renegotiation
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('offer', { sessionId, offer });
          console.info('[VIDEO-CONTROL] Video track added, renegotiation sent');
        } catch (err) {
          console.error('[VIDEO-CONTROL] Renegotiation failed:', err);
        }
      }

      setIsVideoEnabled(true);
      setIsVideoOff(false);
      
      // Notify remote peer that video is now ON
      socket.emit('video-state-changed', { sessionId, isVideoOn: true });
      
      // Start auto-shutoff timer - 2 minutes, restarts each time camera is enabled
      startVideoTimer();
      
      console.info('[VIDEO-CONTROL] Video enabled successfully with 360p@15fps, 2-min auto-shutoff timer started');
    } catch (error) {
      console.error('[VIDEO-CONTROL] Failed to enable video:', error);
      alert('Unable to enable video. Please check camera permissions.');
    }
  };

  // Disable video track (but keep audio running)
  const disableVideoTrack = (reason = 'Manual') => {
    try {
      console.info(`[VIDEO-CONTROL] Disabling video: ${reason}`);
      
      const videoTrack = localStreamRef.current?.getVideoTracks?.()?.[0];
      if (videoTrack) {
        videoTrack.enabled = false;
        setIsVideoOff(true);
        
        // Notify remote peer that video is now OFF
        socket.emit('video-state-changed', { sessionId, isVideoOn: false });
      }
      
      // Clear timers
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }
      if (videoShutoffTimeoutRef.current) {
        clearTimeout(videoShutoffTimeoutRef.current);
        videoShutoffTimeoutRef.current = null;
      }
      
      setVideoTimeRemaining(0);
      setIsVideoShuttingDown(false); // Reset state so user can re-enable camera
      
      console.info('[VIDEO-CONTROL] Video disabled, camera button remains active for re-enabling');
    } catch (error) {
      console.error('[VIDEO-CONTROL] Failed to disable video:', error);
    }
  };

  // Start video timer with auto-shutoff after 2 minutes
  const startVideoTimer = () => {
    const VIDEO_DURATION = 120; // 2 minutes (120 seconds)
    const WARNING_TIME = 30; // Show warning 30 seconds before shutoff
    
    setVideoTimeRemaining(VIDEO_DURATION);
    
    // Clear existing timers
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    if (videoShutoffTimeoutRef.current) clearTimeout(videoShutoffTimeoutRef.current);
    
    // Countdown timer
    videoTimerRef.current = setInterval(() => {
      setVideoTimeRemaining(prev => {
        const newTime = prev - 1;
        
        if (newTime <= WARNING_TIME && !isVideoShuttingDown) {
          setIsVideoShuttingDown(true);
          console.info('[VIDEO-CONTROL] Video will shut off in', newTime, 'seconds');
        }
        
        if (newTime <= 0) {
          clearInterval(videoTimerRef.current);
          disableVideoTrack('Auto-shutoff timer expired');
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  };

  // Toggle video (turn on if off, turn off if on)
  const toggleVideo = () => {
    if (isVideoOff) {
      enableVideoTrack();
    } else {
      disableVideoTrack('Manual toggle');
    }
  };

  // Camera switch removed for web version

  const toggleSpeaker = async () => {
    const newOn = !isSpeakerOn;
    setIsSpeakerOn(newOn);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !newOn;
    }
  };

  // const changeAudioDevice = async (deviceId) => {
  //   setSelectedAudioDevice(deviceId);
  //   if (remoteVideoRef.current) {
  //     await applySinkId(remoteVideoRef.current, deviceId);
  //   }
  //   localStorage.setItem('preferredSinkId', deviceId);
  // };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          ?.find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        videoTrack.onended = () => stopScreenShare();
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error('[DEBUG] toggleScreenShare error:', err);
    }
  };

  const stopScreenShare = async () => {
    try {
      screenStream?.getTracks()?.forEach(t => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      setIsAnnotationsEnabled(false);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

      const videoTrack = localStreamRef.current?.getVideoTracks?.()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        ?.find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    } catch (err) {
      console.error('[DEBUG] stopScreenShare error:', err);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      if (!localStreamRef.current) return;
      try {
        const recorder = new MediaRecorder(localStreamRef.current);
        recordedChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `call-recording-${sessionId}-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.error('[DEBUG] MediaRecorder error:', err);
      }
    } else {
      try {
        mediaRecorderRef.current?.stop();
      } catch (e) {
        console.warn('[DEBUG] recorder stop failed:', e);
      }
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  const toggleBackground = (type) => {
    setVirtualBackground(type);
  };

  const toggleFullScreen = () => {
    const el = videoContainerRef.current;
    if (!el) return;
    if (!isFullScreen) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  const makeRemoteFullScreen = () => setViewMode('remote-full');
  const makeLocalFullScreen = () => setViewMode('local-full');
  const resetViewMode = () => setViewMode('grid');

  const toggleAnnotations = () => setIsAnnotationsEnabled(prev => !prev);

  const toggleWhiteboard = () => {
    const next = !showWhiteboard;
    setShowWhiteboard(next);
    socket.emit('whiteboard-toggle', { sessionId, open: next });
    if (next) {
      setTimeout(() => {
        smoothScrollIntoView(canvasRef.current);
        socket.emit('whiteboard-focus', { sessionId });
      }, 60);
    }
  };

  // --- UI Icons
  const Icon = {
    Mic: ({ off = false, ...p }) => off ? (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p} aria-hidden="true">
        <path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Zm-7 0a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p} aria-hidden="true">
        <path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Zm-7 0a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Cam: ({ off = false, ...p }) => off ? (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M3 7h10a2 2 0 0 1 2 2v1l4-2v8l-4-2v1a2 2 0 0 1-2 2H3z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M4 4l16 16" stroke="currentColor" strokeWidth="2"/></svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M3 7h10a2 2 0 0 1 2 2v1l4-2v8l-4-2v1a2 2 0 0 1-2 2H3z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
    ),
    Switch: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M8 6h10l-3-3m3 3-3 3M16 18H6l3 3m-3-3 3-3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
    ),
    Speaker: ({ off = false, ...p }) => off ? (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M4 9v6h4l6 4V5L8 9H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 12h4" stroke="currentColor" strokeWidth="2"/></svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M4 9v6h4l6 4V5L8 9H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M18 9a6 6 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
    ),
    Share: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
        <path d="M3 5h18v10H3zM9.5 21h5" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 13V7m0 0l-3 3m3-3 3 3" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Record: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
        <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Board: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
        <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 19l2-3m6 3l-2-3" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 8h6m-6 3h10" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Chat: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
        <path d="M4 5h16v10H7l-3 3z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Blur: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
        <path d="M12 3c5 6 5 12 0 18-5-6-5-12 0-18z" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Full: ({ on = false, ...p }) => on ? (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2"/></svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}><path d="M4 9V5h4M20 9V5h-4M4 15v4h4m12-4v4h-4" stroke="currentColor" strokeWidth="2"/></svg>
    ),
    End: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p} aria-hidden="true">
        <path d="M4 14c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 14l-3 3m13-3l3 3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Question: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" {...p} aria-hidden="true">
        <path d="M12 4a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8zm0 4c-1.1 0-2 .9-2 2 0 .7.4 1.3 1 1.7v1.3h2v-1.3c.6-.4 1-1 1-1.7 0-1.1-.9-2-2-2zm0 8h2v2h-2v-2z" fill="currentColor"/>
      </svg>
    ),
  };

  // Drag handlers for video tiles
  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart({ 
      x: clientX - videoTilesPosition.x, 
      y: clientY - videoTilesPosition.y 
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Constrain to viewport bounds with smaller margin on mobile
    if (videoTilesRef.current) {
      const rect = videoTilesRef.current.getBoundingClientRect();
      const margin = window.innerWidth < 640 ? 8 : 12; // 8px on mobile, 12px on larger screens
      const maxX = window.innerWidth - rect.width - margin;
      const maxY = window.innerHeight - rect.height - margin;
      
      setVideoTilesPosition({
        x: Math.max(-maxX, Math.min(0, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add/remove drag listeners
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, dragStart, videoTilesPosition]);

  // --- Render
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col h-screen w-screen overflow-hidden">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center px-3 sm:px-6 py-3 bg-slate-800/95 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <FaCircle className="text-red-500 animate-pulse" size={10} />
            <span className="font-semibold">
              {callStartTime ? (
                <>
                  {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                  {String(elapsedSeconds % 60).padStart(2, '0')}
                </>
              ) : (
                'Connecting...'
              )}
            </span>
          </div>
          
          {normalizedCoinType === 'silver' && (
            <span className="px-2 py-1 bg-slate-700/80 rounded-full text-xs font-medium">
              💰 Silver: {silverCoins.toFixed(2)}
            </span>
          )}
          {normalizedCoinType === 'bronze' && (
            <span className="px-2 py-1 bg-amber-700/80 rounded-full text-xs font-medium">
              🥉 Bronze: {bronzeCoins.toFixed(2)}
            </span>
          )}
          {isTutorEarner && tutorEarnings && (
            <span className="px-2 py-1 bg-green-600/80 rounded-full text-xs font-medium">
              +{tutorEarnings.earned.toFixed(2)}
            </span>
          )}
          {isVideoEnabled && !isVideoOff && videoTimeRemaining > 0 && (
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isVideoShuttingDown ? 'bg-red-600/80 animate-pulse' : 'bg-blue-600/80'
              }`}
            >
              <FaVideo className="inline mr-1" size={10} />
              {Math.floor(videoTimeRemaining / 60)}:{String(videoTimeRemaining % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          <span className="text-xs sm:text-sm font-medium">
            {username} <span className="text-slate-400">({userRole})</span>
          </span>
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all text-xs sm:text-sm shadow-lg"
            title="End Call"
          >
            <FaPhone className="rotate-135" size={14} />
            End Call
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Main View Area - Question Photo or Whiteboard */}
        <section className="absolute inset-0 bg-slate-900">
          {sharedImage ? (
            /* Question Photo View */
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="relative max-w-full max-h-full">
                <img
                  src={sharedImage}
                  alt="Question"
                  className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-xl shadow-2xl border border-slate-700"
                />
                {userRole === 'tutor' && (
                  <button
                    onClick={removeSharedImage}
                    className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-all"
                    title="Remove question image"
                  >
                    <FaTimes size={16} />
                  </button>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-2 bg-black/80 rounded-lg text-sm font-medium backdrop-blur-sm">
                  <FaImage className="inline mr-2" />
                  Question Image
                </div>
              </div>
            </div>
          ) : showWhiteboard ? (
            /* Whiteboard View */
            <div className="w-full h-full flex flex-col p-2 sm:p-3 md:p-4">
              {/* Toolbar Toggle Button (Mobile) */}
              <button
                onClick={() => setIsWhiteboardToolbarOpen(!isWhiteboardToolbarOpen)}
                className="md:hidden absolute top-2 left-2 z-10 p-2 bg-slate-700/95 hover:bg-slate-600 rounded-lg shadow-lg transition-all backdrop-blur-sm border border-slate-600"
                title={isWhiteboardToolbarOpen ? 'Hide toolbar' : 'Show toolbar'}
              >
                {isWhiteboardToolbarOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </button>
              
              {/* Toolbar - Collapsible on mobile */}
              <div className={`flex flex-wrap items-center gap-2 bg-slate-800/90 p-2 sm:p-3 rounded-lg backdrop-blur-sm border border-slate-700/50 transition-all duration-300 ${
                isWhiteboardToolbarOpen ? 'mb-2 sm:mb-3 opacity-100' : 'mb-0 h-0 p-0 opacity-0 overflow-hidden md:opacity-100 md:h-auto md:p-3 md:mb-3'
              }`}>
                <div className="flex items-center gap-2">
                  <FaChalkboard className="text-blue-400" />
                  <span className="font-semibold text-sm">Whiteboard</span>
                  <span className="text-xs text-slate-400">Page {currentPageNumber}</span>
                </div>
                <div className="flex-1" />
                
                {/* Tool Selection */}
                <div className="flex items-center gap-1 bg-slate-700/50 rounded p-1">
                  <button
                    onClick={() => setDrawingTool('pen')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      drawingTool === 'pen' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600'
                    }`}
                    title="Pen"
                  >
                    ✏️ Pen
                  </button>
                  <button
                    onClick={() => setDrawingTool('eraser')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                      drawingTool === 'eraser' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600'
                    }`}
                    title="Eraser"
                  >
                    <FaEraser size={12} /> Eraser
                  </button>
                </div>
                
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Color:</span>
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-600"
                    disabled={drawingTool === 'eraser'}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Size:</span>
                  <select
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {drawingTool === 'eraser' ? 
                      [10, 20, 30, 40, 50].map(s => <option key={s} value={s}>{s}px</option>) :
                      [1, 3, 5, 10, 20].map(s => <option key={s} value={s}>{s}px</option>)
                    }
                  </select>
                </label>
                
                {/* Page Navigation */}
                <div className="flex items-center gap-1 bg-slate-700/50 rounded p-1">
                  <button
                    onClick={() => {
                      if (currentPageNumber > 1) {
                        switchPage(currentPageNumber - 1);
                      }
                    }}
                    disabled={currentPageNumber <= 1}
                    className="p-1.5 hover:bg-slate-600 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <FaArrowLeft size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (currentPageNumber < 50 && !pages.find(p => p.number === currentPageNumber + 1)) {
                        addPage();
                      } else if (pages.find(p => p.number === currentPageNumber + 1)) {
                        switchPage(currentPageNumber + 1);
                      }
                    }}
                    disabled={currentPageNumber >= 50}
                    className="p-1.5 hover:bg-slate-600 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={pages.find(p => p.number === currentPageNumber + 1) ? 'Next Page' : 'Add New Page'}
                  >
                    {pages.find(p => p.number === currentPageNumber + 1) ? 
                      <FaArrowRight size={12} /> : 
                      <FaPlus size={12} />
                    }
                  </button>
                </div>
                
                <button
                  onClick={clearWhiteboard}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded font-medium text-xs transition-all"
                >
                  Clear Page
                </button>
              </div>
              
              <div className={`bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-700 transition-all duration-300 ${
                isWhiteboardToolbarOpen ? 'flex-1' : 'absolute inset-0 md:relative md:flex-1'
              }`}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-slate-400">
                <FaChalkboard size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Waiting for content...</p>
                <p className="text-sm mt-2">Question image or whiteboard will appear here</p>
              </div>
            </div>
          )}

          {/* Screen Share Overlay */}
          {isScreenSharing && screenStream && (
            <div className="absolute bottom-4 left-4 w-64 sm:w-80 h-48 sm:h-60 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500 z-10">
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-xs font-medium rounded flex items-center gap-1">
                <FaDesktop size={12} />
                Screen Share
              </div>
            </div>
          )}
        </section>

        {/* Small Video Tiles - Responsive (Default) */}
        {!isVideoExpanded && (
          <div 
            ref={videoTilesRef}
            className="absolute flex flex-col gap-0 z-20 select-none touch-none"
            style={{
              top: `${8 + videoTilesPosition.y}px`,
              right: `${8 - videoTilesPosition.x}px`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {/* Drag Handle Indicator */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-slate-700/90 rounded-t-lg text-[10px] sm:text-xs font-medium backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Drag to move
            </div>
            
            {/* Local Video Tile */}
            <div 
              onClick={(e) => {
                if (!isDragging) {
                  e.stopPropagation();
                  setIsVideoExpanded(true);
                }
              }}
              className="relative w-24 h-20 xs:w-28 xs:h-24 sm:w-36 sm:h-28 md:w-44 md:h-36 bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all border border-slate-700 group"
              title="Click to expand videos"
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                  <div className="text-center">
                    <FaVideoSlash className="mx-auto mb-1 text-slate-500" size={16} />
                    <p className="text-[9px] sm:text-xs text-slate-400">Camera Off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/80 rounded text-[9px] sm:text-xs font-medium backdrop-blur-sm">
                <FaUser className="inline mr-0.5 sm:mr-1" size={8} />
                You
              </div>
              <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors flex items-center justify-center">
                <FaExpand className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
              </div>
            </div>

            {/* Remote Video Tile */}
            <div 
              onClick={(e) => {
                if (!isDragging) {
                  e.stopPropagation();
                  setIsVideoExpanded(true);
                }
              }}
              className="relative w-24 h-20 xs:w-28 xs:h-24 sm:w-36 sm:h-28 md:w-44 md:h-36 bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all border border-slate-700 group"
              title="Click to expand videos"
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-blue-500 mx-auto mb-1"></div>
                    <p className="text-[9px] sm:text-xs text-slate-400">Waiting...</p>
                  </div>
                </div>
              )}
              {remoteStream && isRemoteVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                  <div className="text-center">
                    <FaVideoSlash className="mx-auto mb-1 text-slate-500" size={16} />
                    <p className="text-[9px] sm:text-xs text-slate-400">Camera Off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/80 rounded text-[9px] sm:text-xs font-medium backdrop-blur-sm">
                <FaUser className="inline mr-0.5 sm:mr-1" size={8} />
                Partner
              </div>
              <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors flex items-center justify-center">
                <FaExpand className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Expanded Video View */}
        {isVideoExpanded && (
          <div className="absolute inset-0 z-30 bg-slate-900/98 backdrop-blur-md flex flex-col p-2 sm:p-4">
            <button
              onClick={() => setIsVideoExpanded(false)}
              className="self-start flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-700 hover:bg-slate-600 rounded-lg mb-2 sm:mb-4 transition-all shadow-lg font-medium text-sm"
            >
              <FaArrowLeft size={14} />
              <span className="hidden xs:inline">Back to Session</span>
              <span className="xs:hidden">Back</span>
            </button>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              {/* Local Video (Expanded) */}
              <div className="relative bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
                    <div className="text-center">
                      <FaVideoSlash className="mx-auto mb-2 sm:mb-4 text-slate-500" size={40} />
                      <p className="text-base sm:text-xl font-semibold">Camera Off</p>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2 px-4">Click camera button to enable video</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2 py-1 sm:px-4 sm:py-2 bg-black/80 rounded-lg sm:rounded-xl backdrop-blur-sm text-xs sm:text-base">
                  <FaUser className="inline mr-1 sm:mr-2" size={12} />
                  <span className="hidden xs:inline">You ({username})</span>
                  <span className="xs:hidden">You</span>
                </div>
              </div>

              {/* Remote Video (Expanded) */}
              <div className="relative bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-blue-500 mx-auto mb-2 sm:mb-4"></div>
                      <p className="text-sm sm:text-lg">Waiting for partner...</p>
                    </div>
                  </div>
                )}
                {remoteStream && isRemoteVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
                    <div className="text-center">
                      <FaVideoSlash className="mx-auto mb-2 sm:mb-4 text-slate-500" size={40} />
                      <p className="text-base sm:text-xl font-semibold">Partner's Camera Off</p>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2 px-4">Waiting for partner to enable video</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2 py-1 sm:px-4 sm:py-2 bg-black/80 rounded-lg sm:rounded-xl backdrop-blur-sm text-xs sm:text-base">
                  <FaUser className="inline mr-1 sm:mr-2" size={12} />
                  Partner
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <aside className="absolute top-0 right-0 bottom-0 w-full sm:w-80 md:w-96 bg-slate-800/95 backdrop-blur-md border-l border-slate-700 flex flex-col z-40 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
              <h3 className="font-semibold flex items-center gap-2">
                <FaComments className="text-blue-400" />
                Chat
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.map((msg, i) => {
                const mine = msg.sender === username;
                return (
                  <div
                    key={i}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl ${
                        mine ? 'bg-blue-600 rounded-br-sm' : 'bg-slate-700 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-80">{msg.sender}</p>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-8">
                  <FaComments size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                </div>
              )}
            </div>

            <form className="p-4 border-t border-slate-700 bg-slate-900/50" onSubmit={sendMessage}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm transition-all"
                >
                  Send
                </button>
              </div>
            </form>
          </aside>
        )}
      </main>

      {/* Reactions */}
      <div className="pointer-events-none absolute top-24 right-4 flex flex-col gap-2 z-30">
        {reactions.map((r, idx) => (
          <div
            key={`${r.timestamp}-${idx}`}
            className="pointer-events-auto bg-slate-800/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg animate-bounce text-xl border border-slate-700"
          >
            {r.type}
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <footer className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50">
        <button
          onClick={toggleMute}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg relative ${
            isVideoOff ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
          }`}
          title={isVideoOff ? 'Enable Camera' : 'Disable Camera'}
        >
          {isVideoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
          {isVideoOff && !isVideoEnabled && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
          )}
        </button>

        <button
          onClick={toggleSpeaker}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg ${
            isSpeakerOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
        >
          {isSpeakerOn ? <FaVolumeUp size={18} /> : <FaVolumeMute size={18} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg ${
            isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title="Screen Share"
        >
          <FaDesktop size={18} />
        </button>

        <button
          onClick={toggleRecording}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg relative ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <FaCircle size={isRecording ? 18 : 14} className={isRecording ? 'animate-pulse' : ''} />
        </button>

        <button
          onClick={toggleWhiteboard}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg ${
            showWhiteboard ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title="Whiteboard"
        >
          <FaChalkboard size={18} />
        </button>

        <button
          onClick={() => setShowChat(prev => !prev)}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg ${
            showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title="Chat"
        >
          <FaComments size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(prev => !prev)}
            className="p-2.5 sm:p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all shadow-lg"
            title="Reactions"
          >
            <FaSmile size={18} />
          </button>
          {showReactionsMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-xl p-2 flex gap-2 shadow-2xl backdrop-blur-md">
              {['😊', '👍', '👏', '❤️', '😂', '😮'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-xl transition-all hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleFullScreen}
          className={`p-2.5 sm:p-3 rounded-full transition-all shadow-lg ${
            isFullScreen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title="Fullscreen"
        >
          {isFullScreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
        </button>

        {userRole === 'tutor' && (
          <div className="relative">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2.5 sm:p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all shadow-lg"
              title="Add Question Image"
            >
              <FaImage size={18} />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}
      </footer>
    </div>
  );
};

export default VideoCall;
