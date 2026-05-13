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
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [matchedCard, setMatchedCard] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const { scanImage, scanning, progress } = useOCR();
  const addCard = useStore(s => s.addCard);

  // Set srcObject after React updates the DOM
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setStream(s);
      setCameraOn(true);
    } catch (e) {
      setError('Camera access denied — please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setCameraOn(false);
  }, [stream]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
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

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
<div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
  style={{ aspectRatio: '3/4', background: '#07090f', border: '1px solid var(--border)' }}>

  {/* Video always visible — never display:none */}
  <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* Placeholder shown on top when camera is off */}
  {!cameraOn && !capturedImage && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600"
      style={{ background: '#07090f', zIndex: 10 }}>
      <div className="text-6xl">📷</div>
      <p className="text-sm">Tap Start Camera below</p>
    </div>
  )}

  {/* Captured image shown on top of video */}
  {capturedImage && (
    <img src={capturedImage} alt="captured"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ zIndex: 10 }} />
  )}

  {/* Gold frame guide */}
  {cameraOn && !capturedImage && (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
      <div className="w-48 h-64 rounded-xl" style={{
        border: '2px solid #FFD700',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.45), 0 0 20px rgba(255,215,0,0.3)'
      }} />
    </div>
  )}

  {/* Scanning overlay */}
  {scanning && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: 'rgba(7,9,15,0.85)', zIndex: 20 }}>
      <p className="text-yellow-400 font-bold text-xl font-display tracking-wider">SCANNING {progress}%</p>
      <div className="w-52 rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)' }}>
        <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )}

  {status === 'matching' && !scanning && (
    <div className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(7,9,15,0.85)', zIndex: 20 }}>
      <p className="text-blue-400 font-display text-2xl tracking-wider animate-pulse">MATCHING...</p>
    </div>
  )}
</div>

      {matchedCard && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className={`font-medium text-sm ${status === 'found_unknown' ? 'text-yellow-400' : 'text-green-400'}`}>
            {status === 'found_unknown' ? '⚠ Not in database — added as custom card' : '✓ Card identified!'}
          </p>
          <CardDisplay card={matchedCard} />
          <div className="flex gap-3">
            <button onClick={keepCard}
              className="px-6 py-2.5 font-bold rounded-xl text-black text-sm transition hover:scale-105"
              style={{ background: 'var(--gold)' }}>
              Add to Collection
            </button>
            <button onClick={retry}
              className="px-6 py-2.5 rounded-xl text-gray-400 text-sm transition hover:text-white"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {!capturedImage && (
        <div className="flex gap-3">
          {!cameraOn ? (
            <button onClick={startCamera}
              className="px-8 py-3 font-bold rounded-xl text-black text-sm transition hover:scale-105 shadow-lg"
              style={{ background: 'var(--gold)' }}>
              Start Camera
            </button>
          ) : (
            <>
              <button onClick={capture}
                className="px-8 py-3 font-bold rounded-xl text-black text-sm transition hover:scale-105 shadow-lg"
                style={{ background: 'var(--gold)' }}>
                ⊙ Scan Card
              </button>
              <button onClick={stopCamera}
                className="px-5 py-3 rounded-xl text-gray-400 text-sm hover:text-white transition"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                Stop
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
