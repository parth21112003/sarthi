import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Heart, MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import communityService from '../services/communityService';
import './Phase2.css';
import './Phase4.css';

const categories = ['', 'Admissions', 'Exams', 'Careers', 'College Life', 'Skills'];

const Community = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postForm, setPostForm] = useState({ title: '', category: 'Careers', content: '' });
  const [comments, setComments] = useState({});

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await communityService.listPosts(filters);
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async (event) => {
    event.preventDefault();
    try {
      const data = await communityService.createPost(postForm);
      setPosts([data.post, ...posts]);
      setPostForm({ title: '', category: 'Careers', content: '' });
      toast.success('Post published');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not publish post');
    }
  };

  const toggleLike = async (postId) => {
    try {
      const data = await communityService.toggleLike(postId);
      setPosts(posts.map((post) => post.id === postId ? data.post : post));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update like');
    }
  };

  const addComment = async (postId) => {
    const content = (comments[postId] || '').trim();
    if (!content) return;
    try {
      const data = await communityService.addComment(postId, content);
      setPosts(posts.map((post) => (
        post.id === postId ? { ...post, comments: [...post.comments, data.comment] } : post
      )));
      setComments({ ...comments, [postId]: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not add comment');
    }
  };

  const deletePost = async (postId) => {
    try {
      await communityService.deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not delete post');
    }
  };

  return (
    <DashboardLayout title="Community">
      <div className="page-stack">
        <Card>
          <form className="composer" onSubmit={createPost}>
            <div className="form-grid">
              <Input label="Title" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} placeholder="Ask or share something useful" />
              <label className="input-wrapper">
                <span className="input-label">Category</span>
                <select className="native-select" value={postForm.category} onChange={(event) => setPostForm({ ...postForm, category: event.target.value })}>
                  {categories.filter(Boolean).map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <Input className="full" label="Post" type="textarea" value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} placeholder="Write your question, experience, or advice." />
            </div>
            <Button type="submit" iconLeft={<Plus size={18} />}>Publish Post</Button>
          </form>
        </Card>

        <Card>
          <form className="toolbar" onSubmit={(event) => { event.preventDefault(); loadPosts(); }}>
            <Input label="Search" icon={<Search size={18} />} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search posts" />
            <label className="input-wrapper">
              <span className="input-label">Category</span>
              <select className="native-select" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
                {categories.map((category) => <option key={category || 'all'} value={category}>{category || 'All categories'}</option>)}
              </select>
            </label>
            <Button type="submit">Filter</Button>
          </form>
        </Card>

        {loading ? (
          <div className="flex-center" style={{ minHeight: 260 }}><Spinner text="Loading posts" /></div>
        ) : posts.length === 0 ? (
          <Card><EmptyState icon={<MessageSquare size={28} />} title="No posts yet" description="Start the first discussion in the community." /></Card>
        ) : posts.map((post) => (
          <Card key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-author">
                <Avatar name={post.user.name} size="sm" />
                <div>
                  <strong>{post.user.name}</strong>
                  <p className="muted small-text">{post.user.role}</p>
                </div>
              </div>
              <div className="post-actions">
                {post.category && <Badge variant="info">{post.category}</Badge>}
                {post.userId === user?.id && (
                  <Button size="sm" variant="danger" iconLeft={<Trash2 size={16} />} onClick={() => deletePost(post.id)}>Delete</Button>
                )}
              </div>
            </div>
            {post.title && <h3>{post.title}</h3>}
            <p className="muted">{post.content}</p>
            <div className="post-actions">
              <Button size="sm" variant={post.likedByMe ? 'primary' : 'secondary'} iconLeft={<Heart size={16} />} onClick={() => toggleLike(post.id)}>
                {post.likeCount}
              </Button>
              <Badge>{post.comments.length} comments</Badge>
            </div>
            <div className="comment-list">
              {post.comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <strong>{comment.user.name}</strong>
                  <p className="muted small-text">{comment.content}</p>
                </div>
              ))}
              <div className="comment-form">
                <input className="message-input" value={comments[post.id] || ''} onChange={(event) => setComments({ ...comments, [post.id]: event.target.value })} placeholder="Add a comment" />
                <Button size="sm" onClick={() => addComment(post.id)}>Comment</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Community;
