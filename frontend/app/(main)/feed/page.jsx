'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import CreatePost from '@/components/social/CreatePost';
import PostCard from '@/components/social/PostCard';
import { Loader2, AlertCircle, Newspaper, Tag } from 'lucide-react';
import { fadeUp, fadeIn, fadeLeft, stagger, pageVariants } from '@/lib/motion';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const categories = ['All', 'Tech', 'Design', 'Languages', 'Business', 'General'];

  async function fetchFeed(pageNum = 1, append = false, tagFilter = 'All') {
    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const params = { page: pageNum, limit: 10 };
      if (tagFilter !== 'All') params.skillTag = tagFilter;
      const { data } = await api.get('/social/feed', { params });
      const newPosts = data.data || [];
      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load social feed:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => { fetchFeed(1, false, activeCategory); }, [activeCategory]);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6 sm:mb-8">
        <Newspaper className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-black text-foreground">Social Feed</h1>
          <p className="text-xs text-muted-foreground mt-1">Share learnings, insights, and showcase skills with peers.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-6">
          <CreatePost onPostCreated={(p) => setPosts((prev) => [p, ...prev])} />

          {/* Category Tabs */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="flex gap-2 overflow-x-auto pb-2 border-b border-border"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {isLoading ? (
            <div className="card p-12 rounded-2xl flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-xs text-muted-foreground">Loading social logs...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-12 rounded-2xl border-dashed text-center flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground">No posts in this category yet. Be the first to share!</p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {posts.map((post) => (
                <motion.div key={post._id} variants={fadeUp}>
                  <PostCard post={post} onDelete={async (id) => {
                    if (!confirm('Delete this post?')) return;
                    try { await api.delete(`/social/posts/${id}`); setPosts((p) => p.filter((x) => x._id !== id)); }
                    catch (err) { console.error(err); }
                  }} />
                </motion.div>
              ))}
              {hasMore && (
                <button
                  onClick={() => fetchFeed(page + 1, true, activeCategory)}
                  disabled={isLoadingMore}
                  className="w-full py-3 border border-border rounded-2xl text-xs font-bold text-muted-foreground hover:bg-muted flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading...</> : 'Load More Posts'}
                </button>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <motion.div
            variants={fadeLeft}
            whileInView="show"
            initial="hidden"
            viewport={{ once: true }}
            className="card p-6 rounded-2xl"
          >
            <h3 className="font-bold text-sm text-card-foreground mb-4 pb-2 border-b border-border flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-primary" /> Popular tags
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {['#nextjs', '#nodejs', '#spanish', '#figma', '#python', '#copywriting', '#rust', '#ai'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveCategory(tag.replace('#', '').replace(/^./, (c) => c.toUpperCase()))}
                  className="px-2.5 py-1 rounded-lg border border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all font-semibold"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeLeft}
            whileInView="show"
            initial="hidden"
            viewport={{ once: true }}
            className="card p-6 rounded-2xl text-xs leading-relaxed text-muted-foreground bg-primary/5 border-primary/20"
          >
            <h4 className="font-bold text-xs text-card-foreground mb-2">📢 Community Guidelines</h4>
            <p>Knorvex is a supportive barter community. Share helpful tips, ask design questions, list skill exchanges, and be respectful. Bad behavior or spam will lead to account deactivation.</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
