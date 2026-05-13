import { useState } from 'react';
import CardScanner from '../components/cardscanner';
import CardDisplay from '../components/carddisplay';
import { useStore } from '../store/gameStore';

export default function Scanner() {
  const [lastAdded, setLastAdded] = useState(null);
  const { collection } = useStore();

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-1" style={{ color: 'var(--gold)' }}>SCAN A CARD</h1>
        <p className="text-gray-500 text-sm">Hold your Match Attax card flat, well-lit, inside the gold frame.</p>
      </div>

      <CardScanner onCardFound={setLastAdded} />

      {lastAdded && (
        <div className="mt-8 p-5 rounded-2xl text-center"
          style={{ background: 'var(--surface)', border: '1px solid #1a3a1a' }}>
          <p className="text-green-400 font-bold text-sm mb-4">Added to collection!</p>
          <div className="flex justify-center">
            <CardDisplay card={lastAdded} size="sm" />
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-gray-700 text-xs">
        {collection.length} card{collection.length !== 1 ? 's' : ''} in collection
      </p>
    </div>
  );
}
