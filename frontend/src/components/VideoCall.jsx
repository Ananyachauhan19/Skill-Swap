import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket.js';

const VideoCall = ({ sessionId, onEndCall, userRole, username }) => {
  console.info('[DEBUG] VideoCall: Initializing for session:', sessionId, 'role:', userRole);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isBackgroundBlur, setIsBackgroundBlur] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingTool, setDrawingTool] = useState('pen');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [silverCoins, setSilverCoins] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'remote-full', 'local-full'
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  const [virtualBackground, setVirtualBackground] = useState('none'); // 'none', 'blur', 'image1', etc.
  const [isAnnotationsEnabled, setIsAnnotationsEnabled] = useState(false); // For drawing on screen share

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const annotationContextRef = useRef(null);
  const lastPointRef = useRef(null);
  const chatContainerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    console.info('[DEBUG] VideoCall: Setting up socket listeners for session:', sessionId);
    const initializeCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isCameraSwitched ? 'environment' : 'user' },
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        setAudioDevices(audioOutputs);
        if (audioOutputs.length > 0) {
          setSelectedAudioDevice(audioOutputs[0].deviceId);
        }
        socket.emit('join-session', { sessionId, userRole, username });
        console.info('[DEBUG] VideoCall: Joined session room:', sessionId);
        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left', handleUserLeft);
        socket.on('whiteboard-draw', handleRemoteDraw);
        socket.on('whiteboard-clear', handleRemoteClear);
        socket.on('chat-message', handleChatMessage);
        socket.on('reaction', handleReaction);
        socket.on('hold-status', handleHoldStatus);
        socket.on('coin-update', ({ silverCoins }) => {
          console.info('[DEBUG] Coin update received:', silverCoins);
          setSilverCoins(silverCoins);
        });
        setIsConnected(true);
      } catch (error) {
        console.error('[DEBUG] Error accessing media devices:', error);
        alert('Unable to access camera/microphone. Please check permissions.');
      }
    };
    initializeCall();
    socket.on('end-call', ({ sessionId: endedSessionId }) => {
      if (endedSessionId === sessionId) {
        handleEndCall();
      }
    });
    return () => {
      console.info('[DEBUG] VideoCall: Cleaning up socket listeners for session:', sessionId);
      cleanup();
      localStorage.removeItem('activeSession');
      socket.off('end-call');
      socket.off('chat-message');
      socket.off('reaction');
      socket.off('hold-status');
      socket.off('coin-update');
    };
  }, [sessionId, userRole, username, isCameraSwitched]);

  useEffect(() => {
    if (isConnected && localStream && remoteStream && !callStartTime) {
      setCallStartTime(Date.now());
      setElapsedSeconds(0);
    }
  }, [isConnected, localStream, remoteStream]);

  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime]);

  useEffect(() => {
    if (showWhiteboard && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      context.strokeStyle = drawingTool === 'eraser' ? '#FFFFFF' : drawingColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (drawingTool === 'highlighter') {
        context.globalAlpha = 0.5;
      } else {
        context.globalAlpha = 1;
      }
      contextRef.current = context;
    }
  }, [showWhiteboard, drawingColor, brushSize, drawingTool]);

  useEffect(() => {
    if (isScreenSharing && isAnnotationsEnabled && annotationCanvasRef.current && screenVideoRef.current) {
      const canvas = annotationCanvasRef.current;
      canvas.width = screenVideoRef.current.offsetWidth;
      canvas.height = screenVideoRef.current.offsetHeight;
      const context = canvas.getContext('2d');
      context.strokeStyle = drawingTool === 'eraser' ? 'rgba(255,255,255,0)' : drawingColor; // For annotations, eraser clears
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (drawingTool === 'highlighter') {
        context.globalAlpha = 0.5;
      } else {
        context.globalAlpha = 1;
      }
      annotationContextRef.current = context;
    }
  }, [isScreenSharing, isAnnotationsEnabled, drawingColor, brushSize, drawingTool]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (localVideoRef.current && virtualBackground === 'blur') {
      localVideoRef.current.style.filter = 'blur(5px)';
    } else {
      localVideoRef.current.style.filter = 'none';
      // For other backgrounds, would need more complex implementation like body-pix, but skipping for now
    }
  }, [virtualBackground]);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    socket.emit('leave-session', { sessionId });
    socket.off('user-joined');
    socket.off('offer');
    socket.off('answer');
    socket.off('ice-candidate');
    socket.off('user-left');
    socket.off('whiteboard-draw');
    socket.off('whiteboard-clear');
    socket.off('chat-message');
    socket.off('reaction');
    socket.off('hold-status');
    socket.off('coin-update');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const startDrawing = (e, isAnnotation = false) => {
    const ref = isAnnotation ? annotationCanvasRef : canvasRef;
    const ctxRef = isAnnotation ? annotationContextRef : contextRef;
    if (!ctxRef.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    setIsDrawing(true);
    lastPointRef.current = { x, y };
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const draw = (e, isAnnotation = false) => {
    if (!isDrawing || !lastPointRef.current) return;
    const ref = isAnnotation ? annotationCanvasRef : canvasRef;
    const ctxRef = isAnnotation ? annotationContextRef : contextRef;
    if (!ctxRef.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctxRef.current.strokeStyle = drawingTool === 'eraser' ? (isAnnotation ? 'rgba(255,255,255,0)' : '#FFFFFF') : drawingColor;
    ctxRef.current.lineWidth = brushSize;
    if (drawingTool === 'highlighter') {
      ctxRef.current.globalAlpha = 0.5;
    } else {
      ctxRef.current.globalAlpha = 1;
    }
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    socket.emit('whiteboard-draw', {
      sessionId,
      fromX: lastPointRef.current.x,
      fromY: lastPointRef.current.y,
      toX: x,
      toY: y,
      color: drawingTool === 'eraser' ? (isAnnotation ? 'erase' : '#FFFFFF') : drawingColor,
      size: brushSize,
      tool: drawingTool,
      isAnnotation,
    });
    lastPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleRemoteDraw = (data) => {
    const ctxRef = data.isAnnotation ? annotationContextRef : contextRef;
    if (!ctxRef.current) return;
    const context = ctxRef.current;
    const originalColor = context.strokeStyle;
    const originalSize = context.lineWidth;
    const originalAlpha = context.globalAlpha;
    context.strokeStyle = data.color === 'erase' ? 'rgba(255,255,255,0)' : data.color;
    context.lineWidth = data.size;
    context.globalAlpha = data.tool === 'highlighter' ? 0.5 : 1;
    context.beginPath();
    context.moveTo(data.fromX, data.fromY);
    context.lineTo(data.toX, data.toY);
    context.stroke();
    context.strokeStyle = originalColor;
    context.lineWidth = originalSize;
    context.globalAlpha = originalAlpha;
  };

  const clearWhiteboard = (isAnnotation = false) => {
    const ctxRef = isAnnotation ? annotationContextRef : contextRef;
    const ref = isAnnotation ? annotationCanvasRef : canvasRef;
    if (!ctxRef.current || !ref.current) return;
    ctxRef.current.clearRect(0, 0, ref.current.width, ref.current.height);
    socket.emit('whiteboard-clear', { sessionId, isAnnotation });
  };

  const handleRemoteClear = (data) => {
    const ctxRef = data.isAnnotation ? annotationContextRef : contextRef;
    const ref = data.isAnnotation ? annotationCanvasRef : canvasRef;
    if (!ctxRef.current || !ref.current) return;
    ctxRef.current.clearRect(0, 0, ref.current.width, ref.current.height);
  };

  const handleChatMessage = (data) => {
    setMessages((prev) => [
      ...prev,
      { sender: data.username || 'Partner', text: data.message, timestamp: new Date() },
    ]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('chat-message', { sessionId, message: newMessage, username });
      setMessages((prev) => [
        ...prev,
        { sender: username, text: newMessage, timestamp: new Date() },
      ]);
      setNewMessage('');
    }
  };

  const handleReaction = (data) => {
    setReactions((prev) => [
      ...prev,
      { type: data.type, username: data.username, timestamp: Date.now() },
    ]);
    setTimeout(() => {
      setReactions((prev) => prev.filter(r => Date.now() - r.timestamp < 5000));
    }, 5000);
  };

  const sendReaction = (type) => {
    socket.emit('reaction', { sessionId, type, username });
    setReactions((prev) => [
      ...prev,
      { type, username, timestamp: Date.now() },
    ]);
    setTimeout(() => {
      setReactions((prev) => prev.filter(r => Date.now() - r.timestamp < 5000));
    }, 5000);
    setShowReactionsMenu(false);
  };

  const handleHoldStatus = (data) => {
    if (data.username !== username) {
      setRemoteStream(data.isOnHold ? null : localStreamRef.current);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = data.isOnHold ? null : localStreamRef.current;
      }
    }
  };

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    const pc = new RTCPeerConnection(configuration);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { sessionId, candidate: event.candidate });
      }
    };
    peerConnectionRef.current = pc;
    return pc;
  };

  const handleUserJoined = async (data) => {
    const pc = createPeerConnection();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { sessionId, offer });
      setIsInitiator(true);
    } catch (error) {
      console.error('[DEBUG] Error in handleUserJoined:', error);
    }
  };

  const handleOffer = async (data) => {
    const pc = createPeerConnection();
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { sessionId, answer });
    } catch (error) {
      console.error('[DEBUG] Error in handleOffer:', error);
    }
  };

  const handleAnswer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('[DEBUG] Error in handleAnswer:', error);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('[DEBUG] Error in handleIceCandidate:', error);
    }
  };

  const handleUserLeft = () => {
    setRemoteStream(null);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallStartTime(null);
    setElapsedSeconds(0);
  };

  const handleEndCall = () => {
    socket.emit('end-call', { sessionId });
    cleanup();
    setCallStartTime(null);
    setElapsedSeconds(0);
    if (onEndCall) {
      onEndCall();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOn;
    }
  };

  const changeAudioDevice = async (deviceId) => {
    setSelectedAudioDevice(deviceId);
    if (remoteVideoRef.current) {
      try {
        await remoteVideoRef.current.setSinkId(deviceId);
      } catch (error) {
        console.error('[DEBUG] Error changing audio device:', error);
      }
    }
  };

  const switchCamera = async () => {
    setIsCameraSwitched(!isCameraSwitched);
    // Re-initialize stream with new facing mode
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: isCameraSwitched ? 'user' : 'environment' },
      audio: true,
    });
    setLocalStream(newStream);
    localStreamRef.current = newStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
    }
    if (peerConnectionRef.current) {
      const videoTrack = newStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        if (peerConnectionRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('[DEBUG] Error in toggleScreenShare:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      setIsAnnotationsEnabled(false);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      if (localStreamRef.current) {
        const recorder = new MediaRecorder(localStreamRef.current);
        recordedChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
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
        setMediaRecorder(recorder);
        setIsRecording(true);
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setMediaRecorder(null);
        setIsRecording(false);
      }
    }
  };

  const toggleBackground = (type) => {
    setVirtualBackground(type);
    // For blur, already handled in useEffect
    // For images, would need canvas processing, but simulating with filter for now
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if (videoContainerRef.current.webkitRequestFullscreen) {
        videoContainerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const makeRemoteFullScreen = () => {
    setViewMode('remote-full');
  };

  const makeLocalFullScreen = () => {
    setViewMode('local-full');
  };

  const resetViewMode = () => {
    setViewMode('grid');
  };

  const toggleAnnotations = () => {
    setIsAnnotationsEnabled(!isAnnotationsEnabled);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-800 text-white shadow-md">
        <div className="text-lg font-semibold mb-2 sm:mb-0">
          {callStartTime ? (
            <span>
              Call Time: {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          ) : (
            <span>Waiting for connection...</span>
          )}
          {silverCoins !== null && (
            <span className="ml-4">Coins: {silverCoins.toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <h2 className="text-lg">{username} ({userRole})</h2>
          <button
            onClick={handleEndCall}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Call
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" ref={videoContainerRef}>
        {/* Video and Controls Section */}
        <div className="flex-1 p-2 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto">
          {/* Video Grid */}
          <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${viewMode === 'local-full' ? 'h-[80vh]' : viewMode === 'remote-full' ? 'hidden' : 'h-48 sm:h-96'}`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full bg-gray-800 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs sm:text-sm">
                You ({username})
              </div>
              <button
                onClick={makeLocalFullScreen}
                className="absolute top-2 right-2 p-1 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                title="Full Screen Self"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              {viewMode !== 'grid' && (
                <button
                  onClick={resetViewMode}
                  className="absolute top-2 left-2 p-1 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                  title="Exit Full Screen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${viewMode === 'remote-full' ? 'h-[80vh]' : viewMode === 'local-full' ? 'hidden' : 'h-48 sm:h-96'}`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full bg-gray-800 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs sm:text-sm">
                Partner
              </div>
              <button
                onClick={makeRemoteFullScreen}
                className="absolute top-2 right-2 p-1 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                title="Full Screen Partner"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              {viewMode !== 'grid' && (
                <button
                  onClick={resetViewMode}
                  className="absolute top-2 left-2 p-1 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                  title="Exit Full Screen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-white mx-auto mb-2 sm:mb-3"></div>
                    <p className="text-sm sm:text-base">Waiting for partner...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Screen Share */}
          {isScreenSharing && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Screen Share</h3>
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 sm:h-96 bg-gray-800 object-cover"
                />
                {isAnnotationsEnabled && (
                  <canvas
                    ref={annotationCanvasRef}
                    onMouseDown={(e) => startDrawing(e, true)}
                    onMouseMove={(e) => draw(e, true)}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => startDrawing(e, true)}
                    onTouchMove={(e) => draw(e, true)}
                    onTouchEnd={stopDrawing}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    style={{ touchAction: 'none', pointerEvents: isAnnotationsEnabled ? 'auto' : 'none' }}
                  />
                )}
              </div>
              {isScreenSharing && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={toggleAnnotations}
                    className={`px-3 py-1 text-sm rounded-md ${isAnnotationsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
                  >
                    {isAnnotationsEnabled ? 'Disable Annotations' : 'Enable Annotations'}
                  </button>
                  {isAnnotationsEnabled && (
                    <button
                      onClick={() => clearWhiteboard(true)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                    >
                      Clear Annotations
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Whiteboard */}
          {showWhiteboard && (
            <div className="mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-white">Whiteboard</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border cursor-pointer"
                    title="Choose color"
                  />
                  <select
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="px-2 py-1 bg-gray-700 text-white rounded-md text-xs sm:text-sm focus:outline-none"
                  >
                    <option value={1}>1px</option>
                    <option value={3}>3px</option>
                    <option value={5}>5px</option>
                    <option value={10}>10px</option>
                    <option value={20}>20px</option>
                  </select>
                  <select
                    value={drawingTool}
                    onChange={(e) => setDrawingTool(e.target.value)}
                    className="px-2 py-1 bg-gray-700 text-white rounded-md text-xs sm:text-sm focus:outline-none"
                  >
                    <option value="pen">Pen</option>
                    <option value="highlighter">Highlighter</option>
                    <option value="eraser">Eraser</option>
                  </select>
                  <button
                    onClick={() => clearWhiteboard()}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-xs sm:text-sm hover:bg-red-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[300px] sm:h-[500px] bg-white cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Chat Section */}
        {showChat && (
          <div className="w-full sm:w-80 md:w-96 bg-gray-800 p-4 sm:p-6 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-white">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 sm:p-2 text-gray-400 hover:text-white"
                title="Close Chat"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div
              ref={chatContainerRef}
              className="flex-1 bg-gray-700 rounded-lg p-2 sm:p-3 overflow-y-auto text-white text-sm sm:text-base"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg ${
                    msg.sender === username ? 'bg-blue-600 ml-auto' : 'bg-gray-600'
                  } max-w-[80%]`}
                >
                  <p className="text-xs sm:text-sm font-semibold">{msg.sender}</p>
                  <p>{msg.text}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 sm:mt-3 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-2 sm:px-3 py-1 sm:py-2 bg-gray-600 text-white rounded-l-lg focus:outline-none text-sm sm:text-base"
              />
              <button
                onClick={sendMessage}
                className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="absolute top-1/4 right-2 sm:right-10 flex flex-col gap-2">
        {reactions.map((reaction, index) => (
          <div
            key={index}
            className="bg-gray-800 text-white px-2 py-1 rounded-full animate-bounce text-sm sm:text-base"
          >
            {reaction.type} {reaction.username}
          </div>
        ))}
      </div>

      {/* Controls Footer */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-800 shadow-md overflow-x-auto">
        <button
          onClick={toggleMute}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            isMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM16 12h2M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>
        <button
          onClick={toggleVideo}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isVideoOff ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zm0 0l6-6m-6 6l6-6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
        </button>
        <button
          onClick={switchCamera}
          className="p-2 sm:p-3 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors text-xs sm:text-base"
          title="Switch Camera"
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
        <div className="relative">
          <button
            onClick={toggleSpeaker}
            className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
              isSpeakerOn ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-red-600 text-white'
            }`}
            title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isSpeakerOn ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM16 12h2" />
              )}
            </svg>
          </button>
          {isSpeakerOn && audioDevices.length > 1 && (
            <select
              value={selectedAudioDevice}
              onChange={(e) => changeAudioDevice(e.target.value)}
              className="absolute left-0 top-10 sm:top-12 bg-gray-700 text-white rounded-md p-1 sm:p-2 text-xs sm:text-sm z-50"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.slice(0, 4)}`}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={toggleScreenShare}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={toggleRecording}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            isRecording ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </button>
        <button
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            showWhiteboard ? 'bg-green-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            showChat ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={showChat ? 'Hide Chat' : 'Show Chat'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
  <div className="relative">
  <button
    onClick={() => setShowReactionsMenu(!showReactionsMenu)}
    className="p-2 sm:p-3 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors text-xs sm:text-base"
    title="Send Reaction"
  >
    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>
  {showReactionsMenu && (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white rounded-md p-2 sm:p-3 flex flex-row gap-2 z-[1000] shadow-lg">
      {['😊', '👍', '👏', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendReaction(emoji)}
          className="p-1 sm:p-2 hover:bg-gray-600 rounded text-base sm:text-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )}
</div>
        <div className="relative">
          <button
            onClick={() => toggleBackground(virtualBackground === 'blur' ? 'none' : 'blur')}
            className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
              virtualBackground !== 'none' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={virtualBackground !== 'none' ? 'Remove Background' : 'Apply Background Blur'}
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        </div>
        <button
          onClick={toggleFullScreen}
          className={`p-2 sm:p-3 rounded-full transition-colors text-xs sm:text-base ${
            isFullScreen ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isFullScreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v4H4m16 0h-4V7m0 10h4v-4m-16 0v4h4" />
            )}
          </svg>
        </button>
      </div>

      {/* Session Info */}
      <div className="p-2 sm:p-4 text-center text-gray-400 text-xs sm:text-sm">
        <p>Your Role: {userRole}</p>
        <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
        {remoteStream && <p className="text-green-400">Partner Connected!</p>}
        {showWhiteboard && <p className="text-blue-400">Whiteboard Active - Draw to collaborate!</p>}
      </div>
    </div>
  );
};

export default VideoCall;