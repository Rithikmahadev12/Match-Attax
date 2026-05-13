import { useRef, useState, useCallback, useEffect } from 'react';
import { useOCR } from '../hooks/useOCR';
import { matchCardFromText, extractStatsFromText } from '../utils/cardMatcher';
import CardDisplay from './carddisplay';
import { useStore } from '../store/gameStore';

function makeUnknownCard(rawText, stats) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 40);
  const skip = /^(attack|defense|defence|star|rating|topps|match attax|\d+)$/i;
  const name = lines.find(l => !skip.test(l)) || 'Unknown Player';
  return {
    id: `custom-${Date.now()}`,
    name,
    club: 'Unknown Club',
    nation: '??',
    position: 'ST',
    attack: stats?.attack ?? 75,
    defense: stats?.defense ?? 60,
    star: stats?.star ?? 70,
    special: null,
  };
}

export default function CardScanner({ onCardFound }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // use ref for stream so stopCamera always sees latest
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [matchedCard, setMatchedCard] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const { scanImage, scanning, progress } = useOCR();
  const addCard = useStore(s => s.addCard);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        // Fallback: any camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      // Assign srcObject directly — don't wait for state, just set on the element
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(t => t.stop()); return; }

      video.srcObject = stream;

      // Wait for metadata to load, then play
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        setTimeout(resolve, 3000); // safety timeout
      });

      try { await video.play(); } catch (playErr) {
        // autoplay may have already started it — ignore
      }

      setCameraOn(true);
    } catch (e) {
      console.error('Camera error:', e);
      if (e.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (e.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${e.message || e.name}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setMatchedCard(null);
    setStatus('scanning');
    const text = await scanImage(dataUrl);
    setStatus('matching');
    let card = await matchCardFromText(text);
    if (!card) {
      const stats = extractStatsFromText(text);
      card = makeUnknownCard(text, stats);
      setStatus('found_unknown');
    } else {
      setStatus('found');
    }
    setMatchedCard(card);
  }, [scanImage]);

  const keepCard = () => {
    if (!matchedCard) return;
    addCard(matchedCard);
    onCardFound?.(matchedCard);
    setCapturedImage(null);
    setMatchedCard(null);
    setStatus('idle');
  };

  const retry = () => {
    setCapturedImage(null);
    setMatchedCard(null);
    setStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 w-full">

      {/* Viewfinder */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '320px',
        height: '420px',
        background: '#07090f',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}>

        {/* Video — always rendered, always visible when camera is on */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraOn && !capturedImage ? 'block' : 'none',
            zIndex: 1,
          }}
        />

        {/* Placeholder — only shown when camera is OFF and no captured image */}
        {!cameraOn && !capturedImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: '#07090f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#4a5568',
          }}>
            <div style={{ fontSize: '56px' }}>📷</div>
            <p style={{ fontSize: '14px' }}>Tap Start Camera below</p>
          </div>
        )}

        {/* Captured image preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="captured"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Gold targeting frame — only while camera is live */}
        {cameraOn && !capturedImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/* Dark vignette outside the frame */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              WebkitMaskImage: 'radial-gradient(ellipse 180px 240px at center, transparent 100%, black 100%)',
              maskImage: 'radial-gradient(ellipse 180px 240px at center, transparent 100%, black 100%)',
            }} />
            {/* The gold frame */}
            <div style={{
              width: '180px',
              height: '240px',
              borderRadius: '12px',
              border: '2px solid #FFD700',
              boxShadow: '0 0 12px rgba(255,215,0,0.4)',
              position: 'relative',
            }}>
              {/* Corner accents */}
              {[
                { top: -2, left: -2, borderTop: '3px solid #FFD700', borderLeft: '3px solid #FFD700', borderTopLeftRadius: 12 },
                { top: -2, right: -2, borderTop: '3px solid #FFD700', borderRight: '3px solid #FFD700', borderTopRightRadius: 12 },
                { bottom: -2, left: -2, borderBottom: '3px solid #FFD700', borderLeft: '3px solid #FFD700', borderBottomLeftRadius: 12 },
                { bottom: -2, right: -2, borderBottom: '3px solid #FFD700', borderRight: '3px solid #FFD700', borderBottomRightRadius: 12 },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
              ))}
            </div>
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'rgba(7,9,15,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            <p style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.1em' }}>
              SCANNING {progress}%
            </p>
            <div style={{ width: '200px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#FFD700', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Matching overlay */}
        {status === 'matching' && !scanning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'rgba(7,9,15,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{ color: '#60a5fa', fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              MATCHING...
            </p>
          </div>
        )}
      </div>

      {/* Result card */}
      {matchedCard && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className={`font-medium text-sm ${status === 'found_unknown' ? 'text-yellow-400' : 'text-green-400'}`}>
            {status === 'found_unknown' ? '⚠ Not in database — added as custom card' : '✓ Card identified!'}
          </p>
          <CardDisplay card={matchedCard} />
          <div className="flex gap-3">
            <button
              onClick={keepCard}
              className="px-6 py-2.5 font-bold rounded-xl text-black text-sm transition hover:scale-105"
              style={{ background: 'var(--gold)' }}
            >
              Add to Collection
            </button>
            <button
              onClick={retry}
              className="px-6 py-2.5 rounded-xl text-gray-400 text-sm transition hover:text-white"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Camera controls */}
      {!capturedImage && (
        <div className="flex gap-3">
          {!cameraOn ? (
            <button
              onClick={startCamera}
              className="px-8 py-3 font-bold rounded-xl text-black text-sm transition hover:scale-105 shadow-lg"
              style={{ background: 'var(--gold)' }}
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={capture}
                className="px-8 py-3 font-bold rounded-xl text-black text-sm transition hover:scale-105 shadow-lg"
                style={{ background: 'var(--gold)' }}
              >
                ⊙ Scan Card
              </button>
              <button
                onClick={stopCamera}
                className="px-5 py-3 rounded-xl text-gray-400 text-sm hover:text-white transition"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                Stop
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
