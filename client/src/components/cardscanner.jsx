import { useState, useRef, useCallback } from 'react';
import { useOCR } from '../hooks/useOCR';
import { matchCardFromText } from '../utils/cardMatcher';
import { useStore } from '../store/gameStore';

export default function CardScanner({ onCardFound }) {
  const { addCard } = useStore();
  const { scanImage, scanning, progress } = useOCR();
  const [status, setStatus] = useState('idle'); // idle | scanning | found | error
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const processImage = useCallback(async (source) => {
    setStatus('scanning');
    setErrorMsg('');
    try {
      const text = await scanImage(source);
      const card = await matchCardFromText(text);
      if (card) {
        const added = addCard(card);
        onCardFound?.(added || card);
        setStatus('found');
      } else {
        setStatus('error');
        setErrorMsg('Card not recognised. Try better lighting or a clearer angle.');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg('Scan failed. Please try again.');
    }
  }, [scanImage, addCard, onCardFound]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    processImage(url);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraActive(true);
      setStatus('idle');
    } catch {
      setErrorMsg('Camera access denied. Use the upload option instead.');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setStatus('idle');
    setPreview(null);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    stopCamera();
    processImage(dataUrl);
  };

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Camera viewfinder / preview */}
      <div style={{
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#080e08',
        border: '1px solid rgba(184,255,60,0.15)',
        aspectRatio: '4/3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Live camera feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: cameraActive ? 'block' : 'none',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Preview image */}
        {preview && !cameraActive && (
          <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {/* Idle state */}
        {status === 'idle' && !cameraActive && !preview && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📷</div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 14,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Camera or upload a photo
            </div>
          </div>
        )}

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ position: 'relative', width: 60, height: 60 }}>
              <svg viewBox="0 0 60 60" style={{ width: 60, height: 60, animation: 'spin 1s linear infinite' }}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(184,255,60,0.2)" strokeWidth="3" />
                <circle cx="30" cy="30" r="26" fill="none" stroke="#b8ff3c" strokeWidth="3"
                  strokeDasharray="40 122" strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 13, color: '#b8ff3c',
              }}>{progress}%</div>
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 13, color: '#b8ff3c',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Scanning card...
            </div>
          </div>
        )}

        {/* Success overlay */}
        {status === 'found' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,20,0,0.8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, fontSize: 18, color: '#4aff80',
              letterSpacing: '0.06em',
            }}>CARD ADDED!</div>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(20,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40 }}>❌</div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 13, color: '#ff6060',
              lineHeight: 1.4,
            }}>{errorMsg}</div>
          </div>
        )}

        {/* Corner frame guides (decorative) */}
        {['topleft','topright','bottomleft','bottomright'].map(corner => {
          const isTop = corner.includes('top');
          const isLeft = corner.includes('left');
          return (
            <div key={corner} style={{
              position: 'absolute',
              top: isTop ? 12 : undefined,
              bottom: !isTop ? 12 : undefined,
              left: isLeft ? 12 : undefined,
              right: !isLeft ? 12 : undefined,
              width: 24, height: 24,
              borderTop: isTop ? '2px solid rgba(184,255,60,0.5)' : 'none',
              borderBottom: !isTop ? '2px solid rgba(184,255,60,0.5)' : 'none',
              borderLeft: isLeft ? '2px solid rgba(184,255,60,0.5)' : 'none',
              borderRight: !isLeft ? '2px solid rgba(184,255,60,0.5)' : 'none',
              borderRadius: isTop && isLeft ? '4px 0 0 0' : isTop ? '0 4px 0 0' : isLeft ? '0 0 0 4px' : '0 0 4px 0',
              pointerEvents: 'none',
            }} />
          );
        })}

        {/* Live camera: capture button */}
        {cameraActive && (
          <button
            onClick={captureFrame}
            style={{
              position: 'absolute', bottom: 16, left: '50%',
              transform: 'translateX(-50%)',
              width: 60, height: 60, borderRadius: '50%',
              background: '#b8ff3c', border: '4px solid rgba(0,0,0,0.5)',
              cursor: 'pointer', fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(184,255,60,0.4)',
            }}
          >
            📸
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!cameraActive && status !== 'scanning' && (
          <>
            <button
              onClick={startCamera}
              className="btn-lime"
              style={{ flex: 1, padding: '14px 0', fontSize: 16, borderRadius: 14 }}
            >
              📷 Use Camera
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-ghost"
              style={{ flex: 1, padding: '14px 0', fontSize: 16, borderRadius: 14 }}
            >
              🖼️ Upload Photo
            </button>
          </>
        )}

        {cameraActive && (
          <button
            onClick={stopCamera}
            className="btn-ghost"
            style={{ flex: 1, padding: '14px 0', fontSize: 16, borderRadius: 14 }}
          >
            Cancel
          </button>
        )}

        {(status === 'found' || status === 'error') && (
          <button
            onClick={reset}
            className="btn-lime"
            style={{ flex: 1, padding: '14px 0', fontSize: 16, borderRadius: 14 }}
          >
            {status === 'found' ? '+ Scan Another' : '↩ Try Again'}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
