import { useAppContext } from '../contexts/AppContext';
import nlpService from '../services/nlpService';
import FeedScreenContent from './shared/FeedScreenContent';
import { ScreenHeader } from './shared/AppScreenPrimitives';

export default function PeerSupportWallPage() {
  const { wallPosts, addWallPost, setWallPosts } = useAppContext();

  return (
    <section className="feed-screen">
      <ScreenHeader
        title="Peer Support Wall"
        subtitle="Named support posts by phase and topic, with resources surfaced before anything goes live."
      />
      <FeedScreenContent
        posts={wallPosts}
        onAddPost={(post) => addWallPost(post)}
        onReply={(postId, reply) =>
          setWallPosts((current) =>
            current.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    replies: [...(post.replies || []), reply],
                  }
                : post,
            ),
          )
        }
        onVote={(postId, direction) =>
          setWallPosts((current) =>
            current.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    upvotes: post.upvotes + (direction === 'up' ? 1 : 0),
                    downvotes: post.downvotes + (direction === 'down' ? 1 : 0),
                  }
                : post,
            ),
          )
        }
        feedType="wall"
        moderate={nlpService.moderate}
        emptyText="Be the first to post to the wall."
        composeTitle="Submit Support Post"
        composePlaceholder="Share support, what helped, or something others in service may need to hear."
      />
    </section>
  );
}
