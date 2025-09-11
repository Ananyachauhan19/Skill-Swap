import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import socket from '../socket.js';

/**
 * VideoCall (polished)
 * - Speaker device picker in a clean popover
 * - Professional icon set (custom inline SVGs; crisp, consistent strokes)
 * - Two-way chat & whiteboard with auto-open/auto-scroll syncing
 * - Better error handling and track safety
 * - End Call: red-only button, no “X” icon
 * - Slight a11y lift: ARIA labels, titles, keyboard focus rings
 * - Stable refs, controlled states, and defensive guards to reduce bugs
 *
 * NOTE:
 *  - Adds socket events: 'whiteboard-toggle' + 'whiteboard-focus'
 *  - If your server doesn’t relay these yet, just add passthroughs similar to your other events.
 */

const VideoCall = ({ sessionId, onEndCall, userRole, username }) => {
  console.info('[DEBUG] VideoCall: Init session:', sessionId, 'role:', userRole);

  // --- Core connection state
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);

  // --- Media toggles
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  const [virtualBackground, setVirtualBackground] = useState('none'); // 'none' | 'blur'

  // --- Whiteboard / annotations
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isAnnotationsEnabled, setIsAnnotationsEnabled] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingTool, setDrawingTool] = useState('pen'); // 'pen' | 'highlighter' | 'eraser'
  const [pages, setPages] = useState([{ number: 1, paths: [] }]);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentPathId, setCurrentPathId] = useState(null);

  // --- Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  // --- Reactions
  const [reactions, setReactions] = useState([]);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);

  // --- Devices
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [showSpeakerPicker, setShowSpeakerPicker] = useState(false);

  // --- Layout / view
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'remote-full' | 'local-full'

  // --- Timer / coins
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [silverCoins, setSilverCoins] = useState(null);

  // --- Internal refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  // Whiteboard refs
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const whiteboardContainerRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const annotationContextRef = useRef(null);
  const isRemoteScrolling = useRef(false);

  // Chat container ref
  const chatContainerRef = useRef(null);

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
        // Request cam/mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isCameraSwitched ? 'environment' : 'user' },
          audio: true,
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

        // Join room and wire listeners
        socket.emit('join-session', { sessionId, userRole, username });
        console.info('[DEBUG] Joined session room:', sessionId);

        const onUserJoined = async () => {
          const pc = createPeerConnection();
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { sessionId, offer });
            setIsInitiator(true);
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
          // Auto-clear after 5s
          setTimeout(() => {
            setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 5000));
          }, 5000);
        };

        const onHoldStatus = (data) => {
          // Keep your existing semantics; safeguarding here
          if (data.username !== username) {
            const newStream = data.isOnHold ? null : localStreamRef.current;
            setRemoteStream(newStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = newStream;
            }
          }
        };

        const onCoinUpdate = ({ silverCoins }) => {
          setSilverCoins(Number(silverCoins ?? 0));
        };

        // Whiteboard sync events
        const onWhiteboardToggle = ({ open }) => {
          setShowWhiteboard(Boolean(open));
          // Give React time to render before focusing/scrolling
          setTimeout(() => {
            if (open && canvasRef.current) smoothScrollIntoView(canvasRef.current);
          }, 80);
        };
        const onWhiteboardFocus = () => {
          setTimeout(() => {
            if (canvasRef.current) smoothScrollIntoView(canvasRef.current);
          }, 60);
        };

        // Whiteboard scroll sync
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

        // New whiteboard events
        const handleRemoteStartPath = (data) => {
          const { pageNumber, pathId, tool, color, size, x, y } = data;
          setPages(prev => prev.map(p => {
            if (p.number !== pageNumber) return p;
            return { ...p, paths: [...p.paths, { id: pathId, tool, color, size, points: [{ x, y }] }] };
          }));
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
        };

        const handleRemoteRemovePath = (data) => {
          const { pageNumber, pathId } = data;
          setPages(prev => prev.map(p => {
            if (p.number !== pageNumber) return p;
            return { ...p, paths: p.paths.filter(path => path.id !== pathId) };
          }));
        };

        const handleRemoteClearPage = (data) => {
          const { pageNumber } = data;
          setPages(prev => prev.map(p => p.number !== pageNumber ? p : { ...p, paths: [] }));
        };

        const handleRemoteAddPage = (data) => {
          const { pageNumber } = data;
          setPages(prev => {
            if (prev.some(p => p.number === pageNumber)) return prev;
            return [...prev, { number: pageNumber, paths: [] }];
          });
          setCurrentPageNumber(pageNumber);
        };

        const handleRemoteSwitchPage = (data) => {
          const { pageNumber } = data;
          setCurrentPageNumber(pageNumber);
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

        socket.on('end-call', ({ sessionId: endedSessionId }) => {
          if (endedSessionId === sessionId) handleEndCall();
        });

        socket.on('annotation-draw', handleRemoteDraw); // Keep for annotations if separate
        socket.on('annotation-clear', handleRemoteClear); // Assuming separate for annotations

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

  // Simple virtual background option (blur)
  useEffect(() => {
    if (!localVideoRef.current) return;
    localVideoRef.current.style.filter = virtualBackground === 'blur' ? 'blur(5px)' : 'none';
  }, [virtualBackground]);

  // Initialize (or refresh) whiteboard canvas when shown or settings change
  useEffect(() => {
    if (!showWhiteboard || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set large canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

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

  // === Peer connection helper
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
        // Apply sink choice if supported
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

  // === Utilities

  const applySinkId = async (videoEl, sinkId) => {
    if (!videoEl) return;
    // setSinkId is only for audio elements / media elements in supporting browsers
    const canSet = typeof videoEl.setSinkId === 'function';
    if (!canSet || !sinkId) return;
    try {
      await videoEl.setSinkId(sinkId);
      localStorage.setItem('preferredSinkId', sinkId);
    } catch (err) {
      console.warn('[DEBUG] setSinkId failed:', err);
    }
  };

  const cleanup = () => {
    try {
      // Stop local tracks
      localStreamRef.current?.getTracks()?.forEach(t => t.stop());
      screenStream?.getTracks()?.forEach(t => t.stop());

      // Stop recorder
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      // Close PC
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch {}
        peerConnectionRef.current = null;
      }

      socket.emit('leave-session', { sessionId });

      // Exit fullscreen if any
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch {}
      }
    } catch (e) {
      console.warn('[DEBUG] cleanup issue:', e);
    }
  };

  // === Whiteboard drawing handlers

  const getCanvasCoords = (e, ref, containerRef = null) => {
    const canvas = ref.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    const scrollX = containerRef?.current?.scrollLeft || 0;
    const scrollY = containerRef?.current?.scrollTop || 0;
    return { x: clientX - rect.left + scrollX, y: clientY - rect.top + scrollY };
  };

  const startDrawing = (e, isAnnotation = false) => {
    if (isAnnotation) {
      // Handle annotation start
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

    // Whiteboard vector start
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

    if (isAnnotation) {
      // Handle annotation draw
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
        fromX: null, // No last point tracking for annotation
        fromY: null,
        toX: x,
        toY: y,
        color: drawingTool === 'eraser' ? 'erase' : drawingColor,
        size: brushSize,
        tool: drawingTool,
      });
      return;
    }

    // Whiteboard vector draw
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
  };

  const stopDrawing = (isAnnotation = false) => {
    setIsDrawing(false);
    if (!isAnnotation) setCurrentPathId(null);
  };

  const handleErase = (e) => {
    if (drawingTool !== 'eraser') return;
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
    }
  };

  const handleRemoteDraw = (data) => {
    // Keep for annotations
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
    // For annotations
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
    // Clear current page for whiteboard
    updatePaths(() => []);
    socket.emit('whiteboard-clear-page', { sessionId, pageNumber: currentPageNumber });
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

  // === Chat
  const sendMessage = (e) => {
    e.preventDefault();
    const msg = (newMessage || '').trim();
    if (!msg) return;
    socket.emit('chat-message', { sessionId, message: msg, username });
    setMessages(prev => [...prev, { sender: username, text: msg, timestamp: new Date() }]);
    setNewMessage('');
  };

  // === Reactions
  const sendReaction = (type) => {
    socket.emit('reaction', { sessionId, type, username });
    setReactions(prev => [...prev, { type, username, timestamp: Date.now() }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 5000));
    }, 5000);
    setShowReactionsMenu(false);
  };

  // === Call controls

  const handleEndCall = () => {
    socket.emit('end-call', { sessionId });
    cleanup();
    setCallStartTime(null);
    setElapsedSeconds(0);
    onEndCall && onEndCall();
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOff(!videoTrack.enabled);
  };

  const switchCamera = async () => {
    try {
      setIsCameraSwitched(prev => !prev);
      // Stop current tracks (safe guard)
      localStreamRef.current?.getTracks?.().forEach(t => t.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: !isCameraSwitched ? 'environment' : 'user' },
        audio: true,
      });
      setLocalStream(newStream);
      localStreamRef.current = newStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;

      // Replace video sender track
      const videoTrack = newStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        ?.find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    } catch (err) {
      console.error('[DEBUG] switchCamera error:', err);
    }
  };

  const toggleSpeaker = async () => {
    const newOn = !isSpeakerOn;
    setIsSpeakerOn(newOn);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !newOn;
    }
  };

  const changeAudioDevice = async (deviceId) => {
    setSelectedAudioDevice(deviceId);
    if (remoteVideoRef.current) {
      await applySinkId(remoteVideoRef.current, deviceId);
    }
    localStorage.setItem('preferredSinkId', deviceId);
    setShowSpeakerPicker(false);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        // Replace outbound video
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          ?.find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        // Auto stop when user ends share
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

      // Restore local camera track
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
      } catch {}
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

  // Whiteboard sync toggles
  const toggleWhiteboard = () => {
    const next = !showWhiteboard;
    setShowWhiteboard(next);
    socket.emit('whiteboard-toggle', { sessionId, open: next });
    if (next) {
      // Ask partner to focus/scroll too (and us)
      setTimeout(() => {
        smoothScrollIntoView(canvasRef.current);
        socket.emit('whiteboard-focus', { sessionId });
      }, 60);
    }
  };

  // --- UI Icons (simple + consistent)
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
      // professional screen-share icon
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
    )
  };

  // --- Render
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-800 shadow-md">
        <div className="text-lg font-semibold mb-2 sm:mb-0">
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
            <span className="ml-4" title="Your current coins">Coins: {silverCoins.toFixed(2)}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg">{username} <span className="opacity-70">({userRole})</span></h2>
          {/* End Call: red only, no cross icon */}
          <button
            onClick={handleEndCall}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
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
        <section className="flex-1 p-2 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto">
          {/* Video Grid */}
          <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Local */}
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${viewMode === 'local-full' ? 'h-[80vh]' : viewMode === 'remote-full' ? 'hidden' : 'h-48 sm:h-96'}`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full bg-gray-800 object-cover"
                aria-label="Your video"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md text-xs sm:text-sm">
                You ({username})
              </div>
              <button
                onClick={makeLocalFullScreen}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                title="Focus on self"
                aria-label="Focus on self video"
              >
                <Icon.Full />
              </button>
              {viewMode !== 'grid' && (
                <button
                  onClick={resetViewMode}
                  className="absolute top-2 left-2 p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                  title="Exit Focus"
                  aria-label="Exit focus mode"
                >
                  <Icon.Full on />
                </button>
              )}
            </div>

            {/* Remote */}
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${viewMode === 'remote-full' ? 'h-[80vh]' : viewMode === 'local-full' ? 'hidden' : 'h-48 sm:h-96'}`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full bg-gray-800 object-cover"
                aria-label="Partner video"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md text-xs sm:text-sm">
                Partner
              </div>
              <button
                onClick={makeRemoteFullScreen}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                title="Focus on partner"
                aria-label="Focus on partner video"
              >
                <Icon.Full />
              </button>
              {viewMode !== 'grid' && (
                <button
                  onClick={resetViewMode}
                  className="absolute top-2 left-2 p-2 bg-black/50 hover:bg-black/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                  title="Exit Focus"
                  aria-label="Exit focus mode"
                >
                  <Icon.Full on />
                </button>
              )}

              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-white mx-auto mb-3"></div>
                    <p className="text-sm sm:text-base">Waiting for partner...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Screen Share */}
          {isScreenSharing && (
            <div className="mt-2 sm:mt-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Screen Share</h3>
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 sm:h-96 bg-gray-800 object-cover"
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
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={toggleAnnotations}
                  className={`px-3 py-1.5 rounded-md text-sm ${isAnnotationsEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  aria-pressed={isAnnotationsEnabled}
                  title={isAnnotationsEnabled ? 'Disable annotations' : 'Enable annotations'}
                >
                  {isAnnotationsEnabled ? 'Disable Annotations' : 'Enable Annotations'}
                </button>
                {isAnnotationsEnabled && (
                  <button
                    onClick={() => clearWhiteboard(true)}
                    className="px-3 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700"
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
            <div className="mt-2 sm:mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Whiteboard</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <select
                    value={currentPageNumber}
                    onChange={(e) => switchPage(Number(e.target.value))}
                    className="px-2 py-1 bg-gray-700 rounded-md text-xs sm:text-sm focus:outline-none"
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
                    className="px-3 py-1.5 rounded-md text-sm bg-green-600 hover:bg-green-700"
                    title="Add new page"
                  >
                    + Add Page
                  </button>
                  <label className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm opacity-80">Color</span>
                    <input
                      type="color"
                      value={drawingColor}
                      onChange={(e) => setDrawingColor(e.target.value)}
                      className="w-8 h-8 rounded-md border cursor-pointer"
                      title="Choose color"
                      aria-label="Choose pen color"
                    />
                  </label>

                  <label className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm opacity-80">Size</span>
                    <select
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="px-2 py-1 bg-gray-700 rounded-md text-xs sm:text-sm focus:outline-none"
                      aria-label="Brush size"
                    >
                      {[1,3,5,10,20].map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>
                  </label>

                  <label className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm opacity-80">Tool</span>
                    <select
                      value={drawingTool}
                      onChange={(e) => setDrawingTool(e.target.value)}
                      className="px-2 py-1 bg-gray-700 rounded-md text-xs sm:text-sm focus:outline-none"
                      aria-label="Drawing tool"
                    >
                      <option value="pen">Pen</option>
                      <option value="highlighter">Highlighter</option>
                      <option value="eraser">Eraser</option>
                    </select>
                  </label>
                  <button
                    onClick={() => clearWhiteboard()}
                    className="px-3 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700"
                    title="Clear page"
                  >
                    Clear Page
                  </button>
                </div>
              </div>
              <div ref={whiteboardContainerRef} className="overflow-auto w-full h-[300px] sm:h-[500px] bg-white border-2 border-gray-700 rounded-xl shadow-lg">
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => { startDrawing(e); handleErase(e); }}
                  onMouseMove={(e) => draw(e)}
                  onMouseUp={() => stopDrawing()}
                  onMouseLeave={() => stopDrawing()}
                  onTouchStart={(e) => { startDrawing(e); handleErase(e); }}
                  onTouchMove={(e) => draw(e)}
                  onTouchEnd={() => stopDrawing()}
                  className="cursor-crosshair"
                  style={{ touchAction: 'none' }}
                  aria-label="Collaborative whiteboard canvas"
                />
              </div>
            </div>
          )}
        </section>

        {/* Chat Sidebar */}
        {showChat && (
          <aside className="w-full sm:w-80 md:w-96 bg-gray-800 p-4 sm:p-6 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base sm:text-lg font-semibold">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="px-2 py-1 text-gray-300 hover:text-white rounded focus:outline-none focus:ring-2 focus:ring-white"
                title="Close chat"
                aria-label="Close chat panel"
              >
                Close
              </button>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 bg-gray-700 rounded-lg p-3 overflow-y-auto text-white text-sm sm:text-base space-y-2"
              aria-live="polite"
            >
              {messages.map((msg, i) => {
                const mine = msg.sender === username;
                return (
                  <div
                    key={`${i}-${msg.timestamp}`}
                    className={`p-2 sm:p-3 rounded-lg max-w-[85%] ${mine ? 'bg-blue-600 ml-auto' : 'bg-gray-600'}`}
                  >
                    <p className="text-xs sm:text-sm font-semibold">{msg.sender}</p>
                    <p>{msg.text}</p>
                    <p className="text-[10px] text-gray-200 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-gray-300 text-sm">No messages yet</div>
              )}
            </div>

            <form className="mt-3 flex" onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-l-lg focus:outline-none"
                aria-label="Chat message input"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors font-semibold"
                aria-label="Send message"
                title="Send"
              >
                Send
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* Reactions (float) */}
      <div className="pointer-events-none absolute top-1/4 right-2 sm:right-10 flex flex-col gap-2">
        {reactions.map((r, idx) => (
          <div
            key={`${r.username}-${r.timestamp}-${idx}`}
            className="pointer-events-auto bg-gray-800/90 text-white px-2 py-1 rounded-full animate-bounce text-sm sm:text-base"
            role="status"
          >
            {r.type} {r.username}
          </div>
        ))}
      </div>

      {/* Controls */}
      <footer className="flex flex-wrap justify-center gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-800 shadow-md">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className={`p-2 sm:p-3 rounded-full transition-colors ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
          aria-label="Toggle microphone"
        >
          <Icon.Mic off={isMuted} />
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          className={`p-2 sm:p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          aria-pressed={isVideoOff}
          aria-label="Toggle camera"
        >
          <Icon.Cam off={isVideoOff} />
        </button>

        {/* Switch Camera */}
        <button
          onClick={switchCamera}
          className="p-2 sm:p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          title="Switch camera"
          aria-label="Switch camera"
        >
          <Icon.Switch />
        </button>

        {/* Speaker (with neat popover) */}
        <div className="relative">
          <button
            onClick={toggleSpeaker}
            className={`p-2 sm:p-3 rounded-full transition-colors ${isSpeakerOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'}`}
            title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            aria-pressed={!isSpeakerOn}
            aria-label="Toggle speaker output"
          >
            <Icon.Speaker off={!isSpeakerOn} />
          </button>

          {/* Speaker device picker trigger */}
          {audioDevices.length > 0 && (
            <button
              onClick={() => setShowSpeakerPicker(prev => !prev)}
              className="ml-1 p-2 sm:p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Choose speaker device"
              aria-expanded={showSpeakerPicker}
              aria-label="Open speaker device menu"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          )}

          {/* Popover */}
          {showSpeakerPicker && (
            <div className="absolute left-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 p-2">
              <p className="px-2 py-1 text-xs text-gray-300">Select speaker</p>
              <div className="max-h-56 overflow-auto mt-1">
                {audioDevices.map((d) => (
                  <button
                    key={d.deviceId}
                    onClick={() => changeAudioDevice(d.deviceId)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 ${selectedAudioDevice === d.deviceId ? 'bg-gray-700' : ''}`}
                    title={d.label || 'Speaker'}
                  >
                    {d.label || `Speaker ${d.deviceId.slice(0, 4)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Screen Share (new icon) */}
        <button
          onClick={toggleScreenShare}
          className={`p-2 sm:p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          aria-pressed={isScreenSharing}
          aria-label="Toggle screen sharing"
        >
          <Icon.Share />
        </button>

        {/* Recording */}
        <button
          onClick={toggleRecording}
          className={`p-2 sm:p-3 rounded-full transition-colors ${isRecording ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          aria-pressed={isRecording}
          aria-label="Toggle recording"
        >
          <Icon.Record />
        </button>

        {/* Whiteboard (two-way + auto-scroll) */}
        <button
          onClick={toggleWhiteboard}
          className={`p-2 sm:p-3 rounded-full transition-colors ${showWhiteboard ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
          aria-pressed={showWhiteboard}
          aria-label="Toggle whiteboard"
        >
          <Icon.Board />
        </button>

        {/* Chat */}
        <button
          onClick={() => setShowChat(prev => !prev)}
          className={`p-2 sm:p-3 rounded-full transition-colors ${showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={showChat ? 'Hide chat' : 'Show chat'}
          aria-pressed={showChat}
          aria-label="Toggle chat"
        >
          <Icon.Chat />
        </button>

        {/* Reactions */}
        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(prev => !prev)}
            className="p-2 sm:p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
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
            <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-md p-2 sm:p-3 flex flex-row gap-2 z-[1000] shadow-lg">
              {['😊', '👍', '👏', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="p-1 sm:p-2 rounded hover:bg-gray-700 text-base sm:text-lg transition-colors"
                  aria-label={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Background blur */}
        <button
          onClick={() => toggleBackground(virtualBackground === 'blur' ? 'none' : 'blur')}
          className={`p-2 sm:p-3 rounded-full transition-colors ${virtualBackground !== 'none' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={virtualBackground !== 'none' ? 'Remove background blur' : 'Apply background blur'}
          aria-pressed={virtualBackground !== 'none'}
          aria-label="Toggle background blur"
        >
          <Icon.Blur />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullScreen}
          className={`p-2 sm:p-3 rounded-full transition-colors ${isFullScreen ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
          aria-pressed={isFullScreen}
          aria-label="Toggle fullscreen"
        >
          <Icon.Full on={isFullScreen} />
        </button>
      </footer>

      {/* Session Info */}
      <div className="p-2 sm:p-3 text-center text-gray-400 text-xs sm:text-sm">
        <p>Your Role: {userRole}</p>
        <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
        {remoteStream && <p className="text-green-400">Partner Connected!</p>}
        {showWhiteboard && <p className="text-blue-400">Whiteboard Active — drawing sync is on.</p>}
      </div>
    </div>
  );
};

export default VideoCall;