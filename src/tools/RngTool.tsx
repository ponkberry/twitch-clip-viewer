import { useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { DiceIcon } from './icons/DiceIcon';

const GROUP_SIZE = 5;
const GROUP_GAP = 16;
const MAX_ROLLS_PER_CLICK = 1000;
const ROLL_DELAY_MS = 500;
const FLICKER_DELAY_MS = 90;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Mode = 'instant' | 'dramatic';

interface Roll {
  attempt: number;
  value: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

export function RngTool() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [rolls, setRolls] = useState('1');
  const [mode, setMode] = useState<Mode>('instant');
  const [history, setHistory] = useState<Roll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [previewValue, setPreviewValue] = useState<number | null>(null);
  const nextAttempt = useRef(1);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Explicitly resets to true on mount (not just the initial useRef value) because
    // StrictMode's dev-only mount->cleanup->mount cycle would otherwise run the cleanup below
    // once before any real interaction happens, leaving this stuck false forever and making
    // the very first roll's delay loop bail out mid-sequence without ever re-enabling the button.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const historyRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  // How many whole groups of GROUP_SIZE fit in one column's actual available height — measured
  // rather than left to CSS multi-column, since column-fill:auto doesn't reliably read a height
  // that comes from flexbox instead of an explicit `height`, so it fell back to one tall
  // scrolling column instead of overflowing into a next one. Every extra column beyond what
  // fits gets its own column rather than dropping older results or scrolling.
  const [columnCapacity, setColumnCapacity] = useState(Infinity);

  const groups = chunk([...history].sort((a, b) => a.attempt - b.attempt), GROUP_SIZE);

  useLayoutEffect(() => {
    const container = historyRef.current;
    const group = groupRef.current;
    if (!container || !group) return;

    function measure() {
      if (!container || !group) return;
      const groupHeight = group.getBoundingClientRect().height + GROUP_GAP;
      setColumnCapacity(Math.max(1, Math.floor(container.clientHeight / groupHeight)));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [groups.length]);

  async function generate() {
    if (rolling) return;
    const minNum = Number(min);
    const maxNum = Number(max);
    const rollsNum = Number(rolls);
    if (min.trim() === '' || max.trim() === '' || !Number.isInteger(minNum) || !Number.isInteger(maxNum)) {
      setError('Min and max must be whole numbers.');
      return;
    }
    if (minNum > maxNum) {
      setError('Min must be less than or equal to max.');
      return;
    }
    if (rolls.trim() === '' || !Number.isInteger(rollsNum) || rollsNum < 1) {
      setError('Rolls must be a whole number of at least 1.');
      return;
    }
    if (rollsNum > MAX_ROLLS_PER_CLICK) {
      setError(`Rolls is capped at ${MAX_ROLLS_PER_CLICK} at a time.`);
      return;
    }
    setError(null);
    setRolling(true);
    setPreviewValue(null);
    for (let i = 0; i < rollsNum; i++) {
      if (mode === 'dramatic') {
        const flickerCount = 4 + Math.floor(Math.random() * 2); // 4 or 5
        for (let f = 0; f < flickerCount; f++) {
          setPreviewValue(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
          await delay(FLICKER_DELAY_MS);
          if (!mountedRef.current) return;
        }
      }
      const value = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
      const roll = { attempt: nextAttempt.current++, value };
      setHistory((prev) => [roll, ...prev]);
      setPreviewValue(null);
      if (i < rollsNum - 1) {
        await delay(ROLL_DELAY_MS);
        if (!mountedRef.current) return;
      }
    }
    setRolling(false);
  }

  const columns = chunk(groups, columnCapacity);

  function renderGroup(group: Roll[], ref?: Ref<HTMLDivElement>) {
    return (
      <div className="rng-tool-history-group" ref={ref} key={group[0].attempt}>
        {group.map((roll) => (
          <div className="rng-tool-history-item" key={roll.attempt}>
            <span className="rng-tool-attempt">#{roll.attempt}</span>
            <span>{roll.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rng-tool">
      <div className="rng-tool-config">
        <div className="rng-tool-heading">Settings</div>
        <div className="rng-tool-row">
          <label className="rng-tool-field">
            <span>Min</span>
            <input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
          </label>
          <label className="rng-tool-field">
            <span>Max</span>
            <input type="number" value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
          <label className="rng-tool-field">
            <span>Rolls</span>
            <input type="number" value={rolls} onChange={(e) => setRolls(e.target.value)} />
          </label>
          <div className="rng-tool-field">
            <span>Mode</span>
            <div className="rng-tool-mode-toggle">
              <button
                type="button"
                className={`rng-tool-mode-btn${mode === 'instant' ? ' active' : ''}`}
                onClick={() => setMode('instant')}
                disabled={rolling}
              >
                Instant
              </button>
              <button
                type="button"
                className={`rng-tool-mode-btn${mode === 'dramatic' ? ' active' : ''}`}
                onClick={() => setMode('dramatic')}
                disabled={rolling}
              >
                Dramatic
              </button>
            </div>
          </div>
        </div>
        <div className="rng-tool-roll-wrap">
          <button className="rng-tool-roll" onClick={generate} disabled={rolling}>
            <span className="rng-tool-roll-dice">
              <DiceIcon size={96} />
              <DiceIcon size={96} />
            </span>
            <span className="rng-tool-roll-label">Roll!</span>
          </button>
          {error && <div className="status-msg error">{error}</div>}
        </div>
      </div>

      <div className="rng-tool-results">
        <div className="rng-tool-heading">
          Current Result{history.length > 0 && <span className="rng-tool-attempt">#{history[0].attempt}</span>}
        </div>
        {history.length === 0 && previewValue === null ? (
          <p className="hint">Roll the dice to generate a number.</p>
        ) : (
          <div className="rng-tool-result">
            <span className={`rng-tool-result-value${previewValue !== null ? ' rolling' : ''}`}>
              {previewValue ?? history[0].value}
            </span>
          </div>
        )}

        {groups.length > 0 && (
          <>
            <div className="rng-tool-heading rng-tool-heading-secondary">Past Results</div>
            <div className="rng-tool-history" ref={historyRef}>
              {columns.map((column, colIndex) => (
                <div className="rng-tool-history-col" key={column[0][0].attempt}>
                  {column.map((group, i) => renderGroup(group, colIndex === 0 && i === 0 ? groupRef : undefined))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
