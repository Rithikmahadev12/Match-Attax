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
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      const video = videoRef.current;
      video.srcObject = s;
      await video.play();
      setStream(s);
      setCameraOn(true);
    } catch (e) {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
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
    if (card) { setMatchedCard(card); setStatus('found'); }
    else setStatus('not_found');
  }, [scanImage]);

  const keepCard = () => {
    if (!matchedCard) return;
    addCard(matchedCard);
    onCardFound?.(matchedCard);
    setCapturedImage(null); setMatchedCard(null); setStatus('idle');
  };

  const retry = () => { setCapturedImage(null); setMatchedCard(null); setStatus('idle'); };

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Viewfinder */}
      <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

        {!cameraOn && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="text-5xl">📷</div>
            <p className="text-sm">Tap "Start Camera" below</p>
          </div>
        )}

        {cameraOn && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 rounded-xl" style={{
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              border: '2px solid #FFD700'
            }} />
          </div>
        )}

        {capturedImage && (
          <img src={capturedImage} alt="captured" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {scanning && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <p className="text-yellow-400 font-bold text-lg">Scanning... {progress}%</p>
            <div className="w-48 bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {status === 'matching' && !scanning && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <p className="text-blue-400 font-bold animate-pulse text-lg">Matching card...</p>
          </div>
        )}
      </div>

      {/* Result */}
      {matchedCard && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-green-400 font-bold">✓ Card identified!</p>
          <CardDisplay card={matchedCard} />
          <div className="flex gap-3">
            <button onClick={keepCard} className="px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition">
              Add to Collection
            </button>
            <button onClick={retry} className="px-6 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition">
              Retry
            </button>
          </div>
        </div>
      )}

      {status === 'not_found' && (
        <div className="text-center">
          <p className="text-red-400 text-sm mb-3">Couldn't identify the card. Try better lighting.</p>
          <button onClick={retry} className="px-5 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition text-sm">
            Try again
          </button>
        </div>
      )}

      {/* Controls */}
      {!capturedImage && (
        <div className="flex gap-3">
          {!cameraOn ? (
            <button onClick={startCamera} className="px-7 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition text-sm shadow-lg">
              Start Camera
            </button>
          ) : (
            <>
              <button onClick={capture} className="px-7 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition text-sm shadow-lg">
                ⊙ Scan Card
              </button>
              <button onClick={stopCamera} className="px-5 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition text-sm">
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
