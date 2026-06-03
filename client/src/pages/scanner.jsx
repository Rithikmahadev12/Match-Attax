import { useState, useRef } from 'react';
import { useStore } from '../store/gameStore';
import { useOCR } from '../hooks/useOCR';
import { extractStatsFromText } from '../utils/cardMatcher';

const POSITIONS = ['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','SS'];

export default function Scanner() {
  const { addToLibrary } = useStore();
  const { scanImage, scanning, progress } = useOCR();
  const [status, setStatus] = useState('idle'); // idle | scanning | confirm | saved | error
  const [preview, setPreview] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [editing, setEditing] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const toBase64 = (blob) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

  // Extract card data from OCR text using pattern matching
  const parseCardFromText = (rawText) => {
    const lines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Try to find player name (usually one of the longer lines)
    const namePatterns = /^[A-Z][a-z]+\s+[A-Z][a-z]+/;
    let name = '';
    for (const line of lines) {
      if (namePatterns.test(line) && line.length < 40) {
        name = line;
        break;
      }
    }

    // Try to find position (2-3 uppercase letters)
    let position = '';
    for (const line of lines) {
      if (/^(GK|CB|LB|RB|CDM|CM|CAM|LW|RW|ST|SS)$/i.test(line)) {
        position = line.toUpperCase();
        break;
      }
    }

    // Extract numbers for attack/defense (2 digit numbers)
    const numbers = rawText.match(/\b(\d{2})\b/g) || [];
    const uniqueNumbers = [...new Set(numbers.map(Number))].sort((a, b) => a - b);

    let attack = uniqueNumbers[0] || 50;
    let defense = uniqueNumbers[1] || 50;

    // Try to find club name (usually capitalized words)
    let club = '';
    for (const line of lines) {
      if (line.length > 3 && line.length < 30 && /^[A-Z]/.test(line) && line !== name && line !== position) {
        club = line;
        break;
      }
    }

    return {
      name: name || 'Unknown Player',
      position: position || 'ST',
      club: club || 'Unknown Club',
      nation: 'Unknown',
      attack: Math.min(99, Math.max(1, attack)),
      defense: Math.min(99, Math.max(1, defense)),
      price: 10,
      special: null,
    };
  };

  const processImage = async (source) => {
    setStatus('scanning');
    setErrorMsg('');
    try {
      const rawText = await scanImage(source);
      
      if (!rawText || rawText.trim().length < 10) {
        throw new Error('Could not extract text from image');
      }

      const card = parseCardFromText(rawText);
      setExtracted({ ...card, photo: source });
      setEditing({ ...card, photo: source });
      setStatus('confirm');
    } catch (e) {
      setStatus('error');
      setErrorMsg('Could not read card. Try:\n• Better lighting\n• Clearer angle\n• Larger card in frame');
    }
  };

  const handleFile = async (e) => {
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
      await videoRef.current.play();
      setCameraActive(true);
      setStatus('idle');
    } catch {
      setErrorMsg('Camera access denied. Use upload instead.');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(url);
    stopCamera();
    processImage(url);
  };

  const handleSave = () => {
    addToLibrary({ ...editing, photo: preview });
    setStatus('saved');
  };

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setExtracted(null);
    setEditing(null);
    setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const Field = ({ label, field, type = 'text' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
      {field === 'position' ? (
        <select
          value={editing?.position || ''}
          onChange={e => setEditing(x => ({ ...x, position: e.target.value }))}
          style={{ background: 'var(--surface3)', border: '1px solid var(--border-dim)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}
        >
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={editing?.[field] ?? ''}
          onChange={e => setEditing(x => ({ ...x, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          style={{ background: 'var(--surface3)', border: '1px solid var(--border-dim)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, outline: 'none' }}
        />
      )}
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 40, color: '#fff', lineHeight: 1 }}>
          SCAN A <span style={{ color: 'var(--lime)' }}>CARD</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>
          Point camera at your physical card — local OCR will read it automatically
        </p>
      </div>

      {/* Viewfinder */}
      {status !== 'confirm' && (
        <div style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          background: '#080e08', border: '1px solid rgba(184,255,60,0.15)',
          aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {preview && !cameraActive && status !== 'scanning' && (
            <img src={preview} alt="card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {status === 'idle' && !cameraActive && !preview && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 12, opacity: 0.25 }}>📷</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Camera or upload photo
              </div>
            </div>
          )}

          {status === 'scanning' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, border: '3px solid rgba(184,255,60,0.2)', borderTop: '3px solid #b8ff3c', borderRadius: '50%', animation: 'spin360 0.8s linear infinite' }} />
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#b8ff3c', letterSpacing: '0.1em' }}>OCR READING ({progress}%)...</div>
            </div>
          )}

          {status === 'saved' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,20,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 52 }}>✅</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: '#4aff80' }}>SAVED TO LIBRARY!</div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>❌</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#ff6060', lineHeight: 1.4 }}>{errorMsg}</div>
            </div>
          )}

          {/* Corner guides */}
          {['tl','tr','bl','br'].map(c => (
            <div key={c} style={{
              position: 'absolute',
              top: c.startsWith('t') ? 12 : undefined, bottom: c.startsWith('b') ? 12 : undefined,
              left: c.endsWith('l') ? 12 : undefined, right: c.endsWith('r') ? 12 : undefined,
              width: 22, height: 22,
              borderTop: c.startsWith('t') ? '2px solid rgba(184,255,60,0.6)' : 'none',
              borderBottom: c.startsWith('b') ? '2px solid rgba(184,255,60,0.6)' : 'none',
              borderLeft: c.endsWith('l') ? '2px solid rgba(184,255,60,0.6)' : 'none',
              borderRight: c.endsWith('r') ? '2px solid rgba(184,255,60,0.6)' : 'none',
              pointerEvents: 'none',
            }} />
          ))}

          {cameraActive && (
            <button onClick={captureFrame} style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 64, height: 64, borderRadius: '50%', background: '#b8ff3c', border: '4px solid rgba(0,0,0,0.4)', cursor: 'pointer', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📸
            </button>
          )}
        </div>
      )}

      {/* Confirm / Edit card form */}
      {status === 'confirm' && editing && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
          {/* Preview photo */}
          {preview && (
            <img src={preview} alt="card" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
          )}
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--lime)', marginBottom: 14, letterSpacing: '0.05em' }}>
              ✏️ CHECK & EDIT CARD
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <Field label="Name" field="name" />
              <Field label="Position" field="position" />
              <Field label="Club" field="club" />
              <Field label="Nation" field="nation" />
              <Field label="Attack (1-99)" field="attack" type="number" />
              <Field label="Defense (1-99)" field="defense" type="number" />
              <Field label="Price (£M)" field="price" type="number" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} className="btn-lime" style={{ flex: 1, padding: '13px 0', fontSize: 16, borderRadius: 12 }}>
                ✅ Save to Library
              </button>
              <button onClick={reset} className="btn-ghost" style={{ flex: 1, padding: '13px 0', fontSize: 16, borderRadius: 12 }}>
                ✕ Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {status !== 'confirm' && (
        <div style={{ display: 'flex', gap: 10 }}>
          {!cameraActive && status !== 'scanning' && (
            <>
              <button onClick={startCamera} className="btn-lime" style={{ flex: 1, padding: '14px 0', fontSize: 15, borderRadius: 14 }}>
                📷 Camera
              </button>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost" style={{ flex: 1, padding: '14px 0', fontSize: 15, borderRadius: 14 }}>
                🖼️ Upload
              </button>
            </>
          )}
          {cameraActive && (
            <button onClick={stopCamera} className="btn-ghost" style={{ flex: 1, padding: '14px 0', fontSize: 15, borderRadius: 14 }}>Cancel</button>
          )}
          {(status === 'saved' || status === 'error') && (
            <button onClick={reset} className="btn-lime" style={{ flex: 1, padding: '14px 0', fontSize: 15, borderRadius: 14 }}>
              {status === 'saved' ? '+ Scan Another' : '↩ Try Again'}
            </button>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <style>{`@keyframes spin360 { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
