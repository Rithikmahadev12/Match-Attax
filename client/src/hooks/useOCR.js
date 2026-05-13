import { useState, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

export function useOCR() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const workerRef = useRef(null);

  const initWorker = async () => {
    if (workerRef.current) return workerRef.current;
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });
    workerRef.current = worker;
    return worker;
  };

  /**
   * Run OCR on an image element, canvas, or data URL.
   * Returns the raw extracted text.
   */
  const scanImage = useCallback(async (imageSource) => {
    setScanning(true);
    setProgress(0);
    try {
      const worker = await initWorker();
      const { data: { text } } = await worker.recognize(imageSource);
      setRawText(text);
      return text;
    } finally {
      setScanning(false);
    }
  }, []);

  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return { scanImage, scanning, progress, rawText, terminate };
}
