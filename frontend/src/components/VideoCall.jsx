import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket.js';

const VideoCall = ({ sessionId, onEndCall, userRole }) => {
  console.info('[DEBUG] VideoCall: Initializing for session:', sessionId, 'role:', userRole);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  
  // Whiteboard states
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingTool, setDrawingTool] = useState('pen'); // pen, eraser, text
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // Whiteboard refs
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const lastPointRef = useRef(null);

  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    console.info('[DEBUG] VideoCall: Setting up socket listeners for session:', sessionId);
    const initializeCall = async () => {
      try {
        // Get user media (camera and microphone)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Join the session room
        socket.emit('join-session', { sessionId, userRole });
        console.info('[DEBUG] VideoCall: Joined session room:', sessionId);
        
        // Listen for other user joining
        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left', handleUserLeft);
        
        // Whiteboard socket events
        socket.on('whiteboard-draw', handleRemoteDraw);
        socket.on('whiteboard-clear', handleRemoteClear);
        
        setIsConnected(true);
        
      } catch (error) {
        alert('Unable to access camera/microphone. Please check permissions.');
      }
    };

    initializeCall();

    // Listen for end-call event from the server
    socket.on('end-call', ({ sessionId: endedSessionId }) => {
      if (endedSessionId === sessionId) {
        handleEndCall();
      }
    });

    return () => {
      console.info('[DEBUG] VideoCall: Cleaning up socket listeners for session:', sessionId);
      cleanup();
      // Also clear localStorage if component unmounts unexpectedly
      localStorage.removeItem('activeSession');
      socket.off('end-call');
    };
  }, [sessionId, userRole]);

  // Start timer when call connects
  useEffect(() => {
    if (isConnected && !callStartTime) {
      setCallStartTime(Date.now());
      setElapsedSeconds(0);
    }
  }, [isConnected]);

  // Update timer every second
  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime]);

  // Initialize whiteboard canvas
  useEffect(() => {
    if (showWhiteboard && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Set default styles
      context.strokeStyle = drawingColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      contextRef.current = context;
    }
  }, [showWhiteboard, drawingColor, brushSize]);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    socket.emit('leave-session', { sessionId });
    socket.off('user-joined');
    socket.off('offer');
    socket.off('answer');
    socket.off('ice-candidate');
    socket.off('user-left');
    socket.off('whiteboard-draw');
    socket.off('whiteboard-clear');
  };

  // Whiteboard functions
  const startDrawing = (e) => {
    if (!contextRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    lastPointRef.current = { x, y };
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !contextRef.current || !lastPointRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    
    // Send drawing data to other user
    socket.emit('whiteboard-draw', {
      sessionId,
      fromX: lastPointRef.current.x,
      fromY: lastPointRef.current.y,
      toX: x,
      toY: y,
      color: drawingColor,
      size: brushSize,
      tool: drawingTool
    });
    
    lastPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleRemoteDraw = (data) => {
    if (!contextRef.current) return;
    
    const context = contextRef.current;
    const originalColor = context.strokeStyle;
    const originalSize = context.lineWidth;
    
    context.strokeStyle = data.color;
    context.lineWidth = data.size;
    
    context.beginPath();
    context.moveTo(data.fromX, data.fromY);
    context.lineTo(data.toX, data.toY);
    context.stroke();
    
    // Restore original settings
    context.strokeStyle = originalColor;
    context.lineWidth = originalSize;
  };

  const clearWhiteboard = () => {
    if (!contextRef.current) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Send clear command to other user
    socket.emit('whiteboard-clear', { sessionId });
  };

  const handleRemoteClear = () => {
    if (!contextRef.current) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          sessionId,
          candidate: event.candidate
        });
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
      
      socket.emit('offer', {
        sessionId,
        offer: offer
      });
      
      setIsInitiator(true);
    } catch (error) {
    }
  };

  const handleOffer = async (data) => {
    const pc = createPeerConnection();
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('answer', {
        sessionId,
        answer: answer
      });
    } catch (error) {
    }
  };

  const handleAnswer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
    }
  };

  const handleUserLeft = () => {
    setRemoteStream(null);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleEndCall = () => {
    // Emit end-call event to server
    socket.emit('end-call', { sessionId });
    cleanup();
    setCallStartTime(null);
    setElapsedSeconds(0);
    if (onEndCall) {
      onEndCall();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        
        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        // Stop screen sharing when user stops sharing
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
        
      } else {
        stopScreenShare();
      }
    } catch (error) {
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      
      // Restore camera video track
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Call Timer */}
        <div className="text-center text-lg font-semibold text-blue-700 mb-2">
          {callStartTime && (
            <>
              Call Time: {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')}
            </>
          )}
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Video Call - Session {sessionId}</h2>
          <button
            onClick={handleEndCall}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            End Call
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Local Video */}
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 bg-gray-800 rounded-lg"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You ({userRole})
            </div>
          </div>
          
          {/* Remote Video */}
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-800 rounded-lg"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              Partner
            </div>
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Waiting for partner to join...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Screen Share Video */}
        {isScreenSharing && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Screen Share</h3>
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 bg-gray-800 rounded-lg"
            />
          </div>
        )}

        {/* Whiteboard */}
        {showWhiteboard && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Whiteboard</h3>
              <div className="flex gap-2">
                {/* Color Picker */}
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                  title="Choose color"
                />
                
                {/* Brush Size */}
                <select
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={1}>1px</option>
                  <option value={3}>3px</option>
                  <option value={5}>5px</option>
                  <option value={10}>10px</option>
                  <option value={20}>20px</option>
                </select>
                
                {/* Drawing Tool */}
                <select
                  value={drawingTool}
                  onChange={(e) => setDrawingTool(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="pen">Pen</option>
                  <option value="eraser">Eraser</option>
                </select>
                
                {/* Clear Button */}
                <button
                  onClick={clearWhiteboard}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-96 bg-white cursor-crosshair"
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={`p-3 rounded-full transition-colors ${
              showWhiteboard ? 'bg-green-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        
        {/* Session Info */}
        <div className="mt-4 text-center text-gray-600">
          <p>Session ID: {sessionId}</p>
          <p>Your Role: {userRole}</p>
          <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
          {remoteStream && <p className="text-green-600">Partner Connected!</p>}
          {showWhiteboard && <p className="text-blue-600">Whiteboard Active - Draw to collaborate!</p>}
        </div>
      </div>
    </div>
  );
};

export default VideoCall; 