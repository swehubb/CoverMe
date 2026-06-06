import { useState } from 'react';
import { crisisResources } from '../../services/mockNotification';
import { wallPhases, wallTopics } from '../../data/mockPeerWall';
import { getToday, shortDate } from './appScreenUtils';
import { Modal } from './AppScreenPrimitives';

export default function FeedScreenContent({
  posts,
  onAddPost,
  onReply,
  onVote,
  feedType,
  moderate,
  emptyText,
  composeTitle,
  composePlaceholder,
  fullWidth = false,
}) {
  const isWall = feedType === 'wall';
  const [primaryFilter, setPrimaryFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDraft, setPostDraft] = useState('');
  const [postPhase, setPostPhase] = useState(wallPhases[1].value);
  const [postTopic, setPostTopic] = useState(wallTopics[0]);
  const [composeError, setComposeError] = useState('');
  const [distressPrompt, setDistressPrompt] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);

  const filterKey = feedType === 'intel' ? 'category' : isWall ? 'phase' : 'topic';
  const filterOptions = isWall
    ? [{ value: 'All', label: 'All' }, ...wallPhases]
    : ['All', ...new Set(posts.map((post) => post[filterKey]).filter(Boolean))].map((value) => ({
        value,
        label: value,
      }));
  const phaseLabel = (value) => wallPhases.find((phase) => phase.value === value)?.label || value;

  const filteredPosts = posts.filter((post) => primaryFilter === 'All' || post[filterKey] === primaryFilter);

  const resetCompose = () => {
    setPostTitle('');
    setPostDraft('');
    setComposeError('');
    setDistressPrompt(false);
    setShowCompose(false);
  };

  const publishWallPost = (distressFlag) => {
    onAddPost({
      id: Date.now(),
      author: 'Anonymous NSF',
      phase: postPhase,
      topic: postTopic,
      title: postTitle.trim() || undefined,
      content: postDraft.trim(),
      createdAt: getToday().toISOString(),
      distressFlag,
      upvotes: 0,
      downvotes: 0,
      replies: [],
    });
    resetCompose();
  };

  const addPost = async () => {
    if (!postDraft.trim()) return;

    if (!isWall) {
      onAddPost({
        id: Date.now(),
        author: 'Anonymous Fieldnote',
        [filterKey]: primaryFilter === 'All' ? 'General' : primaryFilter,
        content: postDraft.trim(),
        createdAt: getToday().toISOString(),
      });
      resetCompose();
      return;
    }

    setPosting(true);
    setComposeError('');
    const verdict = moderate ? await moderate(postDraft.trim()) : { approved: true, distress: false, reason: '' };
    setPosting(false);

    if (!verdict.approved) {
      setComposeError(verdict.reason || 'This post was flagged. Please rephrase to keep this a supportive space.');
      return;
    }

    if (verdict.distress && !distressPrompt) {
      setDistressPrompt(true);
      return;
    }

    publishWallPost(Boolean(verdict.distress) || distressPrompt);
  };

  const submitReply = (postId) => {
    const draft = (replyDrafts[postId] || '').trim();
    if (!draft || !onReply) return;

    onReply(postId, {
      id: `${postId}-${Date.now()}`,
      author: 'Anonymous peer',
      text: draft,
      createdAt: getToday().toISOString(),
    });

    setReplyDrafts((current) => ({ ...current, [postId]: '' }));
    setReplyingToId(null);
  };

  return (
    <>
      <div className="filter-bar">
        <select value={primaryFilter} onChange={(event) => setPrimaryFilter(event.target.value)}>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`feed-list ${fullWidth ? 'feed-list-full' : ''}`}>
        {filteredPosts.length === 0 ? (
          <div className="empty-state">{emptyText}</div>
        ) : (
          filteredPosts.map((post) => {
            const expanded = post.id === expandedId;
            const replyCount = post.replies?.length || 0;

            return (
              <article key={post.id} className="feed-card" onClick={() => setExpandedId(post.id)}>
                <div className="feed-meta">
                  <div>
                    <strong>{post.author}</strong>
                    <span>{shortDate((post.createdAt || getToday().toISOString()).slice(0, 10))}</span>
                  </div>
                  {feedType === 'intel' && <span className="verified-badge">Q&A</span>}
                </div>
                <div className="badge-row">
                  <span className="info-badge">{isWall ? phaseLabel(post.phase) : post[filterKey]}</span>
                  {isWall && post.topic && <span className="info-badge">{post.topic}</span>}
                  {isWall && post.distressFlag && <span className="info-badge distress-badge">Support surfaced</span>}
                </div>
                {feedType === 'wall' && <h3 className="feed-card-title">{post.title || post.topic}</h3>}
                <p className={expanded ? 'feed-card-body' : 'feed-card-body clamped'}>{post.content}</p>
                {feedType === 'wall' && (
                  <div className="feed-thread-meta">
                    <button
                      type="button"
                      className="thread-stat thread-vote"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVote?.(post.id, 'up');
                      }}
                    >
                      ▲ {post.upvotes || 0}
                    </button>
                    <button
                      type="button"
                      className="thread-stat thread-vote"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVote?.(post.id, 'down');
                      }}
                    >
                      ▼ {post.downvotes || 0}
                    </button>
                    <span className="reply-count">
                      {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                )}
                {feedType === 'wall' && expanded && (
                  <div className="reply-thread" onClick={(event) => event.stopPropagation()}>
                    <div className="reply-list">
                      {(post.replies || []).length === 0 ? (
                        <div className="empty-state">No replies yet. Be the first to respond.</div>
                      ) : (
                        (post.replies || []).map((reply) => (
                          <div key={reply.id} className="reply-item">
                            <div className="reply-meta">
                              <strong>{reply.author}</strong>
                              <span>{shortDate((reply.createdAt || getToday().toISOString()).slice(0, 10))}</span>
                            </div>
                            <p>{reply.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {replyingToId === post.id ? (
                      <div className="reply-composer">
                        <textarea
                          value={replyDrafts[post.id] || ''}
                          onChange={(event) =>
                            setReplyDrafts((current) => ({
                              ...current,
                              [post.id]: event.target.value,
                            }))
                          }
                          placeholder="Reply with encouragement, advice, or what helped you."
                          rows={3}
                        />
                        <div className="reply-actions">
                          <button type="button" className="secondary-button reply-button" onClick={() => setReplyingToId(null)}>
                            Cancel
                          </button>
                          <button type="button" className="primary-button small" onClick={() => submitReply(post.id)}>
                            Post reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="secondary-button reply-button" onClick={() => setReplyingToId(post.id)}>
                        Reply to thread
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => setShowCompose(true)}>
        +
      </button>
      {showCompose && (
        <Modal title={composeTitle} onClose={resetCompose}>
          {isWall && (
            <div className="compose-selectors">
              <label>
                <span>Phase</span>
                <select value={postPhase} onChange={(event) => setPostPhase(event.target.value)}>
                  {wallPhases.map((phase) => (
                    <option key={phase.value} value={phase.value}>
                      {phase.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Topic</span>
                <select value={postTopic} onChange={(event) => setPostTopic(event.target.value)}>
                  {wallTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {isWall && (
            <input
              type="text"
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder="Short title (optional)"
            />
          )}
          <textarea
            value={postDraft}
            onChange={(event) => {
              setPostDraft(event.target.value);
              if (composeError) setComposeError('');
            }}
            placeholder={composePlaceholder}
            rows={6}
          />
          {composeError && <p className="inline-warning">{composeError}</p>}
          {distressPrompt ? (
            <div className="distress-banner">
              <strong>You don't have to carry this alone.</strong>
              <p>It sounds like things are heavy right now. You can still post — and these are here for you, only you:</p>
              <ul className="resource-list">
                {crisisResources.resources.slice(0, 3).map((resource) => (
                  <li key={resource.name}>
                    {resource.name}: {resource.number}
                  </li>
                ))}
              </ul>
              <div className="action-grid">
                <button className="primary-button small" onClick={addPost} disabled={posting}>
                  Post anyway
                </button>
                <button className="soft-button" onClick={resetCompose}>
                  Maybe later
                </button>
              </div>
            </div>
          ) : (
            <button className="primary-button" onClick={addPost} disabled={posting}>
              {posting ? 'Checking…' : 'Submit to moderation queue'}
            </button>
          )}
        </Modal>
      )}
    </>
  );
}
