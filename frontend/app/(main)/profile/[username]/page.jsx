'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { uploadImage } from '@/lib/uploadImage';
import CoinDisplay from '@/components/shared/CoinDisplay';
import RankBadge from '@/components/shared/RankBadge';
import SkillTag from '@/components/shared/SkillTag';
import { MapPin, Globe, Sparkles, Loader2, Edit2, Check, Star, Users, BookOpen, Plus, Trash2, MessageSquare, Camera } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.username;

  const { user: currentUser, fetchMe } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [skills, setSkills] = useState([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLanguages, setEditLanguages] = useState('');

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDir, setNewSkillDir] = useState('teach');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const isOwnProfile = currentUser && (currentUser.id === userId || currentUser._id === userId);

  async function loadProfile() {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError('');
      const requests = [api.get(`/users/${userId}`)];
      if (currentUser && !isOwnProfile) requests.push(api.get(`/users/${userId}/followers`));

      const [profileRes, followsRes] = await Promise.all(requests);
      const profile = profileRes.data.data?.user;
      setProfileUser(profile);
      setSkills(profileRes.data.data?.skills || []);
      setFollowersCount(profile.followerCount || 0);
      setEditName(profile.name || '');
      setEditBio(profile.bio || '');
      setEditAvatar(profile.avatar || '');
      setEditLocation(profile.location || '');
      setEditLanguages(profile.languages?.join(', ') || 'English');

      if (followsRes) {
        const followers = followsRes.data?.data || [];
        setIsFollowing(followers.some((f) => f._id === currentUser.id || f._id === currentUser._id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user profile.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, [userId]);

  // When viewing own profile, listen for rating updates so stats refresh in real-time
  useEffect(() => {
    if (!currentUser) return;
    const myId = currentUser.id || currentUser._id;
    if (myId !== userId) return; // only own profile updates automatically
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('join', { userId: myId }));
    socket.on('profile:updated', ({ avgRating, rankScore, rank }) => {
      setProfileUser((prev) => prev ? { ...prev, avgRating, rankScore, rank } : prev);
    });
    return () => {
      socket.off('profile:updated');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id || currentUser?._id, userId]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${userId}/follow`);
        setIsFollowing(false);
        setFollowersCount((p) => Math.max(0, p - 1));
      } else {
        await api.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setFollowersCount((p) => p + 1);
      }
    } catch (err) { console.error(err); }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      let finalAvatarUrl = editAvatar;
      if (avatarFile) {
        setIsUploadingAvatar(true);
        finalAvatarUrl = await uploadImage(avatarFile, 'avatars');
        setIsUploadingAvatar(false);
        setAvatarFile(null);
        setAvatarPreview('');
      }
      const { data } = await api.put('/users/me', {
        name: editName, bio: editBio, avatar: finalAvatarUrl, location: editLocation,
        languages: editLanguages.split(',').map((l) => l.trim()).filter(Boolean),
      });
      setProfileUser(data.data?.user);
      setEditAvatar(finalAvatarUrl);
      setIsEditing(false);
      await fetchMe();
    } catch (err) { console.error(err); setIsUploadingAvatar(false); }
    finally { setIsUpdating(false); }
  };

  const handleRegenBioSummary = async () => {
    setIsRegenerating(true);
    try {
      const { data } = await api.post('/ai/profile-summary');
      setProfileUser((p) => ({ ...p, aiSummary: data.data?.aiSummary }));
      await fetchMe();
    } catch (err) { console.error(err); }
    finally { setIsRegenerating(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setIsAddingSkill(true);
    try {
      const { data } = await api.post('/users/me/skills', { name: newSkillName.trim(), direction: newSkillDir, level: newSkillLevel });
      setSkills((p) => [...p, data.data]);
      setNewSkillName('');
      await loadProfile();
    } catch (err) { console.error(err); }
    finally { setIsAddingSkill(false); }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await api.delete(`/users/me/skills/${skillId}`);
      setSkills((p) => p.filter((s) => s._id !== skillId));
    } catch (err) { console.error(err); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <span className="text-xs text-muted-foreground">Resolving member profile...</span>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background text-foreground px-6">
        <p className="text-sm text-destructive font-bold mb-4">{error || 'User not found'}</p>
        <button onClick={() => router.push('/discover')} className="px-4 py-2 bg-muted rounded-xl text-xs font-bold border border-border text-foreground">
          Back to Discover
        </button>
      </div>
    );
  }

  const avatarSrc = profileUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profileUser._id}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground flex flex-col gap-6">

      {/* Profile hero card */}
      <div className="card rounded-3xl overflow-hidden">
        {/* Cover gradient */}
        <div className="h-32 relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-chart-2/20">
          <div className="absolute inset-0 dot-bg opacity-[0.15]" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        <div className="px-4 pb-4 sm:px-7 sm:pb-7 -mt-12 relative">
          {/* Avatar + action row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <img src={avatarSrc} alt={profileUser.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-card bg-muted shadow-lg flex-shrink-0" />
                {profileUser.isProUser && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-black uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded-md">PRO</span>
                )}
              </div>
              <div className="mb-1 flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-foreground leading-tight">{profileUser.name}</h2>
                  <RankBadge rank={profileUser.rank} />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{profileUser.email}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-1">
              {isOwnProfile ? (
                <button onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold border border-border bg-muted/50 hover:bg-muted px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all text-foreground">
                  <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              ) : (
                <>
                  <button onClick={handleFollowToggle}
                    className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      isFollowing ? 'border border-primary/20 bg-primary/5 text-primary' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}>
                    <Users className="w-3.5 h-3.5" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={() => router.push(`/messages?user=${profileUser._id}`)}
                    className="text-xs font-bold border border-border bg-muted/50 hover:bg-muted px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all text-foreground">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info row */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
            {profileUser.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary/60" /> {profileUser.location}
              </span>
            )}
            {profileUser.languages?.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary/60" /> {profileUser.languages.join(', ')}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="card-inset rounded-xl p-3 text-center">
              <div className="text-lg font-black font-mono text-foreground">{followersCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">Followers</div>
            </div>
            <div className="card-inset rounded-xl p-3 text-center">
              <div className="text-lg font-black font-mono text-amber-400 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                {(profileUser.avgRating || 0).toFixed(1)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">{profileUser.ratingCount || 0} Ratings</div>
            </div>
            <div className="card-inset rounded-xl p-3 text-center">
              <div className="text-lg font-black font-mono text-primary">{profileUser.totalSessionsTaught || 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">Sessions Taught</div>
            </div>
            <div className="card-inset rounded-xl p-3 text-center">
              {isOwnProfile
                ? <CoinDisplay amount={profileUser.skillCoinBalance} className="justify-center" />
                : <div className="text-lg font-black font-mono text-foreground">{profileUser.totalSessionsLearned || 0}</div>
              }
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">
                {isOwnProfile ? 'Balance' : 'Sessions Learned'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI summary */}
      {profileUser.aiSummary && (
        <div className="card rounded-2xl p-5 border-primary/15 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-3 right-4 opacity-[0.06] pointer-events-none">
            <Sparkles className="w-20 h-20 text-primary" />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Profile Digest
            </span>
            {isOwnProfile && (
              <button onClick={handleRegenBioSummary} disabled={isRegenerating}
                className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                {isRegenerating ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Regenerating...</> : 'Regenerate'}
              </button>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed italic relative z-10">"{profileUser.aiSummary}"</p>
        </div>
      )}

      {/* Edit form */}
      {isOwnProfile && isEditing && (
        <form onSubmit={handleUpdateProfile} className="card p-6 rounded-2xl flex flex-col gap-5 animate-fade-in">
          <h3 className="font-bold text-base text-card-foreground border-b border-border pb-3">Edit Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avatar upload */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarPreview || editAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-border bg-muted"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 rounded-2xl bg-background/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted hover:border-primary/30 transition-all text-foreground"
                  >
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    {avatarFile ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {avatarFile && (
                    <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{avatarFile.name}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">JPG, PNG or WebP · max 8 MB</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {[
              { label: 'Display Name', value: editName, set: setEditName, type: 'text', ph: 'Jane Doe' },
              { label: 'Location', value: editLocation, set: setEditLocation, type: 'text', ph: 'Mumbai, India' },
              { label: 'Languages (comma-separated)', value: editLanguages, set: setEditLanguages, type: 'text', ph: 'English, Hindi' },
            ].map(({ label, value, set, type, ph }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
                <input type={type} placeholder={ph} value={value} onChange={(e) => set(e.target.value)}
                  className="bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
            ))}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bio</label>
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                className="bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>
          <button type="submit" disabled={isUpdating}
            className="btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2">
            {isUpdating
              ? <><Loader2 className="w-4 h-4 animate-spin" />{isUploadingAvatar ? 'Uploading photo…' : 'Saving…'}</>
              : <><Check className="w-4 h-4" />Save Changes</>
            }
          </button>
        </form>
      )}

      {/* Skills grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { dir: 'teach', label: 'Skills I Can Teach', placeholder: 'Add teach skill (e.g. Next.js)...' },
          { dir: 'learn', label: 'Skills I Want to Learn', placeholder: 'Add learn skill (e.g. Spanish)...' },
        ].map(({ dir, label, placeholder }) => (
          <div key={dir} className="card p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                dir === 'teach' ? 'bg-primary/10 text-primary' : 'bg-chart-2/10 text-chart-2'
              }`}>
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-card-foreground">{label}</h3>
              <span className="ml-auto text-[10px] font-bold bg-muted/60 border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                {skills.filter((s) => s.direction === dir).length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[48px]">
              {skills.filter((s) => s.direction === dir).length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">No {dir} skills listed yet.</p>
              ) : skills.filter((s) => s.direction === dir).map((skill) => (
                <div key={skill._id} className="relative group">
                  <SkillTag name={skill.name} direction={skill.direction} level={skill.level} />
                  {isOwnProfile && (
                    <button onClick={() => handleDeleteSkill(skill._id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isOwnProfile && (
              <form onSubmit={(e) => { setNewSkillDir(dir); handleAddSkill(e); }}
                className="mt-2 pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder={placeholder} value={newSkillName}
                  onChange={(e) => { setNewSkillName(e.target.value); setNewSkillDir(dir); }}
                  className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors" />
                <div className="flex gap-2">
                  <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)}
                    className="flex-1 sm:flex-none bg-background border border-input rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:border-primary">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <button type="submit" disabled={isAddingSkill || !newSkillName.trim()}
                    className="btn-primary px-3 py-2 rounded-xl flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
