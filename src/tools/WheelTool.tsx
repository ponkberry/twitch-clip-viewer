import { useEffect, useRef, useState } from 'react';

const DEFAULT_SPIN_DURATION_SEC = 4;
const EXTRA_SPINS = 5;
const DEFAULT_OPTIONS = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
const WHEEL_COLORS = ['#5FA85F', '#6FB6A8', '#E8735D', '#E0B454', '#7A93C9', '#B77FD1', '#D98E5D', '#5FA0A8'];

type Tab = 'config' | 'results';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Spin {
  attempt: number;
  winner: string;
}

interface WheelConfig {
  id: string;
  name: string;
  options: string[];
}

const INITIAL_CONFIGS: WheelConfig[] = [{ id: 'default', name: 'My Wheel', options: DEFAULT_OPTIONS }];
const STORAGE_KEY = 'wheel_configs';

interface StoredConfigState {
  configs: WheelConfig[];
  activeConfigId: string;
  spinDurationSec: number;
}

// Deliberately localStorage rather than the sessionStorage convention used elsewhere (auth
// token, playlists) — wheel configs are meant to survive closing the browser entirely, not just
// the tab, so they're still there in a future session.
function loadStoredConfigs(): StoredConfigState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { configs: INITIAL_CONFIGS, activeConfigId: INITIAL_CONFIGS[0].id, spinDurationSec: DEFAULT_SPIN_DURATION_SEC };
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.configs) || parsed.configs.length === 0) {
      return { configs: INITIAL_CONFIGS, activeConfigId: INITIAL_CONFIGS[0].id, spinDurationSec: DEFAULT_SPIN_DURATION_SEC };
    }
    const activeConfigId =
      typeof parsed.activeConfigId === 'string' &&
      parsed.configs.some((c: WheelConfig) => c.id === parsed.activeConfigId)
        ? parsed.activeConfigId
        : parsed.configs[0].id;
    const spinDurationSec =
      typeof parsed.spinDurationSec === 'number' && parsed.spinDurationSec > 0
        ? parsed.spinDurationSec
        : DEFAULT_SPIN_DURATION_SEC;
    return { configs: parsed.configs, activeConfigId, spinDurationSec };
  } catch {
    return { configs: INITIAL_CONFIGS, activeConfigId: INITIAL_CONFIGS[0].id, spinDurationSec: DEFAULT_SPIN_DURATION_SEC };
  }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sliceParts(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const p1 = polarToCartesian(cx, cy, r, startAngle);
  const p2 = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx},${cy} L ${p1.x},${p1.y} A ${r},${r} 0 ${largeArc} 1 ${p2.x},${p2.y} Z`;
}

export function WheelTool() {
  const [configs, setConfigs] = useState<WheelConfig[]>(() => loadStoredConfigs().configs);
  const [activeConfigId, setActiveConfigId] = useState(() => loadStoredConfigs().activeConfigId);
  const [spinDurationSec, setSpinDurationSec] = useState(() => String(loadStoredConfigs().spinDurationSec));
  const [newConfigName, setNewConfigName] = useState('');
  const [creatingConfig, setCreatingConfig] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<Spin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('results');
  const [popupResult, setPopupResult] = useState<Spin | null>(null);
  const nextAttempt = useRef(1);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const parsedDurationSec = Number(spinDurationSec);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        configs,
        activeConfigId,
        spinDurationSec: Number.isFinite(parsedDurationSec) && parsedDurationSec > 0 ? parsedDurationSec : DEFAULT_SPIN_DURATION_SEC,
      }),
    );
  }, [configs, activeConfigId, spinDurationSec]);

  const activeConfig = configs.find((c) => c.id === activeConfigId) ?? configs[0];
  const options = activeConfig.options;
  const parsedDurationSec = Number(spinDurationSec);
  const spinDurationMs =
    Number.isFinite(parsedDurationSec) && parsedDurationSec > 0 ? parsedDurationSec * 1000 : DEFAULT_SPIN_DURATION_SEC * 1000;

  function updateActiveOptions(updater: (prev: string[]) => string[]) {
    setConfigs((prev) => prev.map((c) => (c.id === activeConfigId ? { ...c, options: updater(c.options) } : c)));
  }

  function selectConfig(id: string) {
    setActiveConfigId(id);
    setEditingIndex(null);
    setEditValue('');
  }

  function createConfig() {
    const trimmed = newConfigName.trim();
    if (!trimmed) return;
    const id = `config-${Date.now()}`;
    setConfigs((prev) => [...prev, { id, name: trimmed, options: ['Option 1', 'Option 2'] }]);
    setActiveConfigId(id);
    setNewConfigName('');
    setCreatingConfig(false);
  }

  function deleteActiveConfig() {
    if (configs.length <= 1) return;
    const remaining = configs.filter((c) => c.id !== activeConfigId);
    setConfigs(remaining);
    setActiveConfigId(remaining[0].id);
    setEditingIndex(null);
    setEditValue('');
  }

  function addOptions() {
    // Splitting on newlines means pasting several lines at once (e.g. from a spreadsheet or
    // notes app) adds each line as its own option in one go, not as a single multi-line option.
    const lines = newOption
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length === 0) return;
    updateActiveOptions((prev) => [...prev, ...lines]);
    setNewOption('');
  }

  function removeOption(index: number) {
    updateActiveOptions((prev) => prev.filter((_, i) => i !== index));
    // Any option's index can shift after a removal, so just close editing rather than risk it
    // pointing at the wrong row.
    setEditingIndex(null);
    setEditValue('');
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(options[index]);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      const index = editingIndex;
      updateActiveOptions((prev) => prev.map((option, i) => (i === index ? trimmed : option)));
    }
    setEditingIndex(null);
    setEditValue('');
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditValue('');
  }

  async function spin() {
    if (spinning) return;
    if (options.length < 2) {
      setError('Add at least 2 options to spin.');
      return;
    }
    if (!Number.isFinite(parsedDurationSec) || parsedDurationSec <= 0) {
      setError('Spin duration must be a positive number of seconds.');
      return;
    }
    setError(null);
    setPopupResult(null);
    setTab('results');
    setSpinning(true);

    const seg = 360 / options.length;
    const targetIndex = Math.floor(Math.random() * options.length);
    const jitter = (Math.random() - 0.5) * (seg * 0.6);
    const targetCenter = targetIndex * seg + seg / 2 + jitter;

    // The wheel only ever spins forward — never snaps backward to a lower rotation — so each
    // spin always reads as continued motion from wherever it last stopped.
    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = ((-targetCenter % 360) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta <= 0) delta += 360;
    const newRotation = rotation + EXTRA_SPINS * 360 + delta;
    setRotation(newRotation);

    await delay(spinDurationMs);
    if (!mountedRef.current) return;

    const winner = options[targetIndex];
    // Compute the attempt number here, outside the updater, so the updater itself stays pure —
    // React 18 StrictMode intentionally double-invokes state updater functions in dev to catch
    // side effects like a `nextAttempt.current++` living inside one, which was incrementing the
    // ref twice per spin (only one of the two calls' results gets committed) and made attempt
    // numbers jump by 2 each time.
    const attempt = nextAttempt.current++;
    setHistory((prev) => [{ attempt, winner }, ...prev]);
    setSpinning(false);
    setPopupResult({ attempt, winner });
  }

  const seg = options.length > 0 ? 360 / options.length : 0;
  const cx = 100;
  const cy = 100;
  const r = 96;

  return (
    <div className="wheel-tool">
      <div className="wheel-tool-view">
        <div className="wheel-spin-area">
          <div className="wheel-svg-wrap">
            <div className="wheel-pointer" />
            <svg
              className="wheel-svg"
              viewBox="0 0 200 200"
              style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${spinDurationMs}ms` }}
            >
              {(() => {
                // More slices need smaller text, since each label now runs lengthwise down its
                // own spoke instead of sideways across the slice — this is what keeps labels from
                // colliding with their neighbors once there are enough options to make each wedge
                // narrow.
                const fontSize = Math.max(7, Math.min(11, 130 / options.length));
                // The label is centered (textAnchor="middle") at the midpoint of this inner/outer
                // band, so it can extend the same distance in both directions before it would
                // overlap the center hub or spill past the rim — independent of option count,
                // since a single long phrase like "Bolt-Action Sniper" can overflow even when
                // there are only a few slices. (An earlier version picked the anchor radius and
                // the max length independently, which wasn't actually symmetric around the
                // anchor and still let long text spill past the rim after "compression".)
                // innerR must clear the spin button's own radius (130px button / 580px svg *
                // 200 viewBox units = ~22.4 units) or its inner end hides behind the hub instead
                // of just running short of it — sized with a small margin past that.
                const innerR = r * 0.28;
                const outerR = r * 0.94;
                const labelRadius = (innerR + outerR) / 2;
                const maxLabelLength = outerR - innerR;
                // Only used as a last resort for pathologically long text — real fitting happens
                // via textLength/lengthAdjust below, which compresses glyphs to the available
                // space instead of just chopping the string at a fixed character count.
                const maxChars = 26;
                const charWidth = fontSize * 0.62; // 'JetBrains Mono' is monospace, so this holds for any string.
                return options.map((option, i) => {
                  const startAngle = i * seg;
                  const endAngle = (i + 1) * seg;
                  const labelAngle = startAngle + seg / 2;
                  const labelPoint = polarToCartesian(cx, cy, labelRadius, labelAngle);
                  // Rotating by (labelAngle - 90) points the text radially outward along the
                  // spoke (SVG's rotate() measures clockwise from the 3-o'clock/east axis, while
                  // labelAngle is measured clockwise from the top) rather than tangentially along
                  // the rim, which is what was colliding with neighboring labels. The extra 180
                  // flip on the wheel's left half keeps text from rendering mirrored/upside-down.
                  const needsFlip = labelAngle > 180;
                  const textRotation = labelAngle - 90 + (needsFlip ? 180 : 0);
                  const displayText = option.length > maxChars ? `${option.slice(0, maxChars - 1)}…` : option;
                  const needsCompress = displayText.length * charWidth > maxLabelLength;
                  return (
                    <g key={i}>
                      <path
                        d={sliceParts(cx, cy, r, startAngle, endAngle)}
                        fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                      />
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y}
                        fill="#0C1117"
                        fontSize={fontSize}
                        fontFamily="'JetBrains Mono', monospace"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textRotation}, ${labelPoint.x}, ${labelPoint.y})`}
                        textLength={needsCompress ? maxLabelLength : undefined}
                        lengthAdjust={needsCompress ? 'spacingAndGlyphs' : undefined}
                      >
                        {displayText}
                      </text>
                    </g>
                  );
                });
              })()}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--panel)" strokeWidth="3" />
            </svg>
            <button className="wheel-spin-btn" onClick={spin} disabled={spinning}>
              {spinning ? 'Spinning…' : 'Spin!'}
            </button>
          </div>
          {error && <div className="status-msg error">{error}</div>}
        </div>
      </div>

      <div className="wheel-tool-results">
        <div className="wheel-tab-toggle">
          <button
            type="button"
            className={`wheel-tab-btn${tab === 'results' ? ' active' : ''}`}
            onClick={() => setTab('results')}
          >
            Results
          </button>
          <button
            type="button"
            className={`wheel-tab-btn${tab === 'config' ? ' active' : ''}`}
            onClick={() => setTab('config')}
          >
            Config
          </button>
        </div>

        {tab === 'config' ? (
          <div className="wheel-config-tab">
            <div className="wheel-config-header">
              <label className="wheel-duration-row">
                <span className="wheel-duration-label">Spin Duration (seconds)</span>
                <input
                  type="number"
                  className="wheel-duration-input"
                  min="0.5"
                  step="0.5"
                  value={spinDurationSec}
                  onChange={(e) => setSpinDurationSec(e.target.value)}
                />
              </label>
              <div className="wheel-config-select-row">
                <select
                  className="wheel-config-select"
                  value={activeConfigId}
                  onChange={(e) => selectConfig(e.target.value)}
                >
                  {configs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  className="wheel-config-action-btn"
                  onClick={() => setCreatingConfig(true)}
                  title="New wheel"
                >
                  + New
                </button>
                <button
                  className="wheel-config-action-btn"
                  onClick={deleteActiveConfig}
                  disabled={configs.length <= 1}
                  title="Delete this wheel"
                >
                  Delete
                </button>
              </div>
              {creatingConfig && (
                <div className="wheel-add-row">
                  <input
                    type="text"
                    placeholder="Wheel name…"
                    value={newConfigName}
                    autoFocus
                    onChange={(e) => setNewConfigName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createConfig();
                      if (e.key === 'Escape') {
                        setCreatingConfig(false);
                        setNewConfigName('');
                      }
                    }}
                  />
                  <button className="primary" onClick={createConfig}>
                    Create
                  </button>
                </div>
              )}
            </div>

            <div className="wheel-options-list">
              {options.map((option, i) => (
                <div className="wheel-option-item" key={i}>
                  <span
                    className="wheel-option-swatch"
                    style={{ background: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
                  />
                  {editingIndex === i ? (
                    <>
                      <input
                        type="text"
                        className="wheel-option-edit-input"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <button
                        className="wheel-option-action"
                        onClick={saveEdit}
                        aria-label="Save"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        className="wheel-option-action"
                        onClick={cancelEdit}
                        aria-label="Cancel edit"
                        title="Cancel"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="wheel-option-text">{option}</span>
                      <button
                        className="wheel-option-action"
                        onClick={() => startEdit(i)}
                        aria-label={`Edit ${option}`}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="wheel-option-remove"
                        onClick={() => removeOption(i)}
                        aria-label={`Remove ${option}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="wheel-add-options-row">
              <textarea
                className="wheel-add-textarea"
                placeholder="Add options — one per line. Paste multiple lines to add them all at once."
                value={newOption}
                rows={3}
                onChange={(e) => setNewOption(e.target.value)}
              />
              <button className="primary wheel-add-options-btn" onClick={addOptions}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <div className="wheel-config-tab">
            <div className="wheel-tool-heading">
              Current Result{history.length > 0 && <span className="wheel-attempt">#{history[0].attempt}</span>}
            </div>
            {history.length === 0 ? (
              <p className="hint">Spin the wheel to pick an option.</p>
            ) : (
              <div className="wheel-result-value">{history[0].winner}</div>
            )}

            {history.length > 1 && (
              <>
                <div className="wheel-tool-heading wheel-tool-heading-secondary">Past Results</div>
                <div className="wheel-history">
                  {history
                    .slice(1)
                    .sort((a, b) => a.attempt - b.attempt)
                    .map((spinResult) => (
                      <div className="wheel-history-item" key={spinResult.attempt}>
                        <span className="wheel-attempt">#{spinResult.attempt}</span>
                        <span>{spinResult.winner}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {popupResult && (
        <div className="wheel-result-popup-backdrop" onClick={() => setPopupResult(null)}>
          <div className="wheel-result-popup" onClick={(e) => e.stopPropagation()}>
            <div className="wheel-result-popup-label">We've selected</div>
            <div className="wheel-result-popup-value">{popupResult.winner}</div>
            <button className="primary" onClick={() => setPopupResult(null)}>
              Nice!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
