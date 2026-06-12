'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import RankBadge from '@/components/shared/RankBadge';
import Avatar from '@/components/shared/Avatar';
import { Heart, MessageSquare, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function PostCard({ post, onDelete }) {
  const { user: currentUser } = useAuthStore();
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const author = post.user || {};
  const isAuthor = currentUser && currentUser.id === author._id;

  const handleLike = async () => {
    try {
      if (hasLiked) {
        await api.post(`/social/posts/${post._id}/unlike`);
        setLikes((p) => p - 1); setHasLiked(false);
      } else {
        await api.post(`/social/posts/${post._id}/like`);
        setLikes((p) => p + 1); setHasLiked(true);
      }
    } catch (err) { console.error(err); }
  };

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/social/posts/${post._id}/comments`);
      setComments(data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) loadComments();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/social/posts/${post._id}/comments`, { content: commentText });
      setCommentText('');
      await loadComments();
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const renderCommentThread = (allComments, parentId = null, depth = 0) => {
    const level = allComments.filter((c) => {
      if (!parentId) return !c.parentId;
      return c.parentId === parentId || c.parentId?._id === parentId;
    });
    if (!level.length) return null;
    return (
      <div className={`flex flex-col gap-2.5 ${depth > 0 ? 'mt-2 pl-4 border-l-2 border-border' : ''}`}>
        {level.map((comment) => {
          const ca = comment.user || {};
          const isCA = currentUser && currentUser.id === ca._id;
          return (
            <div key={comment._id} className="p-3 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <Avatar
                    src={ca.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${ca._id}`}
                    name={ca.name}
                    className="w-6 h-6 rounded-lg flex-shrink-0"
                  />
                  <div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-xs font-bold text-card-foreground">{ca.name}</span>
                      <RankBadge rank={ca.rank || 'Beginner'} small showEmoji={false} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                  </div>
                </div>
                {isCA && (
                  <button onClick={() => api.delete(`/social/comments/${comment._id}`).then(loadComments)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/8">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-foreground mt-2 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
              {depth < 2 && <div className="mt-2">{renderCommentThread(allComments, comment._id, depth + 1)}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="card rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            <Link href={`/profile/${author._id}`}>
              <Avatar
                src={author.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${author._id}`}
                name={author.name}
                className="w-10 h-10 rounded-xl"
              />
            </Link>
            <div>
              <div className="flex gap-2 items-center flex-wrap">
                <Link href={`/profile/${author._id}`} className="font-bold text-[14px] text-card-foreground hover:text-primary transition-colors">{author.name}</Link>
                <RankBadge rank={author.rank || 'Beginner'} small />
              </div>
              <div className="flex gap-1.5 items-center text-xs text-muted-foreground mt-0.5">
                <span>@{(author.name || 'user').split(' ')[0].toLowerCase()}</span>
                <span className="opacity-40">·</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {isAuthor && onDelete && (
            <button onClick={() => onDelete(post._id)} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-xl hover:bg-destructive/8">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skill tag */}
        {post.skillTag && (
          <span className="inline-flex items-center text-[11px] uppercase tracking-wider font-bold text-primary border border-primary/20 bg-primary/5 px-2.5 py-1 rounded-full mb-3">
            {post.skillTag}
          </span>
        )}

        {/* Content */}
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

        {/* Media */}
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden mb-4 border border-border max-h-96 bg-muted">
            <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-all px-3 py-1.5 rounded-lg ${
            hasLiked
              ? 'text-red-500 bg-red-50 dark:bg-red-500/10'
              : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
          }`}>
          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
          {likes} {likes === 1 ? 'Like' : 'Likes'}
        </button>
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/8 px-3 py-1.5 rounded-lg transition-all">
          <MessageSquare className="w-3.5 h-3.5" />
          {post.commentsCount || comments.length || 0} Comments
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-5 pb-5 pt-4 border-t border-border flex flex-col gap-4 animate-fade-in">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Add to the conversation..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </form>
          {comments.length === 0
            ? <p className="text-xs text-muted-foreground italic py-1">No comments yet. Be the first to reply!</p>
            : <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">{renderCommentThread(comments)}</div>
          }
        </div>
      )}
    </div>
  );
}
