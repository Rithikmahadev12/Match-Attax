import { useRef, useState, useCallback, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { useStore } from '../store/gameStore';

/** Pull numbers from OCR text for ATK / DEF pre-fill */
function extractStats(text) {
  const nums = (text.match(/\b(\d{1,3})\b/g) || [])
    .map(Number)
    .filter(n => n >= 1 && n <= 99);
  return { attack: nums[0] ?? 75, defense: nums[1] ?? 65 };
}

/** Pick a player-name candidate from OCR lines */
function extractName(text) {
  const skip = /^(attack|defense|defence|star|rating|topps|match attax|gk|st|cb|lb|rb|cm|cam|cdm|lw|rw|mid|atk|def|\d+)$/i;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 40);
  return lines.find(l => !skip.test(l)) || '';
}

export default function CardScanner({ onCardFound }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const workerRef  = useRef(null);

  const [cameraOn,    setCameraOn]    = useState(false);
  const [captured,    setCaptured]    = useState(null); // dataURL
  const [scanning,    setScanning]    = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [showForm,    setShowForm]    = useState(false);
  const [error,       setError]       = useState('');

  // Form fields
  const [name,     setName]     = useState('');
  const [club,     setClub]     = useState('');
  const [position, setPosition] = useState('ATK');
  const [attack,   setAttack]   = useState(75);
  const [defense,  setDefense]  = useState(65);
  const [price,    setPrice]    = useState(10);

  const addCard = useStore(s => s.addCard);

  // ── Camera ──────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError('');
    try {
      if (streamRef.current) stopCamera();
      let s;
      try { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } }); }
      catch { s = await navigator.mediaDevices.getUserMedia({ video: true }); }
      streamRef.current = s;
      const vid = videoRef.current;
      if (!vid) { s.getTracks().forEach(t => t.stop()); return; }
      vid.srcObject = s;
      await new Promise(r => { vid.onloadedmetadata = r; setTimeout(r, 3000); });
      try { await vid.play(); } catch {}
      setCameraOn(true);
    } catch (e) {
      setError(e.name === 'NotAllowedError'
        ? 'Camera permission denied — please allow camera access and retry.'
        : `Camera error: ${e.message || e.name}`);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  // ── Capture + OCR ────────────────────────────────────
  const capture = useCallback(async () => {
    const vid    = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = vid.videoWidth  || 640;
    canvas.height = vid.videoHeight || 480;
    ctx.drawImage(vid, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopCamera();
    setScanning(true);
    setProgress(0);

    try {
      if (!workerRef.current) {
        workerRef.current = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text')
              setProgress(Math.round(m.progress * 100));
          },
        });
      }
      const { data: { text } } = await workerRef.current.recognize(dataUrl);
      const stats = extractStats(text);
      const detectedName = extractName(text);
      setName(detectedName);
      setAttack(stats.attack);
      setDefense(stats.defense);
    } catch {
      // OCR failed — let user fill in manually
    } finally {
      setScanning(false);
      setShowForm(true);
    }
  }, [stopCamera]);

  // ── Save card ────────────────────────────────────────
  const saveCard = () => {
    if (!name.trim()) { setError('Enter a player name'); return; }
    const card = {
      name:     name.trim(),
      club:     club.trim() || 'Unknown Club',
      position,
      attack,
      defense,
      price,
      photo:    captured || null,
    };
    const saved = addCard(card);
    onCardFound?.(saved);
    reset();
  };

  const reset = () => {
    setCaptured(null);
    setShowForm(false);
    setError('');
    setName(''); setClub(''); setPosition('ATK');
    setAttack(75); setDefense(65); setPrice(10);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    workerRef.current?.terminate();
  }, []);

  // ── UI ───────────────────────────────────────────────
  const posColors = { GK: '#e67e00', DEF: '#1a6ef5', MID: '#15a050', ATK: '#cc2020' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>

      {/* Viewfinder */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 320, height: 400,
        background: '#05090a', borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(184,255,60,0.12)',
      }}>
        {/* Video */}
        <video ref={videoRef} autoPlay playsInline muted style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', display: cameraOn && !captured ? 'block' : 'none', zIndex: 1,
        }} />

        {/* Placeholder */}
        {!cameraOn && !captured && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10, color: '#2a3a2a',
          }}>
            <div style={{ fontSize: 52 }}>📷</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13 }}>Tap Start Camera below</div>
          </div>
        )}

        {/* Captured image */}
        {captured && (
          <img src={captured} alt="captured" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 2,
          }} />
        )}

        {/* Gold targeting frame */}
        {cameraOn && !captured && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3, display: 'flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              width: 200, height: 270, borderRadius: 10,
              border: '2px solid #FFD700',
              boxShadow: '0 0 16px rgba(255,215,0,0.35)',
            }} />
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(5,9,10,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 14,
          }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: '#FFD700', letterSpacing: '0.1em' }}>
              SCANNING {progress}%
            </div>
            <div style={{ width: 200, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#FFD700', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Camera buttons */}
      {!captured && !showForm && (
        <div style={{ display: 'flex', gap: 10 }}>
          {!cameraOn
            ? <button onClick={startCamera} className="btn-lime" style={{ padding: '12px 28px', fontSize: 16, borderRadius: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, cursor: 'pointer', background: '#b8ff3c', border: 'none', color: '#050c05' }}>Start Camera</button>
            : <>
                <button onClick={capture} style={{ padding: '12px 24px', fontSize: 16, borderRadius: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, cursor: 'pointer', background: '#b8ff3c', border: 'none', color: '#050c05' }}>⊙ Capture</button>
                <button onClick={stopCamera} style={{ padding: '12px 18px', fontSize: 14, borderRadius: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, cursor: 'pointer', background: '#121a12', border: '1px solid rgba(255,255,255,0.07)', color: '#4a6050' }}>Stop</button>
              </>
          }
        </div>
      )}

      {/* Card details form */}
      {showForm && (
        <div style={{ width: '100%', background: '#0d140d', border: '1px solid rgba(184,255,60,0.12)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: '#b8ff3c', marginBottom: 14, textAlign: 'center' }}>
            CONFIRM CARD DETAILS
          </div>

          {/* Photo preview */}
          {captured && (
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <img src={captured} alt="card" style={{ width: 100, height: 130, objectFit: 'cover', objectPosition: 'top', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: '#4a6050', marginTop: 4 }}>Photo saved ✓</div>
            </div>
          )}

          {[
            { label: 'Player Name', value: name, onChange: setName, type: 'text', placeholder: 'e.g. Haaland' },
            { label: 'Club',        value: club, onChange: setClub, type: 'text', placeholder: 'e.g. Man City' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: '#4a6050', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f.label}</label>
              <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} style={{ width: '100%', background: '#121a12', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Barlow',sans-serif", fontSize: 14, outline: 'none' }} />
            </div>
          ))}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: '#4a6050', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Position</label>
            <select value={position} onChange={e => setPosition(e.target.value)} style={{ width: '100%', background: '#121a12', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: posColors[position] || '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, outline: 'none' }}>
              {['GK','DEF','MID','ATK'].map(p => <option key={p} value={p} style={{ color: posColors[p] }}>{p}</option>)}
            </select>
          </div>

          {[
            { label: 'Attack', value: attack, onChange: setAttack, color: '#ff5757' },
            { label: 'Defence', value: defense, onChange: setDefense, color: '#4aabff' },
            { label: 'Price (£M)', value: price, onChange: setPrice, color: '#ffd700' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: '#4a6050', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{f.label}</span>
                <span style={{ color: f.color, fontWeight: 800 }}>{f.value}{f.label.includes('Price') ? 'M' : ''}</span>
              </label>
              <input type="range" min={1} max={f.label.includes('Price') ? 100 : 99} value={f.value}
                onChange={e => f.onChange(+e.target.value)}
                style={{ width: '100%', accentColor: f.color }} />
            </div>
          ))}

          {error && <div style={{ color: '#ff6060', fontSize: 13, marginBottom: 10 }}>{error}</div>}

          <button onClick={saveCard} style={{ width: '100%', padding: '14px 0', fontSize: 18, borderRadius: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, cursor: 'pointer', background: '#b8ff3c', border: 'none', color: '#050c05', marginBottom: 8 }}>
            + Add to Collection
          </button>
          <button onClick={reset} style={{ width: '100%', padding: '10px 0', fontSize: 14, borderRadius: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, cursor: 'pointer', background: '#121a12', border: '1px solid rgba(255,255,255,0.07)', color: '#4a6050' }}>
            Cancel
          </button>
        </div>
      )}

      {error && !showForm && (
        <p style={{ color: '#ff6060', fontSize: 13, textAlign: 'center', maxWidth: 280 }}>{error}</p>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
