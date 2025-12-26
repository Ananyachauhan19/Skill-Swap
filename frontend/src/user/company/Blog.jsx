import { useState, useEffect } from 'react';
import { FiSend, FiHeart, FiBookmark, FiShare2, FiMessageSquare, FiEdit, FiTrash2, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const Blog = () => {
  const initialBlogs = [
    {
      id: 1,
      title: 'Getting Started with Skill Sharing',
      content: 'Skill sharing is revolutionizing how we learn. I swapped my photography skills for coding lessons, and the experience was transformative. Clarity in what you offer and seek is key.',
      author: 'Alex Johnson',
      profession: 'Photographer',
      date: '2023-05-15',
      likes: 24,
      comments: 5,
      isBookmarked: false,
      isLiked: false,
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 2,
      title: 'My Web Development Journey',
      content: 'In just 3 months of skill swapping, I went from basic HTML to building full-stack apps. I traded graphic design expertise for web development mentorship. The community is amazing!',
      author: 'Sam Wilson',
      profession: 'Graphic Designer',
      date: '2023-06-22',
      likes: 42,
      comments: 12,
      isBookmarked: true,
      isLiked: true,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 3,
      title: 'Language Exchange Success Story',
      content: 'I learned Spanish by swapping with someone who wanted to improve their English. After 3 months of twice-weekly meetups, I’m confident in conversations and gained a friend!',
      author: 'Maria Garcia',
      profession: 'Language Tutor',
      date: '2023-07-10',
      likes: 18,
      comments: 7,
      isBookmarked: false,
      isLiked: false,
      imageUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
    },
  ];

  const [blogs, setBlogs] = useState(initialBlogs);
  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    author: 'Anonymous',
    profession: 'Unknown',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBlog, setEditBlog] = useState({
    title: '',
    content: '',
    author: '',
    profession: '',
    imageUrl: ''
  });
  const [showMoreBlogs, setShowMoreBlogs] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) return;

    const blogToAdd = {
      ...newBlog,
      id: Math.max(...blogs.map((blog) => blog.id)) + 1,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      likes: 0,
      comments: 0,
      isBookmarked: false,
      isLiked: false,
    };

    setBlogs((prev) => [blogToAdd, ...prev]);
    setNewBlog({ 
      title: '', 
      content: '', 
      author: 'Anonymous', 
      profession: 'Unknown',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' 
    });
    setShowForm(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setBlogs(blogs.map((blog) => (blog.id === editingId ? { ...blog, ...editBlog } : blog)));
    setEditingId(null);
  };

  const handleLike = (id) => {
    setBlogs(blogs.map((blog) => {
      if (blog.id === id) {
        return {
          ...blog,
          likes: blog.isLiked ? blog.likes - 1 : blog.likes + 1,
          isLiked: !blog.isLiked,
        };
      }
      return blog;
    }));
  };

  const handleBookmark = (id) => {
    setBlogs(blogs.map((blog) => {
      if (blog.id === id) {
        return { ...blog, isBookmarked: !blog.isBookmarked };
      }
      return blog;
    }));
  };

  const handleDelete = (id) => {
    setBlogs(blogs.filter((blog) => blog.id !== id));
  };

  const startEditing = (blog) => {
    setEditingId(blog.id);
    setEditBlog({
      title: blog.title,
      content: blog.content,
      author: blog.author,
      profession: blog.profession,
      imageUrl: blog.imageUrl
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const filteredBlogs = blogs
    .filter((blog) => (activeTab === 'bookmarked' ? blog.isBookmarked : true))
    .filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.profession.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#e6f0ff] flex flex-col pt-16 md:pt-[72px] lg:pt-20">
      <div className="container mx-auto px-4 pb-8 md:pb-12 max-w-7xl flex-grow">
        {!showForm ? (
          <>
            <div className="bg-[#e6f0ff] rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'bookmarked', 'trending', 'popular'].map((tab) => (
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
                    placeholder="Search ratings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all bg-white text-gray-800 placeholder-gray-400"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900" />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
                </div>
              ) : filteredBlogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-[#e6f0ff] rounded-xl p-8">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                    <p className="text-gray-800 text-lg">
                      {activeTab === 'bookmarked' ? 'No bookmarked ratings yet.' : 'No ratings match your search.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {(showMoreBlogs ? filteredBlogs : filteredBlogs.slice(0, 2)).map((blog) => (
                    <article
                      key={blog.id}
                      className="bg-[#e6f0ff] rounded-xl p-6 transition-all duration-300 border border-gray-100"
                    >
                      {editingId === blog.id ? (
                        <form onSubmit={handleEditSubmit} className="space-y-5">
                          <input
                            type="text"
                            name="title"
                            value={editBlog.title}
                            onChange={handleEditInputChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-xl font-bold text-blue-900 bg-white"
                          />
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <img 
                                  src={blog.imageUrl} 
                                  alt={blog.author} 
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-900 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  name="author"
                                  value={editBlog.author}
                                  onChange={handleEditInputChange}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm text-gray-800 bg-white"
                                  placeholder="Author"
                                />
                                <input
                                  type="text"
                                  name="profession"
                                  value={editBlog.profession}
                                  onChange={handleEditInputChange}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm text-gray-800 bg-white"
                                  placeholder="Profession"
                                />
                              </div>
                            </div>
                          </div>
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
                              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-blue-900 hover:text-blue-800 transition-colors">
                              {blog.title}
                            </h3>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => startEditing(blog)}
                                className="text-blue-900 hover:text-blue-800 transition-all transform hover:scale-110"
                                title="Edit"
                              >
                                <FiEdit size={20} />
                              </button>
                              <button
                                onClick={() => handleDelete(blog.id)}
                                className="text-blue-900 hover:text-red-500 transition-all transform hover:scale-110"
                                title="Delete"
                              >
                                <FiTrash2 size={20} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start mb-4">
                            <div className="relative mr-3">
                              <img 
                                src={blog.imageUrl} 
                                alt={blog.author} 
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                              />
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-900 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-medium text-gray-800">{blog.author}</span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-600 text-sm">{blog.profession}</span>
                              </div>
                              <span className="text-gray-600 text-sm">{blog.date}</span>
                            </div>
                          </div>
                          <p className="text-gray-800 leading-relaxed mb-4">{blog.content}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex space-x-6">
                              <button
                                onClick={() => handleLike(blog.id)}
                                className={`flex items-center space-x-2 transition-all transform hover:scale-110 ${
                                  blog.isLiked ? 'text-red-500' : 'text-blue-900'
                                }`}
                              >
                                <FiHeart className={blog.isLiked ? 'fill-current animate-pulse' : ''} size={20} />
                                <span className="text-gray-800 font-medium">{blog.likes}</span>
                              </button>
                              <button
                                className="flex items-center space-x-2 text-blue-900 hover:text-blue-800 transition-all transform hover:scale-110"
                              >
                                <FiMessageSquare size={20} />
                                <span className="text-gray-800 font-medium">{blog.comments}</span>
                              </button>
                            </div>
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleBookmark(blog.id)}
                                className={`transition-all transform hover:scale-110 ${
                                  blog.isBookmarked ? 'text-blue-900' : 'text-blue-900'
                                }`}
                                title={blog.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                              >
                                <FiBookmark className={blog.isBookmarked ? 'fill-current' : ''} size={20} />
                              </button>
                              <button
                                className="text-blue-900 hover:text-blue-800 transition-all transform hover:scale-110"
                                title="Share"
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
              <button
                onClick={() => setShowMoreBlogs(!showMoreBlogs)}
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {showMoreBlogs ? <FiChevronUp /> : <FiChevronDown />}
                <span>{showMoreBlogs ? 'Show Less Blogs' : 'Show More Blogs'}</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-800 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newBlog.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all duration-300 text-gray-800 placeholder-gray-400"
                  placeholder="Enter your blog title"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-800 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={newBlog.author}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all duration-300 text-gray-800 placeholder-gray-400"
                    placeholder="Anonymous"
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
                    placeholder="Unknown"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-800 mb-2">
                  Your Experience
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={newBlog.content}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all duration-300 text-gray-800 placeholder-gray-400"
                  placeholder="Share your skill-swapping experience..."
                ></textarea>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="submit"
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <FiSend className="animate-pulse" />
                  <span>Add Your Rating</span>
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