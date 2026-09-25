import { useState } from 'react';
import type { Clip } from './types';
import { useTwitchAuth } from './hooks/useTwitchAuth';
import { useChannelSearch } from './hooks/useChannelSearch';
import { usePlaylists } from './hooks/usePlaylists';
import { useRoute } from './hooks/useRoute';
import { Header } from './components/Header';
import { TwitchAuth } from './components/TwitchAuth';
import { ChannelResults } from './components/ChannelResults';
import { ChannelDetails } from './components/ChannelDetails';
import { Player } from './components/Player';
import { PlaylistPanel } from './components/PlaylistPanel';
import { Loading } from './components/Loading';
import { ToolsPage } from './components/ToolsPage';

export default function App() {
  const { status, clientId, accessToken, displayName, profileImageUrl, error, connect, disconnect } = useTwitchAuth();
  const search = useChannelSearch(clientId, accessToken ?? '');
  const playlists = usePlaylists();

  const { section, toolId, navigate } = useRoute();
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [addToListError, setAddToListError] = useState<string | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const searchCurrentClip = search.playingIndex >= 0 ? (search.clips[search.playingIndex] ?? null) : null;
  const currentClip = activeClip ?? searchCurrentClip;

  function handleSearchPlay(index: number) {
    setActiveClip(null);
    search.setPlayingIndex(index);
  }

  function handleAddToList(clip: Clip) {
    if (!playlists.activePlaylistId) {
      setAddToListError('Create a list first, then add clips to it.');
      return;
    }
    setAddToListError(null);
    playlists.addClipToPlaylist(playlists.activePlaylistId, clip);
  }

  return (
    <>
      {!headerCollapsed && (
        <Header
          status={status}
          displayName={displayName}
          profileImageUrl={profileImageUrl}
          connect={connect}
          disconnect={disconnect}
          channel={search.channel}
          onChannelChange={search.setChannel}
          onSearch={search.handleSearch}
          searching={search.searching}
          section={section}
          onSectionChange={navigate}
        />
      )}
      <button
        className="header-toggle"
        onClick={() => setHeaderCollapsed((v) => !v)}
        aria-label={headerCollapsed ? 'Show header' : 'Hide header'}
        title={headerCollapsed ? 'Show header' : 'Hide header'}
      >
        {headerCollapsed ? '▾' : '▴'}
      </button>
      {section === 'clips' && (
        <div className="local-time-note">All dates and times shown are your local time.</div>
      )}
      <main className={`stage${section === 'tools' ? ' stage-tools' : ''}`}>
        {section === 'tools' ? (
          <ToolsPage toolId={toolId} onSelectTool={(id) => navigate('tools', id)} />
        ) : status === 'connecting' ? (
          <Loading />
        ) : status === 'signed-in' && accessToken ? (
          <div className="workspace">
            <aside className="col-search">
              <ChannelResults
                error={search.error}
                channelInfo={search.channelInfo}
                clips={search.clips}
                isSearchResult={search.isSearchResult}
                searching={search.searching}
                categoryNames={search.categoryNames}
                playingIndex={search.playingIndex}
                onPlay={handleSearchPlay}
                clipLookupLoading={search.clipLookupLoading}
                indexingClips={search.indexingClips}
                onClipSearch={search.handleClipSearch}
                onAddToList={handleAddToList}
              />
            </aside>
            <div className="col-player">
              {search.channelInfo && (
                <ChannelDetails
                  info={search.channelInfo}
                  indexingClips={search.indexingClips}
                  indexedCount={search.indexedCount}
                />
              )}
              <Player clip={currentClip} />
            </div>
            <aside className="col-extra">
              <PlaylistPanel
                playlists={playlists.playlists}
                activePlaylistId={playlists.activePlaylistId}
                setActivePlaylistId={playlists.setActivePlaylistId}
                createPlaylist={playlists.createPlaylist}
                renamePlaylist={playlists.renamePlaylist}
                deletePlaylist={playlists.deletePlaylist}
                removeClipFromPlaylist={playlists.removeClipFromPlaylist}
                activeClip={activeClip}
                onPlay={setActiveClip}
                addError={addToListError}
              />
            </aside>
          </div>
        ) : (
          <TwitchAuth status={status} error={error} />
        )}
      </main>
    </>
  );
}
