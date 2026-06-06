import { createContext, useContext, useMemo, useState } from 'react';
import buddyTapState from '../data/mockBuddyTap';
import { ipptLogs as initialIpptLogs, trainingFeed as initialTrainingFeed } from '../data/mockIPPT';
import { journalEntries as initialJournalEntries } from '../data/mockJournal';
import { peerIntelPosts as initialIntelPosts } from '../data/mockPeerIntel';
import { peerWallPosts as initialWallPosts } from '../data/mockPeerWall';

const AppContext = createContext(null);

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function timestampNow() {
  return new Date().toISOString();
}

export function AppProvider({ children }) {
  const [ipptLogs, setIpptLogs] = useState(initialIpptLogs);
  const [journalEntries, setJournalEntries] = useState(initialJournalEntries);
  const [buddyTaps, setBuddyTaps] = useState(buddyTapState);
  const [wallPosts, setWallPosts] = useState(initialWallPosts);
  const [intelPosts, setIntelPosts] = useState(initialIntelPosts);
  const [trainingFeed, setTrainingFeed] = useState(initialTrainingFeed);
  const [activeModule, setActiveModule] = useState('');
  const [ipptGoal, setIpptGoal] = useState('');
  const [consented, setConsented] = useState(false);

  const addIPPTLog = (log) =>
    setIpptLogs((current) => [
      ...current,
      { id: createId('ippt'), createdAt: timestampNow(), ...log },
    ]);

  const addJournalEntry = (entry) =>
    setJournalEntries((current) => [
      ...current,
      { id: createId('journal'), date: timestampNow().slice(0, 10), ...entry },
    ]);

  const addBuddyTap = (tap) =>
    setBuddyTaps((current) => [
      { id: createId('tap'), createdAt: timestampNow(), ...tap },
      ...current,
    ]);

  const addWallPost = (post) =>
    setWallPosts((current) => [
      { id: createId('wall'), createdAt: timestampNow(), ...post },
      ...current,
    ]);

  const addIntelPost = (post) =>
    setIntelPosts((current) => [
      { id: createId('intel'), createdAt: timestampNow(), ...post },
      ...current,
    ]);

  const value = useMemo(
    () => ({
      ipptLogs,
      setIpptLogs,
      journalEntries,
      setJournalEntries,
      buddyTapState: buddyTaps,
      buddyTaps,
      setBuddyTaps,
      peerWallPosts: wallPosts,
      wallPosts,
      setWallPosts,
      peerIntelPosts: intelPosts,
      intelPosts,
      setIntelPosts,
      trainingFeed,
      setTrainingFeed,
      activeModule,
      setActiveModule,
      ipptGoal,
      setIpptGoal,
      consented,
      setConsented,
      addIPPTLog,
      addJournalEntry,
      addBuddyTap,
      addWallPost,
      addIntelPost,
    }),
    [activeModule, buddyTaps, consented, intelPosts, ipptGoal, ipptLogs, journalEntries, trainingFeed, wallPosts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
