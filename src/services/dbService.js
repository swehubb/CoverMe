import { supabase } from './supabase';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── IPPT ──────────────────────────────────────────────────────────────────────

export async function loadIpptAttempts(supabaseId) {
  const { data, error } = await supabase
    .from('ippt_attempts')
    .select('*')
    .eq('user_id', supabaseId)
    .order('date', { ascending: true });
  if (error) { console.warn('[db] loadIpptAttempts:', error.message); return null; }
  return data.map((row) => ({
    date: row.date,
    pushups: row.pushups,
    situps: row.situps,
    runSeconds: row.run_seconds,
    _dbId: row.id,
  }));
}

export async function saveIpptAttempt(supabaseId, attempt) {
  if (!supabaseId) return null;
  const { data, error } = await supabase
    .from('ippt_attempts')
    .insert({ user_id: supabaseId, date: attempt.date, pushups: attempt.pushups, situps: attempt.situps, run_seconds: attempt.runSeconds })
    .select('id')
    .single();
  if (error) { console.warn('[db] saveIpptAttempt:', error.message); return null; }
  return data?.id ?? null;
}

export async function updateIpptAttempt(dbId, attempt) {
  if (!dbId) return;
  const { error } = await supabase
    .from('ippt_attempts')
    .update({ date: attempt.date, pushups: attempt.pushups, situps: attempt.situps, run_seconds: attempt.runSeconds })
    .eq('id', dbId);
  if (error) console.warn('[db] updateIpptAttempt:', error.message);
}

export async function deleteIpptAttempt(dbId) {
  if (!dbId) return;
  const { error } = await supabase.from('ippt_attempts').delete().eq('id', dbId);
  if (error) console.warn('[db] deleteIpptAttempt:', error.message);
}

// ── JOURNAL ───────────────────────────────────────────────────────────────────

export async function loadJournalEntries(supabaseId) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', supabaseId)
    .order('entry_timestamp', { ascending: true });
  if (error) { console.warn('[db] loadJournalEntries:', error.message); return null; }
  return data.map((row) => ({
    id: row.id,
    timestamp: row.entry_timestamp,
    prompt: row.prompt,
    text: row.text,
    sentiment: { score: row.sentiment_score, crisis: row.sentiment_crisis, dominant: row.sentiment_dominant },
    _dbId: row.id,
  }));
}

export async function saveJournalEntry(supabaseId, entry) {
  if (!supabaseId) return;
  const { error } = await supabase.from('journal_entries').insert({
    user_id: supabaseId,
    entry_timestamp: entry.timestamp || new Date().toISOString(),
    prompt: entry.prompt,
    text: entry.text,
    sentiment_score: entry.sentiment?.score,
    sentiment_crisis: entry.sentiment?.crisis ?? false,
    sentiment_dominant: entry.sentiment?.dominant,
  });
  if (error) console.warn('[db] saveJournalEntry:', error.message);
}

// ── TRAINING FEED ─────────────────────────────────────────────────────────────

export async function loadFeedPosts() {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*, feed_reactions(*), feed_comments(*)')
    .order('created_at', { ascending: false });
  if (error) { console.warn('[db] loadFeedPosts:', error.message); return null; }
  return data.map((row) => ({
    id: row.id,
    name: row.author_name,
    unit: row.author_unit,
    recency: timeAgo(row.created_at),
    headline: row.title,
    statline: row.statline,
    detail: row.body,
    chips: row.chips || [],
    photos: row.photos || [],
    feeling: row.feeling,
    reactions: {},
    userReaction: null,
    comments: (row.feed_comments || []).map((c) => ({
      id: c.id,
      author: c.author_name,
      text: c.text,
      recency: timeAgo(c.created_at),
    })),
    _dbId: row.id,
  }));
}

export async function saveFeedPost(supabaseId, post) {
  if (!supabaseId) return null;
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      user_id: supabaseId,
      author_name: post.name || post.author_name,
      author_unit: post.unit,
      title: post.headline || post.title,
      body: post.detail || post.body,
      statline: post.statline,
      chips: post.chips || [],
      photos: post.photos || [],
      feeling: post.feeling,
    })
    .select('id')
    .single();
  if (error) { console.warn('[db] saveFeedPost:', error.message); return null; }
  return data?.id ?? null;
}

export async function saveFeedComment(postDbId, supabaseId, authorName, text) {
  if (!supabaseId || !postDbId) return;
  const { error } = await supabase.from('feed_comments').insert({
    post_id: postDbId,
    user_id: supabaseId,
    author_name: authorName,
    text,
  });
  if (error) console.warn('[db] saveFeedComment:', error.message);
}

// ── WALL ──────────────────────────────────────────────────────────────────────

export async function loadWallPosts() {
  const { data, error } = await supabase
    .from('wall_posts')
    .select('*, wall_replies(*)')
    .order('created_at', { ascending: false });
  if (error) { console.warn('[db] loadWallPosts:', error.message); return null; }
  return data.map((row) => ({
    id: row.id,
    author: row.author_alias,
    phase: row.phase,
    topic: row.topic,
    title: row.title,
    content: row.content,
    distressFlag: row.distress_flag,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    createdAt: row.created_at,
    replies: (row.wall_replies || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((r) => ({ id: r.id, author: r.author_alias, text: r.text, createdAt: r.created_at })),
    _dbId: row.id,
  }));
}

export async function saveWallPost(supabaseId, post) {
  if (!supabaseId) return null;
  const { data, error } = await supabase
    .from('wall_posts')
    .insert({
      user_id: supabaseId,
      author_alias: post.author || 'Anonymous NSF',
      phase: post.phase,
      topic: post.topic,
      title: post.title,
      content: post.content,
      distress_flag: post.distressFlag || false,
    })
    .select('id')
    .single();
  if (error) { console.warn('[db] saveWallPost:', error.message); return null; }
  return data?.id ?? null;
}

export async function saveWallReply(postDbId, supabaseId, text) {
  if (!supabaseId || !postDbId) return;
  const { error } = await supabase.from('wall_replies').insert({
    post_id: postDbId,
    user_id: supabaseId,
    author_alias: 'Anonymous NSF',
    text,
  });
  if (error) console.warn('[db] saveWallReply:', error.message);
}

// ── BUDDY TAP ─────────────────────────────────────────────────────────────────

export async function saveBuddyTap(supabaseId, toMemberId, note) {
  if (!supabaseId) return;
  const { error } = await supabase.from('buddy_taps').insert({
    from_user_id: supabaseId,
    to_member_id: toMemberId,
    note,
  });
  if (error) console.warn('[db] saveBuddyTap:', error.message);
}

export async function loadBuddyTapCounts(toMemberId) {
  const { count, error } = await supabase
    .from('buddy_taps')
    .select('*', { count: 'exact', head: true })
    .eq('to_member_id', toMemberId);
  if (error) { console.warn('[db] loadBuddyTapCounts:', error.message); return 0; }
  return count ?? 0;
}

// ── OUTREACH ──────────────────────────────────────────────────────────────────

export async function saveOutreachPrompt(toMemberId, reason) {
  const { error } = await supabase.from('outreach_prompts').insert({
    to_member_id: toMemberId,
    reason,
    status: 'pending',
  });
  if (error) console.warn('[db] saveOutreachPrompt:', error.message);
}
