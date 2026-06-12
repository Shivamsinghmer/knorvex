'use client';

import { useState, useEffect } from 'react';
import {
  StreamVideo,
  StreamCall,
  useCallStateHooks,
  ParticipantView,
  useCall,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { Loader2, Video, VideoOff, Mic, MicOff, PhoneOff, AlertTriangle } from 'lucide-react';
import '@stream-io/video-react-sdk/dist/css/styles.css';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

function CallControls({ onCallEnded }) {
  const call = useCall();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { camera, isMute: isCamMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();

  return (
    <div className="p-4 bg-card border-t border-border flex justify-center items-center gap-4">
      <button
        onClick={() => microphone.toggle()}
        className={`p-3 rounded-xl border transition-all ${
          isMicMuted
            ? 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
            : 'bg-muted border-border text-muted-foreground hover:bg-secondary'
        }`}
        title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
      >
        {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={() => camera.toggle()}
        className={`p-3 rounded-xl border transition-all ${
          isCamMuted
            ? 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
            : 'bg-muted border-border text-muted-foreground hover:bg-secondary'
        }`}
        title={isCamMuted ? 'Start Camera' : 'Stop Camera'}
      >
        {isCamMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      <button
        onClick={async () => {
          await call.leave().catch(() => {});
          if (onCallEnded) onCallEnded();
        }}
        className="p-3 rounded-xl bg-destructive hover:bg-destructive/90 border border-destructive/10 text-destructive-foreground transition-all"
        title="Leave Call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
}

function CallLayout({ onCallEnded, onSFUError }) {
  const { useParticipants, useCallCallingState, useMicrophoneState, useCameraState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const { isMute: isLocalMicMuted } = useMicrophoneState();
  const { isMute: isLocalCamMuted } = useCameraState();

  useEffect(() => {
    if (callingState !== 'joining') return;
    const timer = setTimeout(() => {
      if (onSFUError) onSFUError();
    }, 15000);
    return () => clearTimeout(timer);
  }, [callingState, onSFUError]);

  if (callingState === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-card rounded-2xl border border-border">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold text-foreground">Entering video room…</p>
        <p className="text-xs text-muted-foreground mt-2">Connecting to media server</p>
      </div>
    );
  }

  const local  = participants.find((p) => p.isLocalParticipant);
  const remote = participants.find((p) => !p.isLocalParticipant);

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px] bg-background rounded-2xl overflow-hidden border border-border">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        {remote ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-card min-h-[240px]">
            <ParticipantView participant={remote} />
            <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
              <span>{remote.name || remote.userId}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs min-h-[240px]">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mb-2" />
            Waiting for peer to connect…
          </div>
        )}

        {local && (
          <div className="relative rounded-xl overflow-hidden border border-border bg-card min-h-[240px]">
            <ParticipantView participant={local} />
            <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
              {isLocalMicMuted && <MicOff className="w-3 h-3 text-red-400" />}
              {isLocalCamMuted && <VideoOff className="w-3 h-3 text-red-400" />}
              <span>You</span>
            </div>
          </div>
        )}
      </div>

      <CallControls onCallEnded={onCallEnded} />
    </div>
  );
}

export default function VideoRoom({ sessionId, streamToken, currentUser, onCallEnded }) {
  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall]               = useState(null);
  const [initError, setInitError]     = useState('');

  const userId    = currentUser?.id || currentUser?._id;
  const userName  = currentUser?.name  || '';
  const userImage = currentUser?.avatar || '';

  useEffect(() => {
    if (!STREAM_API_KEY || !userId || !streamToken) return;

    let client;
    try {
      // Use `new` (not getOrCreateInstance) so logOptions always apply to a fresh instance
      client = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user:  { id: userId, name: userName, image: userImage },
        token: streamToken,
        options: {
          // Suppress all internal SDK console output (network errors still show in browser)
          logger: () => {},
        },
      });
      setVideoClient(client);
    } catch (err) {
      setInitError('Failed to initialize video client.');
    }

    return () => {
      setVideoClient(null);
      setCall(null);
      client?.disconnectUser().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, streamToken]);

  useEffect(() => {
    if (!videoClient || !sessionId) return;

    let activeCall;
    let cancelled = false;

    (async () => {
      try {
        activeCall = videoClient.call('default', sessionId);
        await activeCall.join({ create: true });
        if (!cancelled) setCall(activeCall);
      } catch (err) {
        console.error('Failed to join call:', err);
        if (!cancelled) {
          setInitError('Could not join the video call. Please check your Stream.io plan supports video calls.');
        }
      }
    })();

    return () => {
      cancelled = true;
      activeCall?.leave().catch(() => {});
      setCall(null);
    };
  }, [videoClient, sessionId]);

  if (!STREAM_API_KEY) {
    return (
      <div className="card p-8 rounded-2xl border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center text-center min-h-[300px]">
        <VideoOff className="w-10 h-10 text-amber-400 mb-3" />
        <h4 className="font-bold text-sm text-foreground">Stream Not Configured</h4>
        <p className="text-xs text-muted-foreground mt-1">Set NEXT_PUBLIC_STREAM_API_KEY in .env.local</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="card p-8 rounded-2xl border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center text-center min-h-[300px]">
        <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
        <h4 className="font-bold text-sm text-foreground">Video Call Error</h4>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">{initError}</p>
        <button
          onClick={onCallEnded}
          className="mt-5 px-4 py-2 bg-muted hover:bg-secondary text-xs font-semibold text-foreground rounded-lg border border-border"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!videoClient || !call) {
    return (
      <div className="card p-8 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">
          {!videoClient ? 'Connecting to Stream…' : 'Joining video room…'}
        </p>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <CallLayout
          onCallEnded={onCallEnded}
          onSFUError={() => setInitError('SFU media server connection failed (WebSocket 1006). This may be a Stream.io plan limitation or network issue. Try refreshing.')}
        />
      </StreamCall>
    </StreamVideo>
  );
}
