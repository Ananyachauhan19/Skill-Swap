import React, { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket.js';

// Lightweight InterviewCall: core video + chat + whiteboard without coin system
const InterviewCall = ({ sessionId, userRole = 'participant', username = 'You', onEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  // Whiteboard refs
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setRemoteConnected(true);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('ice-candidate', { sessionId, candidate: e.candidate });
    };

    return pc;
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection();
        pcRef.current = pc;
        // add tracks
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Socket handlers
        const onUserJoined = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { sessionId, offer });
          } catch (e) { console.error(e); }
        };

        const onOffer = async (data) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { sessionId, answer });
          } catch (e) { console.error(e); }
        };

        const onAnswer = async (data) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (e) { console.error(e); }
        };

        const onIce = async (data) => {
          try {
            if (data?.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) { console.error(e); }
        };

        const onChat = (d) => {
          setMessages(prev => [...prev, { username: d.username || 'Partner', text: d.message }]);
        };

        // whiteboard events
        const onWhiteboardDraw = (payload) => {
          try {
            if (!canvasRef.current) return;
            const ctx = ctxRef.current;
            if (!ctx) return;
            const { x, y, type } = payload;
            if (type === 'start') { ctx.beginPath(); ctx.moveTo(x, y); }
            if (type === 'move') { ctx.lineTo(x, y); ctx.stroke(); }
            if (type === 'end') { ctx.closePath(); }
          } catch (_) {}
        };

        socket.on('user-joined', onUserJoined);
        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('ice-candidate', onIce);
        socket.on('chat-message', onChat);
        socket.on('whiteboard-draw', onWhiteboardDraw);

        // emit join
        socket.emit('join-session', { sessionId, userRole, username });
      } catch (err) {
        console.error('Failed to init media', err);
      }
    };

    init();

    return () => {
      mounted = false;
      try { socket.off('user-joined'); socket.off('offer'); socket.off('answer'); socket.off('ice-candidate'); socket.off('chat-message'); socket.off('whiteboard-draw'); } catch (_) {}
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    };
  }, [createPeerConnection, sessionId, userRole, username]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2,2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22c55e';
    ctxRef.current = ctx;
  }, [showWhiteboard]);

  const handleMouseDown = (e) => {
    drawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    ctxRef.current.beginPath(); ctxRef.current.moveTo(x, y);
    socket.emit('whiteboard-draw', { sessionId, type: 'start', x, y });
  };
  const handleMouseMove = (e) => {
    if (!drawing.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    ctxRef.current.lineTo(x, y); ctxRef.current.stroke();
    socket.emit('whiteboard-draw', { sessionId, type: 'move', x, y });
  };
  const handleMouseUp = () => { drawing.current = false; ctxRef.current.closePath(); socket.emit('whiteboard-draw', { sessionId, type: 'end' }); };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socket.emit('chat-message', { sessionId, message: newMessage, username });
    setMessages(prev => [...prev, { username: 'You', text: newMessage }]);
    setNewMessage('');
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const endCall = () => {
    try { socket.emit('leave-session', { sessionId }); } catch (_) {}
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (onEnd) onEnd();
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        <div className="bg-black rounded overflow-hidden relative">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!remoteConnected && <div className="absolute inset-0 flex items-center justify-center text-white">Waiting for partner...</div>}
        </div>
        <div className="bg-black rounded overflow-hidden relative">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 text-white bg-black/40 px-2 py-1 rounded text-xs">{username}</div>
        </div>
      </div>

      <div className="p-2 border-t bg-white flex items-center gap-2">
        <button onClick={toggleMute} className="px-3 py-1 bg-blue-600 text-white rounded">{isMuted ? 'Unmute' : 'Mute'}</button>
        <button onClick={toggleVideo} className="px-3 py-1 bg-blue-600 text-white rounded">{isVideoOff ? 'Video On' : 'Video Off'}</button>
        <button onClick={() => setShowWhiteboard(v => !v)} className="px-3 py-1 bg-gray-200 rounded">{showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}</button>
        <div className="flex-1" />
        <button onClick={endCall} className="px-3 py-1 bg-red-600 text-white rounded">End Call</button>
      </div>

      <div className="p-2 bg-white border-t flex gap-4">
        <div className="w-2/3">
          {showWhiteboard && (
            <div className="border rounded h-64">
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          )}
        </div>
        <div className="w-1/3 flex flex-col">
          <div className="flex-1 overflow-auto border rounded p-2 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className="mb-2"><strong className="mr-2">{m.username}:</strong>{m.text}</div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 border px-2 py-1" placeholder="Type a message" />
            <button onClick={sendMessage} className="px-3 py-1 bg-blue-600 text-white rounded">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCall;
