import { useState, useEffect } from 'react';
import { FiSend, FiHeart, FiBookmark, FiShare2, FiMessageSquare, FiEdit, FiTrash2, FiSearch, FiChevronDown, FiChevronUp, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Blog = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showMoreBlogs, setShowMoreBlogs] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [userBlogLimit, setUserBlogLimit] = useState(null);

  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    profession: ''
  });

  const [editBlog, setEditBlog] = useState({
    title: '',
    content: '',
    profession: ''
  });

  // Fetch blogs
  const fetchBlogs = async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        filter: activeTab,
        search: searchQuery
      });

      const response = await fetch(`${BACKEND_URL}/api/blogs?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        if (reset) {
          setBlogs(data.data);
          setPage(1);
        } else {
          setBlogs(prev => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
      } else {
        setError(data.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user blog limit
  const fetchUserBlogLimit = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/blogs/user/count`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setUserBlogLimit(data.data);
      }
    } catch (err) {
      console.error('Error fetching blog limit:', err);
    }
  };

  useEffect(() => {
    fetchBlogs(true);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (user) {
      fetchUserBlogLimit();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) return;

    if (!user) {
      alert('Please login to create a blog post');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newBlog)
      });

      const data = await response.json();

      if (data.success) {
        setNewBlog({ title: '', content: '', profession: '' });
        setShowForm(false);
        fetchBlogs(true);
        fetchUserBlogLimit();
        alert('Blog created successfully!');
      } else {
        alert(data.message || 'Failed to create blog');
      }
    } catch (err) {
      console.error('Error creating blog:', err);
      alert('Failed to create blog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/blogs/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editBlog)
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        fetchBlogs(true);
        alert('Blog updated successfully!');
      } else {
        alert(data.message || 'Failed to update blog');
      }
    } catch (err) {
      console.error('Error updating blog:', err);
      alert('Failed to update blog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (id) => {
    if (!user) {
      alert('Please login to like blogs');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/blogs/${id}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setBlogs(blogs.map((blog) => {
          if (blog._id === id) {
            return {
              ...blog,
              isLiked: data.isLiked,
              likesCount: data.likesCount
            };
          }
          return blog;
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async (id) => {
    if (!user) {
      alert('Please login to bookmark blogs');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/blogs/${id}/bookmark`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setBlogs(blogs.map((blog) => {
          if (blog._id === id) {
            return {
              ...blog,
              isBookmarked: data.isBookmarked
            };
          }
          return blog;
        }));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setBlogs(blogs.filter((blog) => blog._id !== id));
        fetchUserBlogLimit();
        alert('Blog deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete blog');
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Failed to delete blog. Please try again.');
    }
  };

  const startEditing = (blog) => {
    setEditingId(blog._id);
    setEditBlog({
      title: blog.title,
      content: blog.content,
      profession: blog.author.profession
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleShowForm = () => {
    if (!user) {
      alert('Please login to create a blog post');
      return;
    }

    if (userBlogLimit && !userBlogLimit.canCreate) {
      alert(`You have reached the maximum limit of ${userBlogLimit.limit} blogs. Please delete an existing blog to create a new one.`);
      return;
    }

    setShowForm(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const canEditOrDelete = (blog) => {
    return user && blog.author.userId === user._id;
  };

  return (
    <div className="min-h-screen bg-[#e6f0ff] flex flex-col pt-16 md:pt-[72px] xl:pt-20">
      <div className="container mx-auto px-4 pb-8 md:pb-12 max-w-7xl flex-grow">
        {!showForm ? (
          <>
            <div className="bg-[#e6f0ff] rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'bookmarked'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 capitalize ${
                        activeTab === tab 
                          ? 'bg-blue-900 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search blogs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all bg-white text-gray-800 placeholder-gray-400"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900" />
                </div>
              </div>

              {userBlogLimit && user && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    Blog Limit: <span className="font-semibold">{userBlogLimit.current} / {userBlogLimit.limit}</span>
                    {userBlogLimit.remaining > 0 && (
                      <span className="ml-2 text-blue-600">({userBlogLimit.remaining} remaining)</span>
                    )}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {isLoading && blogs.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
                </div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-[#e6f0ff] rounded-xl p-8">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                    <p className="text-gray-800 text-lg">
                      {activeTab === 'bookmarked' ? 'No bookmarked blogs yet.' : 'No blogs found. Be the first to share your experience!'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {(showMoreBlogs ? blogs : blogs.slice(0, 3)).map((blog) => (
                    <article
                      key={blog._id}
                      className="bg-[#e6f0ff] rounded-xl p-6 transition-all duration-300 border border-gray-100"
                    >
                      {editingId === blog._id ? (
                        <form onSubmit={handleEditSubmit} className="space-y-5">
                          <input
                            type="text"
                            name="title"
                            value={editBlog.title}
                            onChange={handleEditInputChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-xl font-bold text-blue-900 bg-white"
                          />
                          <input
                            type="text"
                            name="profession"
                            value={editBlog.profession}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm text-gray-800 bg-white"
                            placeholder="Profession"
                          />
                          <textarea
                            name="content"
                            value={editBlog.content}
                            onChange={handleEditInputChange}
                            required
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-gray-800 bg-white"
                          ></textarea>
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-100 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-all disabled:opacity-50"
                            >
                              {isLoading ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-blue-900 hover:text-blue-800 transition-colors">
                              {blog.title}
                            </h3>
                            {canEditOrDelete(blog) && (
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => startEditing(blog)}
                                  className="text-blue-900 hover:text-blue-800 transition-all transform hover:scale-110"
                                  title="Edit"
                                >
                                  <FiEdit size={20} />
                                </button>
                                <button
                                  onClick={() => handleDelete(blog._id)}
                                  className="text-blue-900 hover:text-red-500 transition-all transform hover:scale-110"
                                  title="Delete"
                                >
                                  <FiTrash2 size={20} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-start mb-4">
                            <div className="relative mr-3">
                              <img 
                                src={blog.author.imageUrl} 
                                alt={blog.author.name} 
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
                                }}
                              />
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-900 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-medium text-gray-800">{blog.author.name}</span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-600 text-sm">{blog.author.profession}</span>
                              </div>
                              <span className="text-gray-600 text-sm">{formatDate(blog.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">{blog.content}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex space-x-6">
                              <button
                                onClick={() => handleLike(blog._id)}
                                className={`flex items-center space-x-2 transition-all transform hover:scale-110 ${
                                  blog.isLiked ? 'text-red-500' : 'text-blue-900'
                                }`}
                                disabled={!user}
                              >
                                <FiHeart className={blog.isLiked ? 'fill-current animate-pulse' : ''} size={20} />
                                <span className="text-gray-800 font-medium">{blog.likesCount || 0}</span>
                              </button>
                              <button
                                className="flex items-center space-x-2 text-blue-900 hover:text-blue-800 transition-all transform hover:scale-110"
                              >
                                <FiMessageSquare size={20} />
                                <span className="text-gray-800 font-medium">{blog.commentsCount || 0}</span>
                              </button>
                            </div>
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleBookmark(blog._id)}
                                className={`transition-all transform hover:scale-110 ${
                                  blog.isBookmarked ? 'text-blue-900' : 'text-blue-900'
                                }`}
                                title={blog.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                                disabled={!user}
                              >
                                <FiBookmark className={blog.isBookmarked ? 'fill-current' : ''} size={20} />
                              </button>
                              <button
                                className="text-blue-900 hover:text-blue-800 transition-all transform hover:scale-110"
                                title="Share"
                                onClick={() => {
                                  if (navigator.share) {
                                    navigator.share({
                                      title: blog.title,
                                      text: blog.content.substring(0, 100) + '...',
                                      url: window.location.href
                                    });
                                  }
                                }}
                              >
                                <FiShare2 size={20} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center mt-6 gap-4">
              {blogs.length > 3 && (
                <button
                  onClick={() => setShowMoreBlogs(!showMoreBlogs)}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  {showMoreBlogs ? <FiChevronUp /> : <FiChevronDown />}
                  <span>{showMoreBlogs ? 'Show Less Blogs' : 'Show More Blogs'}</span>
                </button>
              )}
              <button
                onClick={handleShowForm}
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <FiSend />
                <span>Add Blog</span>
              </button>
            </div>
          </>
        ) : (
          <div className="bg-[#e6f0ff] rounded-2xl p-8 border border-gray-100 max-w-2xl mx-auto mt-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center relative">
              Share Your Experience
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-blue-900 rounded"></span>
            </h2>

            {userBlogLimit && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-800">
                  You have <span className="font-semibold">{userBlogLimit.remaining}</span> blog slots remaining 
                  (Limit: {userBlogLimit.limit})
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-800 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newBlog.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all duration-300 text-gray-800 placeholder-gray-400"
                  placeholder="Enter your blog title"
                />
              </div>
              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-800 mb-2">
                  Your Profession
                </label>
                <input
                  type="text"
                  id="profession"
                  name="profession"
                  value={newBlog.profession}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all duration-300 text-gray-800 placeholder-gray-400"
                  placeholder="e.g., Software Developer, Designer"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-800 mb-2">
                  Your Experience *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={newBlog.content}
                  onChange={handleInputChange}
                  required
                  maxLength={5000}
                  rows="8"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all duration-300 text-gray-800 placeholder-gray-400"
                  placeholder="Share your skill-swapping experience..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {newBlog.content.length} / 5000 characters
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className={isLoading ? 'animate-pulse' : ''} />
                  <span>{isLoading ? 'Creating...' : 'Create Blog'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-100 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
