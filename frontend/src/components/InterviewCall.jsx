import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import socket from '../socket.js';
import InterviewSessionRatingModal from '../user/interviewSection/InterviewSessionRatingModal.jsx';
import { BACKEND_URL } from '../config.js';

const InterviewCall = ({ sessionId, userRole = 'participant', username = 'You', onEnd }) => {
  console.info('[DEBUG] InterviewCall: Init session:', sessionId, 'role:', userRole);

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

  // AV controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);

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

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewData, setInterviewData] = useState(null);
  const [isWaitingForCompletion, setIsWaitingForCompletion] = useState(false);
  
  // Fullscreen permission and notification state
  const [showFullscreenPermission, setShowFullscreenPermission] = useState(true);
  const [showFullscreenNotification, setShowFullscreenNotification] = useState(false);
  const hasEndedRef = useRef(false);
  const completionTimeoutRef = useRef(null);
  const fullscreenAttemptedRef = useRef(false);

  // Constants for whiteboard
  const CANVAS_WIDTH = 2000;
  const CANVAS_HEIGHT = 1500;

  // Smooth scroll helper
  const smoothScrollIntoView = (el) => {
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { el.scrollIntoView(); }
  };

  // Current page memo
  const currentPage = useMemo(() => pages.find(p => p.number === currentPageNumber) || pages[0], [pages, currentPageNumber]);

  const updatePaths = useCallback((updater) => {
    setPages(prev => prev.map(p => {
      if (p.number !== currentPageNumber) return p;
      const newPaths = updater(p.paths);
      return { ...p, paths: newPaths };
    }));
  }, [currentPageNumber]);

  const pointToSegmentDistance = (p, a, b) => {
    const dx = b.x - a.x; const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const tClamped = Math.max(0, Math.min(1, t));
    const projX = a.x + tClamped * dx; const projY = a.y + tClamped * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  };

  const getHitPath = (x, y, paths) => {
    let minDist = Infinity; let hitId = null;
    for (let i = paths.length - 1; i >= 0; i--) {
      const path = paths[i];
      for (let j = 1; j < path.points.length; j++) {
        const dist = pointToSegmentDistance({ x, y }, path.points[j - 1], path.points[j]);
        if (dist < Math.max(path.size / 2, 5) + 5) {
          if (dist < minDist) { minDist = dist; hitId = path.id; }
        }
      }
    }
    return hitId;
  };

  const redraw = useCallback(() => {
    const ctx = contextRef.current; if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    (currentPage?.paths || []).forEach(path => {
      if (path.points.length < 1) return;
      ctx.strokeStyle = path.color; ctx.lineWidth = path.size; ctx.globalAlpha = path.tool === 'highlighter' ? 0.5 : 1;
      ctx.beginPath(); ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let k = 1; k < path.points.length; k++) ctx.lineTo(path.points[k].x, path.points[k].y);
      ctx.stroke();
    });
  }, [currentPage]);

  // Fullscreen listeners - NO AUTO-ENTER, wait for user permission
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullScreen(isNowFullscreen);
      
      // Show notification when entering fullscreen
      if (isNowFullscreen) {
        setShowFullscreenNotification(true);
        setTimeout(() => setShowFullscreenNotification(false), 5000);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Function to enter fullscreen
  const enterFullscreen = async () => {
    if (fullscreenAttemptedRef.current) return;
    fullscreenAttemptedRef.current = true;
    
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      console.log('[FULLSCREEN] Entered fullscreen mode');
      setShowFullscreenPermission(false);
    } catch (err) {
      console.error('[FULLSCREEN] Failed to enter fullscreen:', err);
      fullscreenAttemptedRef.current = false;
      // Show error message
      alert('Unable to enter fullscreen mode. Please try clicking the fullscreen button in the controls.');
    }
  };

  // Initial media + socket setup
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isCameraSwitched ? 'environment' : 'user' }, audio: true });
        if (!mounted) return;
        setLocalStream(stream); localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput'); setAudioDevices(audioOutputs);
        const savedSinkId = localStorage.getItem('preferredSinkId');
        const defaultSink = savedSinkId && audioOutputs.find(d => d.deviceId === savedSinkId) ? savedSinkId : (audioOutputs[0]?.deviceId || '');
        setSelectedAudioDevice(defaultSink);

        const onSharedImage = (data) => { if (data && data.imageUrl) setSharedImage(data.imageUrl); };
        const onRemoveImage = () => setSharedImage(null);

        // For interview calls we rely on the server's
        // `interview-ready` event to coordinate offer/answer.
        // Only the interviewer creates the offer; the student waits
        // for the offer and answers.
        const onInterviewReady = async (payload) => {
          console.log('[INTERVIEW] interview-ready received', payload);
          try {
            if (userRole === 'interviewer') {
              const pc = createPeerConnection();
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              console.log('[INTERVIEW] emitting offer to sessionId:', sessionId);
              socket.emit('offer', { sessionId, offer });
            } else {
              // Student: just ensure the peer connection exists and
              // wait for the interviewer offer.
              if (!peerConnectionRef.current) {
                createPeerConnection();
              }
            }
          } catch (err) {
            console.error('[INTERVIEW] onInterviewReady error', err);
          }
        };

        const onOffer = async (data) => {
          console.log('[INTERVIEW] offer received', !!data?.offer);
          try {
            const pc = peerConnectionRef.current || createPeerConnection();
            console.log('[INTERVIEW] pc signalingState before setRemoteDescription:', pc.signalingState);
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            // If we were in the middle of local offer (glare), createAnswer will resolve
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('[INTERVIEW] emitting answer');
            socket.emit('answer', { sessionId, answer });
          } catch (err) { console.error('[INTERVIEW] onOffer error', err); }
        };

        const onAnswer = async (data) => {
          console.log('[INTERVIEW] answer received');
          try {
            await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('[INTERVIEW] Connection established!');
            setIsConnected(true);
            // If remote stream already attached via ontrack, callStartTime will be set there; otherwise rely on remoteStream state
            if (remoteStream && !callStartTime) { setCallStartTime(Date.now()); setElapsedSeconds(0); }
          } catch (err) { console.error('[signaling] onAnswer error', err); }
        };

        const onIceCandidate = async (data) => { try { if (data?.candidate) { console.debug('[signaling] adding remote ICE candidate'); await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate)); } } catch (err) { console.error('[signaling] onIceCandidate error', err); } };

        const onUserLeft = () => { setRemoteStream(null); if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; } setCallStartTime(null); setElapsedSeconds(0); setSharedImage(null); };

        const onChat = (data) => { setMessages(prev => [...prev, { sender: data.username || 'Partner', text: data.message, timestamp: new Date() }]); };

        const onReaction = (data) => { setReactions(prev => [...prev, { type: data.type, username: data.username, timestamp: Date.now() }]); setTimeout(() => { setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 5000)); }, 5000); };

        const onHoldStatus = (data) => { if (data.username !== username) { const newStream = data.isOnHold ? null : localStreamRef.current; setRemoteStream(newStream); if (remoteVideoRef.current) remoteVideoRef.current.srcObject = newStream; } };

        // Whiteboard sync events
        const onWhiteboardToggle = ({ open }) => { setShowWhiteboard(Boolean(open)); if (open) setTimeout(() => { if (canvasRef.current) smoothScrollIntoView(canvasRef.current); }, 80); };
        const onWhiteboardFocus = () => { setTimeout(() => { if (canvasRef.current) smoothScrollIntoView(canvasRef.current); }, 60); };

        const onWhiteboardScroll = (data) => { const container = whiteboardContainerRef.current; if (!container) return; const { scrollX, scrollY } = data; if (Math.abs(container.scrollLeft - scrollX) > 1 || Math.abs(container.scrollTop - scrollY) > 1) { isRemoteScrolling.current = true; container.scrollLeft = scrollX; container.scrollTop = scrollY; } };

        const handleRemoteStartPath = (data) => { const { pageNumber, pathId, tool, color, size, x, y } = data; setPages(prev => prev.map(p => p.number !== pageNumber ? p : { ...p, paths: [...p.paths, { id: pathId, tool, color, size, points: [{ x, y }] }] })); redraw(); };
        const handleRemoteAddPoint = (data) => { const { pageNumber, pathId, x, y } = data; setPages(prev => prev.map(p => p.number !== pageNumber ? p : { ...p, paths: p.paths.map(path => path.id !== pathId ? path : { ...path, points: [...path.points, { x, y }] }) })); redraw(); };
        const handleRemoteRemovePath = (data) => { const { pageNumber, pathId } = data; setPages(prev => prev.map(p => p.number !== pageNumber ? p : { ...p, paths: p.paths.filter(path => path.id !== pathId) })); redraw(); };
        const handleRemoteClearPage = (data) => { const { pageNumber } = data; setPages(prev => prev.map(p => p.number !== pageNumber ? p : { ...p, paths: [] })); redraw(); };
        const handleRemoteAddPage = (data) => { const { pageNumber } = data; setPages(prev => { if (prev.some(p => p.number === pageNumber)) return prev; return [...prev, { number: pageNumber, paths: [] }]; }); setCurrentPageNumber(pageNumber); redraw(); };
        const handleRemoteSwitchPage = (data) => { const { pageNumber } = data; setCurrentPageNumber(pageNumber); redraw(); };

        // Register handlers BEFORE joining so we don't miss events when both sides connect
        socket.on('shared-image', onSharedImage);
        socket.on('remove-image', onRemoveImage);

        socket.on('interview-ready', onInterviewReady);
        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('ice-candidate', onIceCandidate);
        socket.on('user-left', onUserLeft);

        socket.on('chat-message', onChat);
        socket.on('reaction', onReaction);
        socket.on('hold-status', onHoldStatus);

        socket.on('whiteboard-toggle', onWhiteboardToggle);
        socket.on('whiteboard-focus', onWhiteboardFocus);
        socket.on('whiteboard-scroll', onWhiteboardScroll);

        socket.on('whiteboard-start-path', handleRemoteStartPath);
        socket.on('whiteboard-add-point', handleRemoteAddPoint);
        socket.on('whiteboard-remove-path', handleRemoteRemovePath);
        socket.on('whiteboard-clear-page', handleRemoteClearPage);
        socket.on('whiteboard-add-page', handleRemoteAddPage);
        socket.on('whiteboard-switch-page', handleRemoteSwitchPage);

        socket.on('end-call', ({ sessionId: endedSessionId }) => { if (endedSessionId === sessionId) handleEndCall(); });
        
        // Listen for interview completion confirmation from server
        socket.on('interview-completed', async ({ sessionId: completedSessionId }) => {
          if (completedSessionId === sessionId && userRole === 'student') {
            console.log('[INTERVIEW] Interview marked as completed, fetching latest data and showing rating modal');
            
            // Clear the fallback timeout since we received the event
            if (completionTimeoutRef.current) {
              clearTimeout(completionTimeoutRef.current);
              completionTimeoutRef.current = null;
            }
            
            setIsWaitingForCompletion(false);
            // Fetch the latest interview data to ensure we have the updated status
            try {
              const res = await fetch(`${BACKEND_URL}/api/interview/requests/${sessionId}`, {
                credentials: 'include'
              });
              if (res.ok) {
                const interview = await res.json();
                setInterviewData(interview);
              }
            } catch (e) {
              console.error('Failed to fetch updated interview data:', e);
            }
            setShowRatingModal(true);
          }
        });

        socket.on('annotation-draw', handleRemoteDraw);
        socket.on('annotation-clear', handleRemoteClear);

        // Now join the interview session (after listeners attached) and request shared image
        console.log('[INTERVIEW] Joining interview session:', sessionId, 'as', userRole, username);
        socket.emit('join-interview-session', { sessionId, userRole, username });
        socket.emit('request-shared-image', { sessionId });

        // Don't set isConnected true here - wait for peer connection
      } catch (error) {
        console.error('[DEBUG] Error accessing media devices:', error);
        alert('Unable to access camera/microphone. Please check permissions.');
      }
    };

    initialize();

    return () => {
      mounted = false;
      console.info('[DEBUG] Cleanup listeners for session:', sessionId);
      
      // Clear completion timeout if exists
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
      
      cleanup();
      localStorage.removeItem('activeSession');

      socket.off('end-call');
      socket.off('interview-ready');
      socket.off('interview-completed');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');

      socket.off('chat-message');
      socket.off('reaction');
      socket.off('hold-status');

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

  useEffect(() => { if (isConnected && localStream && remoteStream && !callStartTime) { setCallStartTime(Date.now()); setElapsedSeconds(0); } }, [isConnected, localStream, remoteStream, callStartTime]);

  useEffect(() => { if (!callStartTime) return; const id = setInterval(() => { setElapsedSeconds(Math.floor((Date.now() - callStartTime) / 1000)); }, 1000); return () => clearInterval(id); }, [callStartTime]);

  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [messages]);

  useEffect(() => { if (!localVideoRef.current) return; localVideoRef.current.style.filter = virtualBackground === 'blur' ? 'blur(5px)' : 'none'; }, [virtualBackground]);

  useEffect(() => { if (!showWhiteboard || !canvasRef.current) return; const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT; canvas.style.width = '100%'; canvas.style.height = '100%'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; contextRef.current = ctx; canvas.style.cursor = drawingTool === 'eraser' ? 'pointer' : 'crosshair'; redraw(); }, [showWhiteboard, drawingTool, redraw]);

  useEffect(() => { if (showWhiteboard) redraw(); }, [pages, currentPageNumber, showWhiteboard, redraw]);

  useEffect(() => { if (!showWhiteboard || !whiteboardContainerRef.current) return; const container = whiteboardContainerRef.current; const handleScroll = () => { if (isRemoteScrolling.current) { isRemoteScrolling.current = false; return; } socket.emit('whiteboard-scroll', { sessionId, scrollX: container.scrollLeft, scrollY: container.scrollTop }); }; container.addEventListener('scroll', handleScroll); return () => container.removeEventListener('scroll', handleScroll); }, [showWhiteboard, sessionId]);

  useEffect(() => { if (!(isScreenSharing && isAnnotationsEnabled && annotationCanvasRef.current && screenVideoRef.current)) return; const canvas = annotationCanvasRef.current; canvas.width = screenVideoRef.current.offsetWidth; canvas.height = screenVideoRef.current.offsetHeight; const ctx = canvas.getContext('2d'); ctx.strokeStyle = drawingTool === 'eraser' ? 'rgba(255,255,255,0)' : drawingColor; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = drawingTool === 'highlighter' ? 0.5 : 1; annotationContextRef.current = ctx; }, [isScreenSharing, isAnnotationsEnabled, drawingColor, brushSize, drawingTool]);

  const createPeerConnection = useCallback(() => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(configuration);
    
    console.log('[INTERVIEW] Creating peer connection, adding local tracks:', localStreamRef.current?.getTracks().length);
    if (localStreamRef.current) { 
      localStreamRef.current.getTracks().forEach(track => { 
        try { 
          console.log('[INTERVIEW] Adding track:', track.kind, track.label);
          pc.addTrack(track, localStreamRef.current); 
        } catch (e) { 
          console.warn('[INTERVIEW] addTrack failed:', e); 
        } 
      }); 
    }
    
    pc.ontrack = (event) => {
      const [stream] = event.streams || [];
      console.log('[INTERVIEW] ontrack event - got remote stream:', !!stream, 'tracks:', stream?.getTracks().length, stream?.getTracks().map(t => t.kind));
      setRemoteStream(stream || null);
      if (remoteVideoRef.current) {
        try { 
          console.log('[INTERVIEW] Setting remote video srcObject');
          remoteVideoRef.current.srcObject = stream || null; 
          applySinkId(remoteVideoRef.current, selectedAudioDevice); 
        } catch (e) { 
          console.warn('[INTERVIEW] set remote srcObject failed', e); 
        }
      }
      // start call timer when we receive a remote track
      if (stream && !callStartTime) { setCallStartTime(Date.now()); setElapsedSeconds(0); }
    };
    
    pc.onicecandidate = (event) => { 
      if (event.candidate) {
        console.log('[INTERVIEW] Sending ICE candidate');
        socket.emit('ice-candidate', { sessionId, candidate: event.candidate }); 
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('[INTERVIEW] ICE connection state:', pc.iceConnectionState);
    };
    
    pc.onconnectionstatechange = () => {
      console.log('[INTERVIEW] Connection state:', pc.connectionState);
    };
    
    peerConnectionRef.current = pc;
    console.log('[INTERVIEW] Peer connection created');
    return pc;
  }, [selectedAudioDevice, sessionId]);

  const applySinkId = async (videoEl, sinkId) => { if (!videoEl || typeof videoEl.setSinkId !== 'function' || !sinkId) return; try { await videoEl.setSinkId(sinkId); localStorage.setItem('preferredSinkId', sinkId); } catch (err) { console.warn('[DEBUG] setSinkId failed:', err); } };

  const handleRatingSubmitted = (data) => {
    console.log('Rating submitted successfully:', data);
    setShowRatingModal(false);
    onEnd && onEnd();
  };

  // Fetch interview details for rating modal
  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/requests/${sessionId}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const interview = await res.json();
          setInterviewData(interview);
          const interviewer = interview.assignedInterviewer;
          if (interviewer) {
            setInterviewerName(`${interviewer.firstName || ''} ${interviewer.lastName || ''}`.trim() || interviewer.username);
          }
        }
      } catch (error) {
        console.error('Failed to fetch interview details:', error);
      }
    };

    if (sessionId && userRole === 'student') {
      fetchInterviewDetails();
    }
  }, [sessionId, userRole]);

  const cleanup = () => {
    try {
      localStreamRef.current?.getTracks()?.forEach(t => t.stop());
      screenStream?.getTracks()?.forEach(t => t.stop());
      if (mediaRecorderRef.current && isRecording) { try { mediaRecorderRef.current.stop(); } catch (e) { console.warn('[DEBUG] recorder stop failed:', e); } }
      if (peerConnectionRef.current) { try { peerConnectionRef.current.close(); } catch (e) { console.warn('[DEBUG] pc close failed:', e); } peerConnectionRef.current = null; }
      socket.emit('leave-session', { sessionId });
      if (sharedImage && typeof sharedImage === 'string' && sharedImage.startsWith('blob:')) { try { URL.revokeObjectURL(sharedImage); } catch { /* noop */ } }
      if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { console.warn('[DEBUG] exitFullscreen failed:', e); } }
    } catch (e) { console.warn('[DEBUG] cleanup issue:', e); }
  };

  const getCanvasCoords = (e, ref, containerRef = null) => {
    const canvas = ref.current; if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect(); const scaleX = CANVAS_WIDTH / rect.width; const scaleY = CANVAS_HEIGHT / rect.height; const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX; const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY; const scrollX = containerRef?.current?.scrollLeft || 0; const scrollY = containerRef?.current?.scrollTop || 0; return { x: (clientX - rect.left) * scaleX + scrollX, y: (clientY - rect.top) * scaleY + scrollY }; };

  const startDrawing = (e, isAnnotation = false) => {
    e.preventDefault();
    if (isAnnotation) {
      const ctxRef = annotationContextRef; const ref = annotationCanvasRef; const containerRef = null; if (!ctxRef.current || !ref.current) return; const { x, y } = getCanvasCoords(e, ref, containerRef); setIsDrawing(true); ctxRef.current.beginPath(); ctxRef.current.moveTo(x, y); socket.emit('annotation-draw', { sessionId, fromX: x, fromY: y, toX: x, toY: y, color: drawingTool === 'eraser' ? 'erase' : drawingColor, size: brushSize, tool: drawingTool, }); return; }
    if (drawingTool === 'eraser') return; const ref = canvasRef; const containerRef = whiteboardContainerRef; if (!contextRef.current || !ref.current) return; const { x, y } = getCanvasCoords(e, ref, containerRef); const pathId = Date.now().toString() + Math.random().toString(36).slice(2); const newPath = { id: pathId, tool: drawingTool, color: drawingColor, size: brushSize, points: [{ x, y }] }; updatePaths(prev => [...prev, newPath]); setCurrentPathId(pathId); setIsDrawing(true); socket.emit('whiteboard-start-path', { sessionId, pageNumber: currentPageNumber, pathId, tool: drawingTool, color: drawingColor, size: brushSize, x, y, });
  };

  const draw = (e, isAnnotation = false) => {
    if (!isDrawing) return; e.preventDefault(); if (isAnnotation) { const ctxRef = annotationContextRef; const ref = annotationCanvasRef; const containerRef = null; if (!ctxRef.current || !ref.current) return; const { x, y } = getCanvasCoords(e, ref, containerRef); ctxRef.current.strokeStyle = drawingTool === 'eraser' ? 'rgba(255,255,255,0)' : drawingColor; ctxRef.current.lineWidth = brushSize; ctxRef.current.globalAlpha = drawingTool === 'highlighter' ? 0.5 : 1; ctxRef.current.lineTo(x, y); ctxRef.current.stroke(); socket.emit('annotation-draw', { sessionId, fromX: null, fromY: null, toX: x, toY: y, color: drawingTool === 'eraser' ? 'erase' : drawingColor, size: brushSize, tool: drawingTool, }); return; }
    if (drawingTool === 'eraser' || !currentPathId) return; const ref = canvasRef; const containerRef = whiteboardContainerRef; if (!contextRef.current || !ref.current) return; const { x, y } = getCanvasCoords(e, ref, containerRef); updatePaths(prev => prev.map(path => path.id !== currentPathId ? path : { ...path, points: [...path.points, { x, y }] })); socket.emit('whiteboard-add-point', { sessionId, pageNumber: currentPageNumber, pathId: currentPathId, x, y, }); redraw();
  };

  const stopDrawing = (isAnnotation = false) => { setIsDrawing(false); if (!isAnnotation) setCurrentPathId(null); };

  const handleErase = (e) => { if (drawingTool !== 'eraser') return; e.preventDefault(); const ref = canvasRef; const containerRef = whiteboardContainerRef; if (!ref.current) return; const { x, y } = getCanvasCoords(e, ref, containerRef); const hitId = getHitPath(x, y, currentPage?.paths || []); if (hitId) { updatePaths(prev => prev.filter(p => p.id !== hitId)); socket.emit('whiteboard-remove-path', { sessionId, pageNumber: currentPageNumber, pathId: hitId, }); redraw(); } };

  const handleRemoteDraw = (data) => { const ctxRef = annotationContextRef; const ref = annotationCanvasRef; if (!ctxRef.current || !ref.current) return; const ctx = ctxRef.current; const prevColor = ctx.strokeStyle; const prevSize = ctx.lineWidth; const prevAlpha = ctx.globalAlpha; ctx.strokeStyle = data.color === 'erase' ? 'rgba(255,255,255,0)' : data.color; ctx.lineWidth = data.size; ctx.globalAlpha = data.tool === 'highlighter' ? 0.5 : 1; ctx.beginPath(); ctx.moveTo(data.fromX || data.toX, data.fromY || data.toY); ctx.lineTo(data.toX, data.toY); ctx.stroke(); ctx.strokeStyle = prevColor; ctx.lineWidth = prevSize; ctx.globalAlpha = prevAlpha; };

  const handleRemoteClear = () => { const ctxRef = annotationContextRef; const ref = annotationCanvasRef; if (!ctxRef.current || !ref.current) return; ctxRef.current.clearRect(0, 0, ref.current.width, ref.current.height); };

  const clearWhiteboard = (isAnnotation = false) => { if (isAnnotation) { const ctxRef = annotationContextRef; const ref = annotationCanvasRef; if (!ctxRef.current || !ref.current) return; ctxRef.current.clearRect(0, 0, ref.current.width, ref.current.height); socket.emit('annotation-clear', { sessionId }); return; } updatePaths(() => []); socket.emit('whiteboard-clear-page', { sessionId, pageNumber: currentPageNumber }); redraw(); };

  const addPage = () => { const maxNum = Math.max(...pages.map(p => p.number), 0); const newNum = maxNum + 1; setPages([...pages, { number: newNum, paths: [] }]); setCurrentPageNumber(newNum); socket.emit('whiteboard-add-page', { sessionId, pageNumber: newNum }); };

  const switchPage = (num) => { setCurrentPageNumber(num); socket.emit('whiteboard-switch-page', { sessionId, pageNumber: num }); };

  const handleImageUpload = (e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; } const imageUrl = URL.createObjectURL(file); setSharedImage(imageUrl); socket.emit('shared-image', { sessionId, imageUrl }); };

  const removeSharedImage = () => { if (sharedImage) { URL.revokeObjectURL(sharedImage); setSharedImage(null); socket.emit('remove-image', { sessionId }); } };

  const sendMessage = (e) => { e.preventDefault(); const msg = (newMessage || '').trim(); if (!msg) return; socket.emit('chat-message', { sessionId, message: msg, username }); setMessages(prev => [...prev, { sender: username, text: msg, timestamp: new Date() }]); setNewMessage(''); };

  const sendReaction = (type) => { socket.emit('reaction', { sessionId, type, username }); setReactions(prev => [...prev, { type, username, timestamp: Date.now() }]); setTimeout(() => { setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 5000)); }, 5000); setShowReactionsMenu(false); };

  const handleEndCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    try {
      socket.emit('end-call', { sessionId });
      cleanup();
      setCallStartTime(null);
      setElapsedSeconds(0);

      // For students, the rating modal will be shown when the server
      // emits 'interview-completed' after marking the interview as completed.
      // For interviewers, just call onEnd to navigate away.
      if (userRole === 'student') {
        setIsWaitingForCompletion(true);
        
        // Fallback timeout in case interview-completed event doesn't arrive
        completionTimeoutRef.current = setTimeout(async () => {
          console.log('[INTERVIEW] Timeout waiting for interview-completed, checking status manually');
          try {
            const res = await fetch(`${BACKEND_URL}/api/interview/requests/${sessionId}`, {
              credentials: 'include',
            });
            if (res.ok) {
              const interview = await res.json();
              setInterviewData(interview);
              const status = (interview.status || '').toLowerCase();
              if (status === 'completed') {
                setIsWaitingForCompletion(false);
                setShowRatingModal(true);
              } else {
                // Interview not completed, just navigate away
                setIsWaitingForCompletion(false);
                onEnd && onEnd();
              }
            } else {
              // Error fetching, just navigate away
              setIsWaitingForCompletion(false);
              onEnd && onEnd();
            }
          } catch (e) {
            console.error('Failed to fetch interview status:', e);
            setIsWaitingForCompletion(false);
            onEnd && onEnd();
          }
        }, 3000); // Wait 3 seconds for the socket event
      } else {
        onEnd && onEnd();
      }
      // Note: Students will see the rating modal via the 'interview-completed' socket event
      // This eliminates the race condition where we were checking status before it was updated
    } catch (error) {
      console.error('Error ending call:', error);
      // On error, just end the call
      onEnd && onEnd();
    }
  };

  const toggleMute = () => { const audioTrack = localStreamRef.current?.getAudioTracks?.()[0]; if (!audioTrack) return; audioTrack.enabled = !audioTrack.enabled; setIsMuted(!audioTrack.enabled); };

  const toggleVideo = () => { const videoTrack = localStreamRef.current?.getVideoTracks?.()[0]; if (!videoTrack) return; videoTrack.enabled = !videoTrack.enabled; setIsVideoOff(!videoTrack.enabled); };

  const switchCamera = async () => { try { setIsCameraSwitched(prev => !prev); localStreamRef.current?.getTracks?.().forEach(t => t.stop()); const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: !isCameraSwitched ? 'environment' : 'user' }, audio: true, }); setLocalStream(newStream); localStreamRef.current = newStream; if (localVideoRef.current) localVideoRef.current.srcObject = newStream; const videoTrack = newStream.getVideoTracks()[0]; const sender = peerConnectionRef.current?.getSenders()?.find(s => s.track?.kind === 'video'); if (sender && videoTrack) { await sender.replaceTrack(videoTrack); } } catch (err) { console.error('[DEBUG] switchCamera error:', err); } };

  const toggleSpeaker = async () => { const newOn = !isSpeakerOn; setIsSpeakerOn(newOn); if (remoteVideoRef.current) { remoteVideoRef.current.muted = !newOn; } };

  const toggleScreenShare = async () => { try { if (!isScreenSharing) { const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); setScreenStream(stream); setIsScreenSharing(true); if (screenVideoRef.current) screenVideoRef.current.srcObject = stream; const videoTrack = stream.getVideoTracks()[0]; const sender = peerConnectionRef.current?.getSenders()?.find(s => s.track?.kind === 'video'); if (sender && videoTrack) { await sender.replaceTrack(videoTrack); } videoTrack.onended = () => stopScreenShare(); } else { stopScreenShare(); } } catch (err) { console.error('[DEBUG] toggleScreenShare error:', err); } };

  const stopScreenShare = async () => { try { screenStream?.getTracks()?.forEach(t => t.stop()); setScreenStream(null); setIsScreenSharing(false); setIsAnnotationsEnabled(false); if (screenVideoRef.current) screenVideoRef.current.srcObject = null; const videoTrack = localStreamRef.current?.getVideoTracks?.()[0]; const sender = peerConnectionRef.current?.getSenders()?.find(s => s.track?.kind === 'video'); if (sender && videoTrack) { await sender.replaceTrack(videoTrack); } } catch (err) { console.error('[DEBUG] stopScreenShare error:', err); } };

  const toggleRecording = () => { if (!isRecording) { if (!localStreamRef.current) return; try { const recorder = new MediaRecorder(localStreamRef.current); recordedChunksRef.current = []; recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); }; recorder.onstop = () => { const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `call-recording-${sessionId}-${Date.now()}.webm`; a.click(); URL.revokeObjectURL(url); }; recorder.start(); mediaRecorderRef.current = recorder; setIsRecording(true); } catch (err) { console.error('[DEBUG] MediaRecorder error:', err); } } else { try { mediaRecorderRef.current?.stop(); } catch (e) { console.warn('[DEBUG] recorder stop failed:', e); } mediaRecorderRef.current = null; setIsRecording(false); } };

  const toggleBackground = (type) => { setVirtualBackground(type); };

  const toggleFullScreen = async () => { 
    if (!isFullScreen) { 
      // Entering fullscreen
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } catch (err) {
        console.error('[FULLSCREEN] Toggle fullscreen failed:', err);
      }
    } else { 
      // Exiting fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    } 
  };

  const makeRemoteFullScreen = () => setViewMode('remote-full');
  const makeLocalFullScreen = () => setViewMode('local-full');
  const resetViewMode = () => setViewMode('grid');

  const toggleAnnotations = () => setIsAnnotationsEnabled(prev => !prev);

  const toggleWhiteboard = () => { const next = !showWhiteboard; setShowWhiteboard(next); socket.emit('whiteboard-toggle', { sessionId, open: next }); if (next) { setTimeout(() => { smoothScrollIntoView(canvasRef.current); socket.emit('whiteboard-focus', { sessionId }); }, 60); } };

  const Icon = {
    Mic: ({ off = false, ...p }) => off ? (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
        <path d="M19 11a7 7 0 0 1-14 0"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
        <path d="M19 11a7 7 0 0 1-14 0"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
    Cam: ({ off = false, ...p }) => off ? (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/>
        <path d="M23 12l-7-5v10l7-5z"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    Switch: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    Speaker: ({ off = false, ...p }) => off ? (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
    ),
    Share: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <path d="M12 10v3"/>
        <path d="M12 10L9 13"/>
        <path d="M12 10l3 3"/>
      </svg>
    ),
    Record: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6" fill="currentColor"/>
      </svg>
    ),
    Chat: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="9" y1="10" x2="15" y2="10"/>
        <line x1="9" y1="14" x2="13" y2="14"/>
      </svg>
    ),
    Blur: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
        <path d="M9 16s1 2 3 2 3-2 3-2"/>
      </svg>
    ),
    Full: ({ on = false, ...p }) => on ? (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
    ),
    End: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M23 1L17 7"/>
        <path d="M17 1L23 7"/>
        <path d="M3.59 7.44a6.5 6.5 0 0 0 9.97 8.47m6.85-8.97a6.5 6.5 0 0 1-9.97 8.47"/>
        <path d="M12 1a4 4 0 0 1 4 4v1m-8-1a4 4 0 0 0-4 4v1"/>
      </svg>
    ),
    Question: (p) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    Expand: (p) => (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
        <path d="M15 3h6v6l-2-2-4 4-2-2 4-4-2-2z"/>
        <path d="M9 21H3v-6l2 2 4-4 2 2-4 4 2 2z"/>
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* Custom Fullscreen Permission Dialog */}
      {showFullscreenPermission && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl max-w-md w-full border-2 border-blue-500/30 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Enable Fullscreen Mode</h3>
                <p className="text-blue-100 text-sm">For better interview experience</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-base leading-relaxed">
                For the best interview experience, we recommend using fullscreen mode. This helps you:
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm">Stay focused without distractions</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm">See video and controls clearly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm">Professional interview environment</span>
                </li>
              </ul>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span className="text-blue-400 font-semibold text-sm">Quick Tip</span>
                </div>
                <p className="text-blue-200 text-xs">
                  Press <kbd className="px-2 py-1 bg-gray-800/80 rounded border border-gray-700 font-mono text-blue-300">ESC</kbd> anytime to exit fullscreen
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowFullscreenPermission(false)}
                className="flex-1 px-5 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 hover:text-white font-semibold transition-all border border-gray-600/50 hover:border-gray-600"
              >
                Skip for now
              </button>
              <button
                onClick={enterFullscreen}
                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                Enable Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center px-3 sm:px-6 py-3 sm:py-4 bg-gray-900/95 backdrop-blur-md shadow-2xl border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">{username}</h2>
            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {callStartTime ? (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-800/80 rounded-full border border-gray-700/50">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm sm:text-base font-mono font-semibold text-white" aria-live="polite">
                {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="px-3 sm:px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30 text-yellow-300 text-xs sm:text-sm">
              <span>Connecting...</span>
            </div>
          )}
          <button 
            onClick={handleEndCall} 
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-95 transition-all font-semibold shadow-lg hover:shadow-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm sm:text-base flex items-center gap-2" 
            aria-label="End Call" 
            title="End Call"
          >
            <Icon.End />
            <span className="hidden sm:inline">End</span>
          </button>
        </div>
      </header>

      {/* Main Video Area - 50/50 Split */}
      <main className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 p-2 sm:p-4 overflow-hidden" ref={videoContainerRef}>
        {/* Your Video (50%) */}
        <section className="flex-1 relative group">
          <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 object-cover" 
              aria-label="Your video" 
            />
            
            {/* Video Label */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-700/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold text-white">You ({username})</span>
            </div>

            {/* Fullscreen Button */}
            <button 
              onClick={makeLocalFullScreen} 
              className="absolute top-3 right-3 p-2 sm:p-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white shadow-xl hover:scale-110" 
              title="Expand your video" 
              aria-label="Expand your video"
            >
              <Icon.Expand />
            </button>

            {viewMode === 'local-full' && (
              <button 
                onClick={resetViewMode} 
                className="absolute top-3 left-3 p-2 sm:p-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white shadow-xl hover:scale-110 z-10" 
                title="Exit fullscreen" 
                aria-label="Exit fullscreen mode"
              >
                <Icon.Full on />
              </button>
            )}

            {/* Video Status */}
            {(isMuted || isVideoOff) && (
              <div className="absolute bottom-3 left-3 flex gap-2">
                {isMuted && (
                  <div className="px-3 py-1.5 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center gap-2">
                    <Icon.Mic off />
                    <span className="text-xs font-semibold">Muted</span>
                  </div>
                )}
                {isVideoOff && (
                  <div className="px-3 py-1.5 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center gap-2">
                    <Icon.Cam off />
                    <span className="text-xs font-semibold">Camera Off</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Partner Video (50%) */}
        <section className="flex-1 relative group">
          <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 object-cover" 
              aria-label="Partner video" 
            />
            
            {/* Video Label */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-700/50">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {userRole === 'interviewer' ? 'Candidate' : 'Interviewer'}
              </span>
            </div>

            {/* Fullscreen Button */}
            <button 
              onClick={makeRemoteFullScreen} 
              className="absolute top-3 right-3 p-2 sm:p-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white shadow-xl hover:scale-110" 
              title="Expand partner video" 
              aria-label="Expand partner video"
            >
              <Icon.Expand />
            </button>

            {viewMode === 'remote-full' && (
              <button 
                onClick={resetViewMode} 
                className="absolute top-3 left-3 p-2 sm:p-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white shadow-xl hover:scale-110 z-10" 
                title="Exit fullscreen" 
                aria-label="Exit fullscreen mode"
              >
                <Icon.Full on />
              </button>
            )}

            {/* Waiting for Partner */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                </div>
                <p className="mt-4 text-sm sm:text-base text-gray-300 font-medium">Waiting for partner...</p>
                <p className="mt-1 text-xs text-gray-400">Connecting to {userRole === 'interviewer' ? 'candidate' : 'interviewer'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Chat Sidebar */}
        {showChat && (
          <aside className="w-full lg:w-80 xl:w-96 bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <Icon.Chat />
                <h3 className="text-base sm:text-lg font-bold text-white">Chat</h3>
              </div>
              <button 
                onClick={() => setShowChat(false)} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all" 
                title="Close chat" 
                aria-label="Close chat panel"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3" aria-live="polite">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Icon.Chat />
                  <p className="mt-2 text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const mine = msg.sender === username;
                  return (
                    <div key={`${i}-${msg.timestamp}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-lg ${
                        mine 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                          : 'bg-gray-800 text-white border border-gray-700/50'
                      }`}>
                        <p className="text-xs font-semibold mb-1 opacity-90">{msg.sender}</p>
                        <p className="text-sm break-words">{msg.text}</p>
                        <p className="text-[10px] mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <form className="p-4 border-t border-gray-700/50" onSubmit={sendMessage}>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                  aria-label="Chat message input"
                />
                <button 
                  type="submit" 
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all font-semibold shadow-lg hover:shadow-blue-500/50 active:scale-95 text-sm" 
                  aria-label="Send message" 
                  title="Send"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </form>
          </aside>
        )}
      </main>

      {/* Screen Share Display - Full Width Below Main Area */}
      {isScreenSharing && screenStream && (
        <section className="px-2 sm:px-4 pb-2 sm:pb-4">
          <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Icon.Share />
                <h3 className="text-sm sm:text-base font-bold text-white">Screen Share</h3>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                {isAnnotationsEnabled && (
                  <span className="text-xs text-gray-400">Annotations enabled</span>
                )}
                <button 
                  onClick={toggleAnnotations} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isAnnotationsEnabled 
                      ? 'bg-blue-600/80 hover:bg-blue-700/80 text-white' 
                      : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300'
                  }`}
                  aria-pressed={isAnnotationsEnabled}
                  title={isAnnotationsEnabled ? 'Disable annotations' : 'Enable annotations'}
                >
                  {isAnnotationsEnabled ? 'Disable Annotations' : 'Enable Annotations'}
                </button>
                {isAnnotationsEnabled && (
                  <button 
                    onClick={() => clearWhiteboard(true)} 
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/80 hover:bg-red-700/80 text-white transition-all"
                    title="Clear annotations"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="relative bg-gray-800">
              <video 
                ref={screenVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-auto max-h-[50vh] object-contain" 
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
          </div>
        </section>
      )}

      {/* Shared Image Display */}
      {sharedImage && (
        <section className="px-2 sm:px-4 pb-2 sm:pb-4">
          <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Icon.Question />
                <h3 className="text-sm sm:text-base font-bold text-white">Shared Question</h3>
              </div>
              {userRole === 'tutor' && (
                <button 
                  onClick={removeSharedImage} 
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all" 
                  title="Remove shared image" 
                  aria-label="Remove shared image"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="relative p-4 bg-gray-800">
              <img 
                src={sharedImage} 
                alt="Shared question" 
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg" 
              />
              <a 
                href={sharedImage} 
                download 
                target="_blank" 
                rel="noreferrer" 
                className="absolute bottom-6 right-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center gap-2" 
                title="Download image" 
                aria-label="Download shared image"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Reactions Overlay */}
      <div className="pointer-events-none absolute top-24 right-3 sm:right-6 flex flex-col gap-2 z-50">
        {reactions.map((r, idx) => (
          <div 
            key={`${r.username}-${r.timestamp}-${idx}`} 
            className="pointer-events-auto bg-gray-900/90 backdrop-blur-md text-white px-3 py-2 rounded-full animate-bounce shadow-2xl border border-gray-700/50" 
            role="status"
          >
            <span className="text-lg">{r.type}</span>
            <span className="text-xs ml-2 opacity-80">{r.username}</span>
          </div>
        ))}
      </div>

      {/* Professional Footer Controls */}
      <footer className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 bg-gray-900/95 backdrop-blur-md shadow-2xl border-t border-gray-700/50">
        {/* Microphone */}
        <button 
          onClick={toggleMute} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isMuted 
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
          aria-label="Toggle microphone"
        >
          <Icon.Mic off={isMuted} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        {/* Camera */}
        <button 
          onClick={toggleVideo} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isVideoOff 
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          aria-pressed={isVideoOff}
          aria-label="Toggle camera"
        >
          <Icon.Cam off={isVideoOff} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {isVideoOff ? 'Turn On' : 'Turn Off'}
          </span>
        </button>

        {/* Switch Camera */}
        <button 
          onClick={switchCamera} 
          className="group relative p-3 sm:p-3.5 rounded-2xl bg-gray-800/80 hover:bg-gray-700/90 transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900"
          title="Switch camera"
          aria-label="Switch camera"
        >
          <Icon.Switch />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            Switch
          </span>
        </button>

        {/* Speaker */}
        <button 
          onClick={toggleSpeaker} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            !isSpeakerOn 
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
          aria-pressed={!isSpeakerOn}
          aria-label="Toggle speaker output"
        >
          <Icon.Speaker off={!isSpeakerOn} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {isSpeakerOn ? 'Mute' : 'Unmute'}
          </span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-gray-700/50"></div>

        {/* Screen Share */}
        <button 
          onClick={toggleScreenShare} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isScreenSharing 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          aria-pressed={isScreenSharing}
          aria-label="Toggle screen sharing"
        >
          <Icon.Share />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {isScreenSharing ? 'Stop Share' : 'Share'}
          </span>
        </button>

        {/* Recording */}
        <button 
          onClick={toggleRecording} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isRecording 
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 animate-pulse' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          aria-pressed={isRecording}
          aria-label="Toggle recording"
        >
          <Icon.Record />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {isRecording ? 'Stop' : 'Record'}
          </span>
        </button>

        {/* Chat */}
        <button 
          onClick={() => setShowChat(prev => !prev)} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            showChat 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={showChat ? 'Hide chat' : 'Show chat'}
          aria-pressed={showChat}
          aria-label="Toggle chat"
        >
          <Icon.Chat />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            Chat
          </span>
        </button>

        {/* Reactions */}
        <div className="relative">
          <button 
            onClick={() => setShowReactionsMenu(prev => !prev)} 
            className="group relative p-3 sm:p-3.5 rounded-2xl bg-gray-800/80 hover:bg-gray-700/90 transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900"
            title="Send reaction"
            aria-expanded={showReactionsMenu}
            aria-label="Open reactions"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 17a4 4 0 0 1-4-4M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            </svg>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
              React
            </span>
          </button>
          {showReactionsMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl p-2 flex gap-2 z-[1000] shadow-2xl">
              {['😊', '👍', '👏', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                <button 
                  key={emoji} 
                  onClick={() => sendReaction(emoji)} 
                  className="p-2 rounded-xl hover:bg-gray-800/80 text-xl transition-all hover:scale-110 active:scale-95" 
                  aria-label={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-gray-700/50"></div>

        {/* Background Blur */}
        <button 
          onClick={() => toggleBackground(virtualBackground === 'blur' ? 'none' : 'blur')} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            virtualBackground !== 'none' 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={virtualBackground !== 'none' ? 'Remove background blur' : 'Apply background blur'}
          aria-pressed={virtualBackground !== 'none'}
          aria-label="Toggle background blur"
        >
          <Icon.Blur />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {virtualBackground !== 'none' ? 'Remove Blur' : 'Blur'}
          </span>
        </button>

        {/* Fullscreen */}
        <button 
          onClick={toggleFullScreen} 
          className={`group relative p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isFullScreen 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500' 
              : 'bg-gray-800/80 hover:bg-gray-700/90 focus:ring-gray-600'
          }`}
          title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
          aria-pressed={isFullScreen}
          aria-label="Toggle fullscreen"
        >
          <Icon.Full on={isFullScreen} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
            {isFullScreen ? 'Exit' : 'Fullscreen'}
          </span>
        </button>

        {/* Question Image Upload (Tutor only) */}
        {userRole === 'tutor' && (
          <div className="relative">
            <button 
              onClick={() => imageInputRef.current?.click()} 
              className="group relative p-3 sm:p-3.5 rounded-2xl bg-gray-800/80 hover:bg-gray-700/90 transition-all shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900"
              title="Add question image"
              aria-label="Add question image"
            >
              <Icon.Question />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-gray-700/50 z-50">
                Question
              </span>
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

      {/* Fullscreen Notification - ESC to Exit */}
      {showFullscreenNotification && (
        <div 
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-500 ease-out"
          style={{ animation: 'slideDown 0.5s ease-out' }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md border-2 border-blue-500/50 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Fullscreen Mode Active</p>
              <p className="text-gray-300 text-xs mt-0.5">Press <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono text-blue-400">ESC</kbd> to exit</p>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>

      {/* Waiting for completion overlay */}
      {isWaitingForCompletion && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4">
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Interview Ended</h3>
            <p className="text-gray-300">Processing interview completion...</p>
          </div>
        </div>
      )}

      {/* Rating Modal for Students */}
      <InterviewSessionRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          onEnd && onEnd();
        }}
        interview={interviewData}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
};

export default InterviewCall;
