'use client';

import { useState, useRef } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { uploadImage } from '@/lib/uploadImage';
import Avatar from '@/components/shared/Avatar';
import { Send, Image as ImageIcon, X, Loader2, Upload } from 'lucide-react';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuthStore();
  const [content, setContent]     = useState('');
  const [skillTag, setSkillTag]   = useState('');
  const [mediaFile, setMediaFile] = useState(null);    // File object
  const [mediaPreview, setMediaPreview] = useState(''); // local object URL
  const [isUploading, setIsUploading]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const fileInputRef = useRef(null);

  const userSkills = user?.skills || [];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      let mediaUrl;
      if (mediaFile) {
        setIsUploading(true);
        mediaUrl = await uploadImage(mediaFile, 'posts');
        setIsUploading(false);
      }

      const { data } = await api.post('/social/posts', {
        content,
        skillTag: skillTag || undefined,
        mediaUrl: mediaUrl || undefined,
      });

      setContent('');
      setSkillTag('');
      clearMedia();
      if (onPostCreated) onPostCreated(data.data);
    } catch (err) {
      console.error('Failed to create post:', err);
      setIsUploading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCls = 'bg-background border border-input rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold';

  return (
    <div className="card p-5 rounded-2xl">
      <div className="flex gap-3.5">
        <Avatar
          src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?._id || user?.id}`}
          name={user?.name || ''}
          className="w-10 h-10 rounded-xl flex-shrink-0"
        />

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
          <textarea
            placeholder="What skill did you learn today? Share a tip or update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-transparent border-0 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 resize-none leading-relaxed"
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted max-h-52">
              <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={clearMedia}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 hover:bg-foreground/90 text-background flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs font-semibold text-foreground">Uploading image…</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center justify-between pt-3 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  mediaFile
                    ? 'text-primary border-primary/20 bg-primary/5'
                    : 'text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {mediaFile ? <Upload className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                {mediaFile ? 'Change Image' : 'Add Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Skill tag selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-muted-foreground">Tag:</span>
                <select value={skillTag} onChange={(e) => setSkillTag(e.target.value)} className={selectCls}>
                  <option value="">No tag</option>
                  {userSkills.map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name} ({s.direction === 'teach' ? 'Teach' : 'Learn'})
                    </option>
                  ))}
                  <option value="General">General</option>
                  <option value="Tech">Tech</option>
                  <option value="Design">Design</option>
                  <option value="Languages">Languages</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isUploading ? 'Uploading…' : 'Posting…'}</>
                : <><Send className="w-4 h-4" />Post</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
