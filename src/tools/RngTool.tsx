import { useState } from 'react';
import { DiceIcon } from './icons/DiceIcon';

export function RngTool() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    const minNum = Number(min);
    const maxNum = Number(max);
    if (min.trim() === '' || max.trim() === '' || !Number.isInteger(minNum) || !Number.isInteger(maxNum)) {
      setError('Min and max must be whole numbers.');
      setResult(null);
      return;
    }
    if (minNum > maxNum) {
      setError('Min must be less than or equal to max.');
      setResult(null);
      return;
    }
    setError(null);
    setResult(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
  }

  return (
    <div className="rng-tool">
      <div className="rng-tool-row">
        <label className="rng-tool-field">
          <span>Min</span>
          <input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
        <label className="rng-tool-field">
          <span>Max</span>
          <input type="number" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
      </div>
      <button className="rng-tool-roll" onClick={generate} aria-label="Roll">
        <DiceIcon size={64} />
        <DiceIcon size={64} />
      </button>
      {error && <div className="status-msg error">{error}</div>}
      {result !== null && <div className="rng-tool-result">{result}</div>}
    </div>
  );
}
