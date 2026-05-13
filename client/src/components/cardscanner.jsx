import { useRef, useState, useCallback, useEffect } from 'react';
import { useOCR } from '../hooks/useOCR';
import { matchCardFromText } from '../utils/cardMatcher';
import CardDisplay from './carddisplay';
import { useStore } from '../store/gameStore';

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

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      videoRef.current.srcObject = s;
      setStream(s);
      setCameraOn(true);
    } catch (e) {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraOn(false);
  }, [stream]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setMatchedCard(null);
    setStatus('scanning');

    const text = await scanImage(dataUrl);
    setStatus('matching');

    const card = await matchCardFromText(text);
    if (card) {
      setMatchedCard(card);
      setStatus('found');
    } else {
      setStatus('not_found');
    }
  }, [scanImage]);

  const keepCard = () => {
    if (!matchedCard) return;
    addCard(matchedCard);
    onCardFound?.(matchedCard);
    // Reset for next scan
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
    <div className="flex flex-col items-center gap-4">
      {/* Camera view */}
      {!capturedImage && (
        <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-xl overflow-hidden border border-gray-700">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Targeting overlay */}
          {cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-yellow-400 rounded-lg opacity-60" />
            </div>
          )}
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Camera off
            </div>
          )}
        </div>
      )}

      {/* Captured image */}
      {capturedImage && !matchedCard && (
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden border border-gray-700">
          <img src={capturedImage} alt="Captured card" className="w-full h-full object-cover" />
          {scanning && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
              <div className="text-yellow-400 font-bold">Scanning... {progress}%</div>
              <div className="w-48 bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'matching' && !scanning && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-blue-400 font-bold animate-pulse">Matching card...</div>
            </div>
          )}
        </div>
      )}

      {/* Found card */}
      {matchedCard && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-green-400 font-bold text-sm">✓ Card identified!</div>
          <CardDisplay card={matchedCard} />
          <div className="flex gap-3">
            <button
              onClick={keepCard}
              className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition"
            >
              Add to Collection
            </button>
            <button
              onClick={retry}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {status === 'not_found' && (
        <div className="text-center text-red-400 text-sm">
          <p>Could not identify card. Try holding it steadier in good light.</p>
          <button onClick={retry} className="mt-2 px-4 py-1.5 bg-gray-700 rounded-lg text-white text-sm">
            Try again
          </button>
        </div>
      )}

      {/* Controls */}
      {!capturedImage && (
        <div className="flex gap-3">
          {!cameraOn ? (
            <button
              onClick={startCamera}
              className="px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition"
            >
              📷 Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={capture}
                className="px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-full text-xl hover:bg-yellow-400 transition"
                title="Capture"
              >
                ⊙ Scan
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
              >
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
