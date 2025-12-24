import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import socket from '../socket.js';

/**
 * VideoCall (Updated)
 * - Whiteboard syncs both ways (teacher ↔ student)
 * - New "Add Question" button for image upload (gallery/file picker)
 * - Image displays on student's view where teacher's face is, with remove option
 * - Fixed whiteboard pen/eraser for mobile (improved touch handling)
 * - Mobile-responsive UI with better touch support
 * - Removed session info to save space
 * - Enhanced a11y and defensive refs
 */

const VideoCall = ({ sessionId, onEndCall, userRole, username }) => {
  console.info('[DEBUG] VideoCall: Init session:', sessionId, 'role:', userRole);

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
  const hasEndedRef = useRef(false);

  // AV controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // Start with video OFF
  const [isVideoEnabled, setIsVideoEnabled] = useState(false); // Track if video has been added to stream
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  
  // Controlled video feature
  const [videoTimeRemaining, setVideoTimeRemaining] = useState(0); // seconds remaining
  const [isVideoShuttingDown, setIsVideoShuttingDown] = useState(false);
  const videoTimerRef = useRef(null);
  const videoShutoffTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const networkQualityRef = useRef('good'); // 'good' | 'poor'

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
          }
        };
        const onRemoveImage = () => {
          setSharedImage(null);
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

        const onCoinUpdate = ({ silverCoins, goldCoins }) => {
          if (silverCoins !== undefined) setSilverCoins(Number(silverCoins ?? 0));
          if (goldCoins !== undefined) setGoldCoins(Number(goldCoins ?? 0));
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userRole, username, isCameraSwitched]);

  // Start the timer when both streams are present
  useEffect(() => {
    if (isConnected && localStream && remoteStream && !callStartTime) {
      setCallStartTime(Date.now());
      setElapsedSeconds(0);
    }
  }, [isConnected, localStream, remoteStream, callStartTime]);

  // Tick timer
  useEffect(() => {
    if (!callStartTime) return;
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [callStartTime]);

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
      const [stream] = event.streams || [];
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
    socket.emit('shared-image', { sessionId, imageUrl });
  // no-op: picker UI removed, image shared immediately
  };

  const removeSharedImage = () => {
    if (sharedImage) {
      URL.revokeObjectURL(sharedImage);
      setSharedImage(null);
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

  // --- Call controls

  const handleEndCall = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
  try { socket.emit('end-call', { sessionId }); } catch { /* ignore */ }
    cleanup();
    setCallStartTime(null);
    setElapsedSeconds(0);
    onEndCall && onEndCall(sessionId);
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
          startVideoTimer();
          return;
        }
      }

      console.info('[VIDEO-CONTROL] Enabling video with low-bandwidth constraints');
      
      // LOW BANDWIDTH VIDEO CONSTRAINTS (Filo-style)
      const videoConstraints = {
        width: { ideal: 640, max: 640 },    // 360p width
        height: { ideal: 360, max: 360 },   // 360p height
        frameRate: { ideal: 15, max: 15 },  // Low FPS to save bandwidth
        facingMode: isCameraSwitched ? 'environment' : 'user'
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
      
      // Start auto-shutoff timer (3-5 minutes)
      startVideoTimer();
      
      console.info('[VIDEO-CONTROL] Video enabled successfully with 360p@15fps');
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
      setIsVideoShuttingDown(false);
    } catch (error) {
      console.error('[VIDEO-CONTROL] Failed to disable video:', error);
    }
  };

  // Start video timer with auto-shutoff after 3-5 minutes
  const startVideoTimer = () => {
    const VIDEO_DURATION = 180; // 3 minutes (180 seconds) - configurable
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

  const switchCamera = async () => {
    try {
      if (!isVideoEnabled || isVideoOff) {
        console.warn('[VIDEO-CONTROL] Cannot switch camera - video is not enabled');
        return;
      }

      setIsCameraSwitched(prev => !prev);
      
      // Stop only video track, keep audio
      const videoTrack = localStreamRef.current?.getVideoTracks?.()?.[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
      }

      // Get new video track with switched camera (with low bandwidth constraints)
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 640 },
          height: { ideal: 360, max: 360 },
          frameRate: { ideal: 15, max: 15 },
          facingMode: !isCameraSwitched ? 'environment' : 'user'
        },
        audio: false
      });

      const newVideoTrack = videoStream.getVideoTracks()[0];
      localStreamRef.current.addTrack(newVideoTrack);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      // Replace track in peer connection
      const sender = peerConnectionRef.current
        ?.getSenders()
        ?.find(s => s.track?.kind === 'video');
      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
        
        // Reapply bitrate constraints
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = 300000;
        await sender.setParameters(parameters);
      }
      
      console.info('[VIDEO-CONTROL] Camera switched successfully');
    } catch (err) {
      console.error('[VIDEO-CONTROL] switchCamera error:', err);
    }
  };

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

  // --- Render
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 bg-gray-800 shadow-md">
        <div className="text-sm sm:text-lg font-semibold mb-2 sm:mb-0">
          {callStartTime ? (
            <span aria-live="polite">
              Call Time:&nbsp;
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          ) : (
            <span>Waiting for connection...</span>
          )}
          {typeof silverCoins === 'number' && (
            <span className="ml-2 sm:ml-4" title="Your current silver coins">Silver: {silverCoins.toFixed(2)}</span>
          )}
          {typeof goldCoins === 'number' && (
            <span className="ml-2 sm:ml-4" title="Your current gold coins">Gold: {goldCoins.toFixed(2)}</span>
          )}
          {/* Video Timer Display */}
          {isVideoEnabled && !isVideoOff && videoTimeRemaining > 0 && (
            <span 
              className={`ml-2 sm:ml-4 px-2 py-1 rounded text-xs sm:text-sm ${
                isVideoShuttingDown 
                  ? 'bg-red-600/80 animate-pulse' 
                  : 'bg-blue-600/80'
              }`}
              title="Video will auto-shutoff to save bandwidth"
            >
              📹 {Math.floor(videoTimeRemaining / 60)}:{String(videoTimeRemaining % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-sm sm:text-lg">{username} <span className="opacity-70">({userRole})</span></h2>
          <button
            onClick={handleEndCall}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm sm:text-base"
            aria-label="End Call"
            title="End Call"
          >
            End Call
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 overflow-hidden" ref={videoContainerRef}>
        {/* Video Area */}
        <section className="flex-1 p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 overflow-y-auto">
          {/* Video Grid */}
          <div className={`grid gap-2 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Local */}
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${viewMode === 'local-full' ? 'h-[60vh] sm:h-[80vh]' : viewMode === 'remote-full' ? 'hidden' : 'h-40 sm:h-80'}`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full bg-gray-800 object-cover"
                aria-label="Your video"
              />
              <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/60 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs">
                You ({username})
              </div>
              {/* Audio-Only Mode Indicator */}
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                  <div className="text-center">
                    <div className="text-5xl sm:text-7xl mb-2">🎙️</div>
                    <p className="text-sm sm:text-base font-semibold">Audio Only</p>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      {!isVideoEnabled 
                        ? 'Click camera button to enable video' 
                        : 'Saving bandwidth'
                      }
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={makeLocalFullScreen}
                className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 sm:p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                title="Focus on self"
                aria-label="Focus on self video"
              >
                <Icon.Full />
              </button>
              {viewMode !== 'grid' && (
                <button
                  onClick={resetViewMode}
                  className="absolute top-1 sm:top-2 left-1 sm:left-2 p-1 sm:p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                  title="Exit Focus"
                  aria-label="Exit focus mode"
                >
                  <Icon.Full on />
                </button>
              )}
            </div>

            {/* Remote */}
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${viewMode === 'remote-full' ? 'h-[60vh] sm:h-[80vh]' : viewMode === 'local-full' ? 'hidden' : 'h-40 sm:h-80'}`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full bg-gray-800 object-cover"
                aria-label="Partner video"
              />
              <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/60 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs">
                Partner
              </div>
              <button
                onClick={makeRemoteFullScreen}
                className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 sm:p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                title="Focus on partner"
                aria-label="Focus on partner video"
              >
                <Icon.Full />
              </button>
              {viewMode !== 'grid' && (
                <button
                  onClick={resetViewMode}
                  className="absolute top-1 sm:top-2 left-1 sm:left-2 p-1 sm:p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                  title="Exit Focus"
                  aria-label="Exit focus mode"
                >
                  <Icon.Full on />
                </button>
              )}
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-6 sm:h-9 w-6 sm:w-9 border-t-2 border-white mx-auto mb-2 sm:mb-3"></div>
                    <p className="text-xs sm:text-base">Waiting for partner...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shared image panel (below, so both videos stay visible) */}
          {sharedImage && (
            <div className="mt-2 sm:mt-3 w-full bg-gray-900 rounded-xl p-2 sm:p-3">
              <div className="relative w-full h-44 sm:h-60 md:h-72 lg:h-80">
                <img
                  src={sharedImage}
                  alt="Shared question"
                  className="w-full h-full object-contain bg-gray-800 rounded-lg"
                />
                <a
                  href={sharedImage}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-xs sm:text-sm"
                  title="Download image"
                  aria-label="Download shared image"
                >
                  Download
                </a>
                {userRole === 'tutor' && (
                  <button
                    onClick={removeSharedImage}
                    className="absolute top-2 right-2 p-1 sm:p-2 bg-red-600 hover:bg-red-700 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                    title="Remove shared image"
                    aria-label="Remove shared image"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Screen Share */}
          {isScreenSharing && (
            <div className="mt-2">
              <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Screen Share</h3>
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-40 sm:h-80 bg-gray-800 object-cover"
                  aria-label="Shared screen"
                />
                {isAnnotationsEnabled && (
                  <canvas
                    ref={annotationCanvasRef}
                    onMouseDown={(e) => startDrawing(e, true)}
                    onMouseMove={(e) => draw(e, true)}
                    onMouseUp={() => stopDrawing(true)}
                    onMouseLeave={() => stopDrawing(true)}
                    onTouchStart={(e) => startDrawing(e, true)}
                    onTouchMove={(e) => draw(e, true)}
                    onTouchEnd={() => stopDrawing(true)}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    style={{ touchAction: 'none', pointerEvents: isAnnotationsEnabled ? 'auto' : 'none' }}
                    aria-label="Screen annotations canvas"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1 sm:mt-2">
                <button
                  onClick={toggleAnnotations}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm ${isAnnotationsEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  aria-pressed={isAnnotationsEnabled}
                  title={isAnnotationsEnabled ? 'Disable annotations' : 'Enable annotations'}
                >
                  {isAnnotationsEnabled ? 'Disable Annotations' : 'Enable Annotations'}
                </button>
                {isAnnotationsEnabled && (
                  <button
                    onClick={() => clearWhiteboard(true)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm bg-red-600 hover:bg-red-700"
                    title="Clear annotations"
                  >
                    Clear Annotations
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Whiteboard */}
          {showWhiteboard && (
            <div className="mt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 sm:mb-2 gap-2">
                <h3 className="text-sm sm:text-lg font-semibold">Whiteboard</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={currentPageNumber}
                    onChange={(e) => switchPage(Number(e.target.value))}
                    className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-700 rounded-md text-xs focus:outline-none"
                    aria-label="Select page"
                  >
                    {pages.map(p => (
                      <option key={p.number} value={p.number}>
                        Page {p.number}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addPage}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                    title="Add new page"
                  >
                    + Add Page
                  </button>
                  <label className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs opacity-80">Color</span>
                    <input
                      type="color"
                      value={drawingColor}
                      onChange={(e) => setDrawingColor(e.target.value)}
                      className="w-6 sm:w-8 h-6 sm:h-8 rounded-md border cursor-pointer"
                      title="Choose color"
                      aria-label="Choose pen color"
                    />
                  </label>
                  <label className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs opacity-80">Size</span>
                    <select
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-700 rounded-md text-xs focus:outline-none"
                      aria-label="Brush size"
                    >
                      {[1,3,5,10,20].map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs opacity-80">Tool</span>
                    <select
                      value={drawingTool}
                      onChange={(e) => setDrawingTool(e.target.value)}
                      className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-700 rounded-md text-xs focus:outline-none"
                      aria-label="Drawing tool"
                    >
                      <option value="pen">Pen</option>
                      <option value="highlighter">Highlighter</option>
                      <option value="eraser">Eraser</option>
                    </select>
                  </label>
                  <button
                    onClick={() => clearWhiteboard()}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm bg-red-600 hover:bg-red-700"
                    title="Clear page"
                  >
                    Clear Page
                  </button>
                </div>
              </div>
              <div ref={whiteboardContainerRef} className="overflow-auto w-full h-[200px] sm:h-[400px] bg-white border-2 border-gray-700 rounded-xl shadow-lg">
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => { startDrawing(e); handleErase(e); }}
                  onMouseMove={(e) => draw(e)}
                  onMouseUp={() => stopDrawing()}
                  onMouseLeave={() => stopDrawing()}
                  onTouchStart={(e) => { startDrawing(e); handleErase(e); }}
                  onTouchMove={(e) => draw(e)}
                  onTouchEnd={() => stopDrawing()}
                  className="w-full h-full touch-none"
                  style={{ touchAction: 'none' }}
                  aria-label="Collaborative whiteboard canvas"
                />
              </div>
            </div>
          )}
        </section>

        {/* Chat Sidebar */}
        {showChat && (
          <aside className="w-full sm:w-64 md:w-80 bg-gray-800 p-2 sm:p-4 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm sm:text-lg font-semibold">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="px-1 sm:px-2 py-0.5 sm:py-1 text-gray-300 hover:text-white rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white"
                title="Close chat"
                aria-label="Close chat panel"
              >
                Close
              </button>
            </div>
            <div
              ref={chatContainerRef}
              className="flex-1 bg-gray-700 rounded-lg p-2 sm:p-3 overflow-y-auto text-white text-xs sm:text-sm space-y-2"
              aria-live="polite"
            >
              {messages.map((msg, i) => {
                const mine = msg.sender === username;
                return (
                  <div
                    key={`${i}-${msg.timestamp}`}
                    className={`p-2 rounded-lg max-w-[85%] ${mine ? 'bg-blue-600 ml-auto' : 'bg-gray-600'}`}
                  >
                    <p className="text-xs font-semibold">{msg.sender}</p>
                    <p>{msg.text}</p>
                    <p className="text-[10px] text-gray-200 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-gray-300 text-xs sm:text-sm">No messages yet</div>
              )}
            </div>
            <form className="mt-2 flex" onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-2 sm:px-3 py-1 sm:py-2 bg-gray-600 text-white rounded-l-lg text-xs sm:text-sm focus:outline-none"
                aria-label="Chat message input"
              />
              <button
                type="submit"
                className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors font-semibold text-xs sm:text-sm"
                aria-label="Send message"
                title="Send"
              >
                Send
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* Reactions */}
      <div className="pointer-events-none absolute top-1/4 right-2 flex flex-col gap-2">
        {reactions.map((r, idx) => (
          <div
            key={`${r.username}-${r.timestamp}-${idx}`}
            className="pointer-events-auto bg-gray-800/90 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full animate-bounce text-xs sm:text-base"
            role="status"
          >
            {r.type} {r.username}
          </div>
        ))}
      </div>

      {/* Controls */}
      <footer className="flex flex-wrap justify-center gap-1 sm:gap-2 p-1 sm:p-2 bg-gray-800 shadow-md">
        <button
          onClick={toggleMute}
          className={`p-1 sm:p-2 rounded-full transition-colors ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
          aria-label="Toggle microphone"
        >
          <Icon.Mic off={isMuted} />
        </button>
        <button
          onClick={toggleVideo}
          className={`p-1 sm:p-2 rounded-full transition-colors relative ${
            isVideoOff 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          title={isVideoOff ? '📹 Enable Video (Audio-only mode saves bandwidth)' : '📹 Disable Video (Keep audio running)'}
          aria-pressed={!isVideoOff}
          aria-label={isVideoOff ? 'Enable video' : 'Disable video'}
        >
          <Icon.Cam off={isVideoOff} />
          {isVideoOff && !isVideoEnabled && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" title="Video not enabled yet"></span>
          )}
        </button>
        <button
          onClick={switchCamera}
          className="p-1 sm:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          title="Switch camera"
          aria-label="Switch camera"
        >
          <Icon.Switch />
        </button>
        <div className="relative">
          <button
            onClick={toggleSpeaker}
            className={`p-1 sm:p-2 rounded-full transition-colors ${isSpeakerOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'}`}
            title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            aria-pressed={!isSpeakerOn}
            aria-label="Toggle speaker output"
          >
            <Icon.Speaker off={!isSpeakerOn} />
          </button>
          {audioDevices.length > 0 && (
            <button
              onClick={() => { /* device menu placeholder */ }} // Close image picker if open
              className="ml-0.5 sm:ml-1 p-1 sm:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Choose speaker device"
              aria-expanded={false}
              aria-label="Open speaker device menu"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={toggleScreenShare}
          className={`p-1 sm:p-2 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          aria-pressed={isScreenSharing}
          aria-label="Toggle screen sharing"
        >
          <Icon.Share />
        </button>
        <button
          onClick={toggleRecording}
          className={`p-1 sm:p-2 rounded-full transition-colors ${isRecording ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          aria-pressed={isRecording}
          aria-label="Toggle recording"
        >
          <Icon.Record />
        </button>
        <button
          onClick={toggleWhiteboard}
          className={`p-1 sm:p-2 rounded-full transition-colors ${showWhiteboard ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
          aria-pressed={showWhiteboard}
          aria-label="Toggle whiteboard"
        >
          <Icon.Board />
        </button>
        <button
          onClick={() => setShowChat(prev => !prev)}
          className={`p-1 sm:p-2 rounded-full transition-colors ${showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={showChat ? 'Hide chat' : 'Show chat'}
          aria-pressed={showChat}
          aria-label="Toggle chat"
        >
          <Icon.Chat />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(prev => !prev)}
            className="p-1 sm:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Send reaction"
            aria-expanded={showReactionsMenu}
            aria-label="Open reactions"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M12 17a4 4 0 0 1-4-4M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
          {showReactionsMenu && (
            <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-md p-1 sm:p-2 flex flex-row gap-1 sm:gap-2 z-[1000] shadow-lg">
              {['😊', '👍', '👏', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="p-1 rounded hover:bg-gray-700 text-sm sm:text-lg transition-colors"
                  aria-label={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => toggleBackground(virtualBackground === 'blur' ? 'none' : 'blur')}
          className={`p-1 sm:p-2 rounded-full transition-colors ${virtualBackground !== 'none' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={virtualBackground !== 'none' ? 'Remove background blur' : 'Apply background blur'}
          aria-pressed={virtualBackground !== 'none'}
          aria-label="Toggle background blur"
        >
          <Icon.Blur />
        </button>
        <button
          onClick={toggleFullScreen}
          className={`p-1 sm:p-2 rounded-full transition-colors ${isFullScreen ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
          aria-pressed={isFullScreen}
          aria-label="Toggle fullscreen"
        >
          <Icon.Full on={isFullScreen} />
        </button>
        {userRole === 'tutor' && (
          <div className="relative">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1 sm:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Add question image"
              aria-label="Add question image"
            >
              <Icon.Question />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        )}
      </footer>
    </div>
  );
};

export default VideoCall;