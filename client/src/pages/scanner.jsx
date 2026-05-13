import { useState } from 'react';
import CardScanner from '../components/CardScanner';
import CardDisplay from '../components/CardDisplay';
import { useStore } from '../store/gameStore';

export default function Scanner() {
  const [lastAdded, setLastAdded] = useState(null);
  const { collection } = useStore();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-yellow-400 mb-1">Scan a Card</h1>
      <p className="text-gray-400 text-sm mb-6">
        Hold your Match Attax card up to the camera. Keep it flat and well-lit.
      </p>

      <CardScanner onCardFound={setLastAdded} />

      {lastAdded && (
        <div className="mt-6 p-4 bg-green-900/20 border border-green-700/40 rounded-xl text-center">
          <p className="text-green-400 font-bold text-sm mb-2">Added to collection!</p>
          <div className="flex justify-center">
            <CardDisplay card={lastAdded} size="sm" />
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-600 text-center">
        Collection: {collection.length} card{collection.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
