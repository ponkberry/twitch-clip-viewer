import type { TwitchAuthStatus } from '../hooks/useTwitchAuth';

interface TwitchAuthProps {
  status: TwitchAuthStatus;
  error: string | null;
}

export function TwitchAuth({ status, error }: TwitchAuthProps) {
  if (status === 'signed-in') return null;

  return (
    <div className="input-card">
      <div className="tab-panel active">
        <p className="hint">Connect with Twitch using the button in the top right to get started.</p>
        {status === 'error' && error && <div className="status-msg error">{error}</div>}
      </div>
    </div>
  );
}
