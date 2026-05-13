import { useState } from 'react';
import CardScanner from '../components/cardscanner';
import CardDisplay from '../components/carddisplay';
import { useStore } from '../store/gameStore';

export default function Scanner() {
  const [lastAdded, setLastAdded] = useState(null);
  const { collection } = useStore();

  return (
    <div className="page-content" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: 40,
          color: '#fff',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>
          SCAN A <span style={{ color: 'var(--lime)' }}>CARD</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6, fontFamily: "'Barlow', sans-serif" }}>
          Hold your card flat and well-lit inside the gold frame
        </p>
      </div>

      <CardScanner onCardFound={setLastAdded} />

      {lastAdded && (
        <div style={{
          marginTop: 20,
          background: 'var(--surface)',
          border: '1px solid rgba(74,255,128,0.2)',
          borderRadius: 18,
          padding: 20,
          textAlign: 'center',
          animation: 'fadeUp 0.3s ease forwards',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ color: '#4aff80', fontSize: 16 }}>✓</span>
            <span style={{
              color: '#4aff80',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>Added to collection!</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CardDisplay card={lastAdded} size="sm" />
          </div>
        </div>
      )}

      <div style={{
        marginTop: 16,
        textAlign: 'center',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        color: 'var(--muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {collection.length} card{collection.length !== 1 ? 's' : ''} collected
      </div>
    </div>
  );
}
