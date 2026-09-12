import { useEffect, useRef, useState } from 'react';
import type { TwitchAuthStatus } from '../hooks/useTwitchAuth';
import type { Section } from '../types';

interface HeaderProps {
  status: TwitchAuthStatus;
  displayName: string | null;
  profileImageUrl: string | null;
  disconnect: () => void;
  channel: string;
  onChannelChange: (value: string) => void;
  onSearch: () => void;
  searching: boolean;
  section: Section;
  onSectionChange: (section: Section) => void;
}

export function Header({
  status,
  displayName,
  profileImageUrl,
  disconnect,
  channel,
  onChannelChange,
  onSearch,
  searching,
  section,
  onSectionChange,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <header>
      <div className="header-top">
        <div className="brand">
          <h1>
            Twitch <span>Portal</span>
          </h1>
        </div>

        {status === 'signed-in' && section === 'clips' && (
          <div className="header-search">
            <button
              className="header-search-icon"
              disabled={searching}
              onClick={onSearch}
              aria-label="Search"
              title="Search"
            >
              🔍
            </button>
            <input
              type="text"
              placeholder="Enter a channel name…"
              value={channel}
              onChange={(e) => onChannelChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch();
              }}
            />
          </div>
        )}

        {status === 'signed-in' ? (
          <div className="avatar-menu" ref={menuRef}>
            <button className="avatar-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" />
              ) : (
                <span className="avatar-fallback">{displayName?.[0]?.toUpperCase() ?? '?'}</span>
              )}
            </button>
            {menuOpen && (
              <div className="avatar-dropdown">
                <div className="avatar-dropdown-name">{displayName}</div>
                <button
                  className="primary"
                  onClick={() => {
                    setMenuOpen(false);
                    disconnect();
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="frame-count mono">{status === 'connecting' ? 'Connecting…' : 'Not connected'}</div>
        )}
      </div>

      <div className="sub-header">
        <button
          className={`sub-header-item${section === 'clips' ? ' active' : ''}`}
          onClick={() => onSectionChange('clips')}
        >
          Clips
        </button>
        <button
          className={`sub-header-item${section === 'tools' ? ' active' : ''}`}
          onClick={() => onSectionChange('tools')}
        >
          Tools
        </button>
      </div>
    </header>
  );
}
