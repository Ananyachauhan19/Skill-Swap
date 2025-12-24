/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import DateTimePicker from '../components/DateTimePicker';
import { BACKEND_URL } from '../config';

const CreateSessionNew = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    subtopic: '',
    description: '',
    date: '',
    time: '',
    selectedSkillMate: '', // Required SkillMate invitee
  });
  const [scheduled, setScheduled] = useState(false);
  const [skillMates, setSkillMates] = useState([]); // List of user's SkillMates
  const [skillMateSearch, setSkillMateSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showSubtopicDropdown, setShowSubtopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedSubtopicIdx, setHighlightedSubtopicIdx] = useState(-1);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // State for Google Sheet data
  const [classes, setClasses] = useState([]);
  const [subjectsByClass, setSubjectsByClass] = useState({});
  const [topicsBySubject, setTopicsBySubject] = useState({});

  // Allow all roles except explicit 'learner' to create sessions
  const isTutorRole = (
    currentUser && (
      currentUser.isTutor === true ||
      (currentUser.role && currentUser.role.toString().trim().toLowerCase() !== 'learner')
    )
  );
  const authReady = !!currentUser;

  // Derived skill lists for tutor-capable user
  const tutorClasses = useMemo(() => {
    if (!isTutorRole || !userSkills.length) {
      console.log('[CreateSession] No classes available:', { isTutorRole, userSkillsLength: userSkills.length });
      return [];
    }
    const classSet = new Set(userSkills.map(sk => sk.class).filter(Boolean));
    const result = Array.from(classSet);
    console.log('[CreateSession] Available classes:', result);
    return result;
  }, [userSkills, isTutorRole]);

  const tutorSubjects = useMemo(() => {
    if (!isTutorRole || !userSkills.length) return [];
    if (!form.subject) return [];
    const filtered = userSkills.filter(sk => sk.class === form.subject);
    const subjectSet = new Set(filtered.map(sk => sk.subject).filter(Boolean));
    const result = Array.from(subjectSet);
    console.log('[CreateSession] Available subjects for', form.subject, ':', result);
    return result;
  }, [userSkills, isTutorRole, form.subject]);

  const tutorTopicsBySubject = useMemo(() => {
    if (!isTutorRole || !userSkills.length || !form.subject) return {};
    const result = {};
    const filtered = userSkills.filter(sk => sk.class === form.subject);
    
    filtered.forEach(sk => {
      if (!sk.subject) return;
      
      // Check if topic is "ALL" (case-insensitive)
      if (sk.topic && sk.topic.toUpperCase() === 'ALL') {
        // User can teach all topics in this subject - get from master list and filter out "ALL"
        const allTopics = topicsBySubject[sk.subject] || [];
        result[sk.subject] = allTopics.filter(t => t && t.toUpperCase() !== 'ALL' && t.trim() !== '');
        console.log(`[CreateSession] Tutor has ALL permission for ${sk.subject}, showing ${result[sk.subject].length} topics`);
      } else if (sk.topic) {
        // User can teach specific topic (not "ALL")
        if (!result[sk.subject]) result[sk.subject] = [];
        if (!result[sk.subject].includes(sk.topic) && sk.topic.toUpperCase() !== 'ALL') {
          result[sk.subject].push(sk.topic);
        }
      }
    });
    
    console.log('[CreateSession] Available topics by subject:', result);
    console.log('[CreateSession] Master topicsBySubject:', topicsBySubject);
    return result;
  }, [userSkills, isTutorRole, topicsBySubject, form.subject]);

  const availableClasses = useMemo(() => {
    if (!isTutorRole || !userSkills.length) {
      console.log('[CreateSession] No available classes - isTutorRole:', isTutorRole, 'userSkills:', userSkills);
      return [];
    }
    return tutorClasses;
  }, [tutorClasses, isTutorRole, userSkills.length]);

  // Fetch skills list from Google Sheet
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        console.log('[CreateSession] Fetching skills list from CSV...');
        const res = await axios.get(`${BACKEND_URL}/api/skills-list`);
        if (res.data) {
          console.log('[CreateSession] Skills list fetched successfully');
          console.log('[CreateSession] Classes:', res.data.classes?.length || 0);
          console.log('[CreateSession] Subjects by class keys:', Object.keys(res.data.subjectsByClass || {}).length);
          console.log('[CreateSession] Topics by subject keys:', Object.keys(res.data.topicsBySubject || {}).length);
          console.log('[CreateSession] Sample topicsBySubject:', Object.keys(res.data.topicsBySubject || {}).slice(0, 3));
          
          setClasses(res.data.classes || []);
          setSubjectsByClass(res.data.subjectsByClass || {});
          setTopicsBySubject(res.data.topicsBySubject || {});
        }
      } catch (err) {
        console.error('[CreateSession] Failed to fetch skills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  // Helper function to normalize user IDs for comparison
  const normalizeUserId = (userId) => {
    return userId ? userId.toString() : null;
  };

  // Helper function to check if current user is creator
  const isCurrentUserCreator = (session) => {
    if (!currentUser || !session) return false;
    return normalizeUserId(session.creator?._id || session.creator) === normalizeUserId(currentUser._id);
  };

  // Helper function to check if current user is requester
  const isCurrentUserRequester = (session) => {
    if (!currentUser || !session) return false;
    return normalizeUserId(session.requester?._id || session.requester) === normalizeUserId(currentUser._id);
  };

  // Get current user and skills from cookies
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!currentUser) return;
      
      try {
        // First, check if user has skillsToTeach from auth response
        if (currentUser.skillsToTeach && currentUser.skillsToTeach.length > 0) {
          console.log('[CreateSession] Setting skills from currentUser.skillsToTeach:', currentUser.skillsToTeach);
          setUserSkills(currentUser.skillsToTeach);
        }
        
        // If user is a tutor, also fetch verified skills from approved application
        if (currentUser.isTutor) {
          console.log('[CreateSession] Fetching verified skills for tutor...');
          const res = await axios.get(
            `${BACKEND_URL}/api/tutor/verified-skills`,
            { withCredentials: true }
          );
          
          console.log('[CreateSession] Verified skills response:', res.data);
          
          if (res.data && res.data.skills && res.data.skills.length > 0) {
            // Use verified skills from approved application
            console.log('[CreateSession] Using verified skills from approved application:', res.data.skills);
            setUserSkills(res.data.skills);
          } else if (res.data && res.data.skillsToTeach && res.data.skillsToTeach.length > 0) {
            // Fallback to skillsToTeach if available
            console.log('[CreateSession] Using fallback skillsToTeach:', res.data.skillsToTeach);
            setUserSkills(res.data.skillsToTeach);
          } else {
            console.log('[CreateSession] No verified skills found in response');
          }
        }
      } catch (err) {
        console.error('[CreateSession] Failed to fetch user skills:', err);
        // Fallback to currentUser.skillsToTeach if API call fails
        if (currentUser.skillsToTeach) {
          console.log('[CreateSession] Using fallback currentUser.skillsToTeach after error:', currentUser.skillsToTeach);
          setUserSkills(currentUser.skillsToTeach);
        }
      }
    };
    
    fetchUserSkills();
  }, [currentUser]);

  // Fetch SkillMates for notifications
  useEffect(() => {
    const fetchSkillMates = async () => {
      if (!currentUser) return;
      
      try {
        const res = await axios.get(`${BACKEND_URL}/api/skillmates/list`, { withCredentials: true });
        if (res.data && Array.isArray(res.data)) {
          setSkillMates(res.data);
        }
      } catch (err) {
        console.error('[CreateSession] Failed to fetch SkillMates:', err);
      }
    };
    
    fetchSkillMates();
  }, [currentUser]);

  // Initialize Fuse.js instances for fuzzy search
  const fuseClasses = useMemo(() => {
    const list = isTutorRole ? availableClasses : classes;
    return new Fuse(list, { threshold: 0.3 });
  }, [availableClasses, classes, isTutorRole]);

  const fuseSubjects = useMemo(() => {
    const list = isTutorRole ? tutorSubjects : (subjectsByClass[form.subject] || []);
    return new Fuse(list, { threshold: 0.3 });
  }, [tutorSubjects, isTutorRole, subjectsByClass, form.subject]);

  const fuseTopics = useMemo(() => {
    if (!form.topic) return null;
    const list = isTutorRole
      ? (tutorTopicsBySubject[form.topic] || [])
      : (topicsBySubject[form.topic] || []);
    return new Fuse(list, { threshold: 0.3 });
  }, [form.topic, tutorTopicsBySubject, isTutorRole, topicsBySubject]);

  // Filter using Fuse.js fuzzy search
  const courseList = useMemo(() => {
    const list = isTutorRole ? availableClasses : classes;
    if (!form.subject.trim()) return list;
    return fuseClasses.search(form.subject).map(res => res.item);
  }, [form.subject, availableClasses, classes, fuseClasses, isTutorRole]);

  const unitDropdownList = useMemo(() => {
    const list = isTutorRole ? tutorSubjects : (subjectsByClass[form.subject] || []);
    if (!form.topic.trim()) return list;
    return fuseSubjects.search(form.topic).map(res => res.item);
  }, [form.topic, tutorSubjects, fuseSubjects, isTutorRole, subjectsByClass, form.subject]);

  const topicDropdownList = useMemo(() => {
    const list = isTutorRole
      ? (tutorTopicsBySubject[form.topic] || [])
      : (topicsBySubject[form.topic] || []);
    if (!form.subtopic.trim()) return list;
    return fuseTopics ? fuseTopics.search(form.subtopic).map(res => res.item) : list;
  }, [form.subtopic, form.topic, tutorTopicsBySubject, fuseTopics, isTutorRole, topicsBySubject]);

  const unitList = useMemo(() => {
    return isTutorRole ? tutorSubjects : (subjectsByClass[form.subject] || []);
  }, [tutorSubjects, isTutorRole, subjectsByClass, form.subject]);

  const topicList = useMemo(() => {
    const topics = isTutorRole ? (tutorTopicsBySubject[form.topic] || []) : (topicsBySubject[form.topic] || []);
    // Filter out "ALL" if it somehow got included - we only want individual topics
    const filteredTopics = topics.filter(t => t && t.toUpperCase() !== 'ALL' && t.trim() !== '');
    console.log('[CreateSession] topicList for subject', form.topic, ':', filteredTopics);
    console.log('[CreateSession] tutorTopicsBySubject:', tutorTopicsBySubject);
    console.log('[CreateSession] topicsBySubject[form.topic]:', topicsBySubject[form.topic]);
    return filteredTopics;
  }, [form.topic, tutorTopicsBySubject, isTutorRole, topicsBySubject]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    console.log('[CreateSession] Form submission started', { form, currentUser, userSkills });
    
    if (!currentUser) {
      addToast({ message: 'You must be logged in to create a session', variant: 'error', timeout: 3000 });
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const { subject, topic, subtopic, description, date, time, selectedSkillMate } = form;
    if (!subject || !topic || !subtopic || !description || !date || !time) {
      const missing = [];
      if (!subject) missing.push('Class');
      if (!topic) missing.push('Subject');
      if (!subtopic) missing.push('Topic');
      if (!description) missing.push('Description');
      if (!date || !time) missing.push('Date & Time');
      
      console.error('[CreateSession] Missing required fields:', missing);
      console.error('[CreateSession] Current form values:', { subject, topic, subtopic, description, date, time });
      
      addToast({ 
        message: `Please fill all required fields: ${missing.join(', ')}`, 
        variant: 'error', 
        timeout: 4000 
      });
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    if (!selectedSkillMate) {
      addToast({ message: 'Please select a SkillMate to create a session', variant: 'error', timeout: 3500 });
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const selectedDate = new Date(`${date}T${time}`);
    const now = new Date();
    if (selectedDate <= now) {
      addToast({ message: 'Session date and time must be in the future', variant: 'error', timeout: 3000 });
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        subject,
        topic,
        subtopic,
        description,
        date,
        time,
        sessionType: 'expert',
        userId: currentUser._id,
        skillMateId: selectedSkillMate,
      };

      console.log('[CreateSession] Sending payload:', payload);

      if (editId) {
        const res = await axios.put(
          `${BACKEND_URL}/api/sessions/${editId}`,
          payload,
          { withCredentials: true }
        );
        setScheduledSessions(prev => prev.map(s => (s._id === editId ? res.data : s)));
        addToast({ message: 'Session updated successfully!', variant: 'success', timeout: 3000 });
        setEditId(null);
      } else {
        const res = await axios.post(
          `${BACKEND_URL}/api/sessions/create`,
          payload,
          { withCredentials: true }
        );
        console.log('[CreateSession] Session created:', res.data);
        setScheduledSessions(prev => [...prev, res.data]);
        const mate = (Array.isArray(skillMates) ? skillMates : []).find(m => String(m._id) === String(selectedSkillMate));
        const mateName = mate ? (`${mate.firstName || ''} ${mate.lastName || ''}`.trim() || mate.username || 'SkillMate') : 'SkillMate';
        addToast({ message: `Session invitation sent to ${mateName}`, variant: 'success', timeout: 3500 });
        setScheduled(true);
        setTimeout(() => setScheduled(false), 3000);
      }

      setForm({ subject: '', topic: '', subtopic: '', description: '', date: '', time: '', selectedSkillMate: '' });
      setSkillMateSearch('');
    } catch (error) {
      console.error('[CreateSession] Error creating/updating session:', error);
      console.error('[CreateSession] Error response:', error.response?.data);
      addToast({ message: error.response?.data?.message || 'Failed to create/update session', variant: 'error', timeout: 3000 });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleEdit = (session) => {
    setForm({
      subject: session.subject || '',
      topic: session.topic || '',
      subtopic: session.subtopic || '',
      description: session.description || '',
      date: session.date || '',
      time: session.time || '',
      selectedSkillMate: session.invitedSkillMate?._id || session.invitedSkillMate || '',
    });
    setEditId(session._id);
    setSelectedSession(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/sessions/${id}`, {
        withCredentials: true
      });
      setScheduledSessions(prev => prev.filter(s => s._id !== id));
      addToast({ message: 'Session deleted successfully!', variant: 'success', timeout: 3000 });
      if (selectedSession && selectedSession._id === id) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      addToast({ message: 'Failed to delete session', variant: 'error', timeout: 3000 });
    }
  };

  const handleCancelSession = async (session) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    setActionLoading(prev => ({ ...prev, [`cancel-${session._id}`]: true }));
    try {
      await axios.delete(
        `${BACKEND_URL}/api/sessions/${session._id}`,
        { withCredentials: true }
      );
      setScheduledSessions(prev => prev.filter(s => s._id !== session._id));
      addToast({ message: 'Session cancelled successfully', variant: 'success', timeout: 3000 });
      if (selectedSession && selectedSession._id === session._id) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      addToast({ message: 'Failed to cancel session', variant: 'error', timeout: 3000 });
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${session._id}`]: false }));
    }
  };


  const fetchUserSessions = async () => {
    setLoading(true);
    try {
      console.log('[CreateSession] Fetching user sessions...');
      const res = await axios.get(`${BACKEND_URL}/api/sessions/mine`, {
        withCredentials: true
      });
      console.log('[CreateSession] Sessions response:', res.data);
      const sessions = Array.isArray(res.data) ? res.data : [];
      console.log('[CreateSession] Setting sessions:', sessions);
      setScheduledSessions(sessions);
    } catch (error) {
      console.error('[CreateSession] Error fetching sessions:', error);
      setScheduledSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSessions();
  }, []);

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setEditId(null);
  };

  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return scheduledSessions;
    const query = searchQuery.toLowerCase();
    return (Array.isArray(scheduledSessions) ? scheduledSessions : []).filter(session => 
      session.subject?.toLowerCase().includes(query) ||
      session.topic?.toLowerCase().includes(query) ||
      session.subtopic?.toLowerCase().includes(query) ||
      session.description?.toLowerCase().includes(query)
    );
  }, [scheduledSessions, searchQuery]);

  const filteredSkillMates = useMemo(() => {
    const list = Array.isArray(skillMates) ? skillMates : [];
    const q = (skillMateSearch || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => {
      const name = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
      const username = (m.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [skillMates, skillMateSearch]);

  // Important: do not early-return before hooks above, otherwise React will throw
  // "Rendered more hooks than during the previous render" when auth/skillmates load.
  const nonTutorBlocked = authReady && !isTutorRole;
  const noSkillmatesBlocked = authReady && isTutorRole && Array.isArray(skillMates) && skillMates.length === 0;

  if (nonTutorBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <p className="text-red-600 text-lg font-semibold">Only verified tutors can create sessions. Please add skills to your profile.</p>
        </div>
      </div>
    );
  }

  if (noSkillmatesBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <p className="text-[#1e40af] text-lg font-semibold">Create Session is available only for SkillMates.</p>
          <p className="text-gray-600 text-sm mt-2">Add SkillMates first, then create a session by inviting one SkillMate.</p>
        </div>
      </div>
    );
  }

  const username = currentUser ? currentUser.username || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User' : 'User';

  return (
    <div className="min-h-screen bg-gray-50 pt-16 font-inter">
      {/* Two-Panel Layout Container */}
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        
        {/* LEFT SIDEBAR - Scheduled Sessions */}
        <aside className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden lg:max-h-screen">
          {/* Sidebar Header */}
          <div className="p-4 lg:p-5 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-white">
            <h2 className="text-lg font-bold text-[#1e40af] flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>My Sessions</span>
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Click to view details</p>
            
            {/* Search Bar */}
            <div className="mt-3 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-all bg-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Sessions List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-semibold text-gray-600">{searchQuery ? 'No matching sessions' : 'No sessions yet'}</p>
                <p className="text-xs mt-1 text-gray-500">{searchQuery ? 'Try different keywords' : 'Create your first session to get started'}</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => handleSessionClick(session)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-150 hover:shadow-sm ${
                    selectedSession?._id === session._id
                      ? 'bg-blue-50 border-[#1e40af] shadow-sm ring-1 ring-[#1e40af] ring-opacity-30'
                      : 'bg-white border-gray-200 hover:border-[#1e40af]'
                  }`}
                >
                  {/* Minimal Info - Keywords Only */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-xs text-[#1e40af] line-clamp-1 flex-1">
                      {session.subject || 'No Subject'}
                    </h3>
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide ml-1.5 ${
                      session.status === 'completed' ? 'bg-green-100 text-green-700' :
                      session.status === 'approved' || session.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      session.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {session.status || 'pending'}
                    </span>
                  </div>
                  
                  {/* Topic - Single line */}
                  <p className="text-[11px] text-[#475569] line-clamp-1 mb-1.5">
                    {session.topic || 'N/A'} • {session.subtopic || 'N/A'}
                  </p>
                  
                  {/* Date & Role Badge */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-medium">
                      {session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                    </span>
                    {currentUser && isCurrentUserCreator(session) && session.sessionType === 'expert' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold bg-[#1e40af] text-white text-[9px]">
                        Expert
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* RIGHT MAIN PANEL */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            
            {selectedSession ? (
              /* ============================================ */
              /* SESSION DETAILS VIEW */
              /* ============================================ */
              <div className="animate-fade-in">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-black">Session Details</h1>
                    <p className="text-xs text-[#475569] mt-1">Review and manage this session</p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="p-2 text-gray-500 hover:text-[#1e40af] hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Status and Role Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                    selectedSession.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 
                    selectedSession.status === 'approved' || selectedSession.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 
                    selectedSession.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 
                    'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {(selectedSession.status || 'pending').toUpperCase()}
                  </span>
                  {currentUser && isCurrentUserCreator(selectedSession) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e40af] text-white shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      {selectedSession.sessionType === 'expert' ? 'You are the Expert' : 'You are the Tutor'}
                    </span>
                  )}
                </div>

                {/* Session Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4 mb-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 block">Class</label>
                      <p className="text-lg font-bold text-black">{selectedSession.subject}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 block">Subject</label>
                      <p className="text-lg font-bold text-black">{selectedSession.topic}</p>
                    </div>
                  </div>

                  {selectedSession.sessionType === 'expert' && (
                    <div className="pt-3 border-t border-gray-100">
                      <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 block">SkillMate</label>
                      <p className="text-base font-bold text-black">
                        {(() => {
                          const invited = selectedSession.invitedSkillMate;
                          const invitedId = invited?._id || invited;
                          const fromStored = (selectedSession.invitedSkillMateName || '').toString().trim();
                          const fromPopulated = invited && typeof invited === 'object'
                            ? (`${invited.firstName || ''} ${invited.lastName || ''}`.trim() || invited.username || '')
                            : '';
                          const fromList = (Array.isArray(skillMates) ? skillMates : [])
                            .find(m => String(m._id) === String(invitedId));
                          const fromListName = fromList
                            ? (`${fromList.firstName || ''} ${fromList.lastName || ''}`.trim() || fromList.username || '')
                            : '';
                          return fromStored || fromPopulated || fromListName || 'SkillMate';
                        })()}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-100">
                    <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 block">Topic</label>
                    <p className="text-base font-bold text-black">{selectedSession.subtopic}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 block">Description</label>
                    <p className="text-sm text-[#475569] leading-relaxed">{selectedSession.description}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Date
                      </label>
                      <p className="text-base font-bold text-black">{selectedSession.date}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Time
                      </label>
                      <p className="text-base font-bold text-black">{selectedSession.time}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {currentUser && isCurrentUserCreator(selectedSession) && (
                    <>
                      <button
                        onClick={() => handleEdit(selectedSession)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e40af] text-white rounded-lg text-sm font-semibold hover:bg-[#1e3a8a] transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit Session
                      </button>
                      <button
                        onClick={() => handleDelete(selectedSession._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-status-error-bg text-status-error-text border border-status-error-border rounded-lg text-sm font-semibold hover:bg-status-error-bg-hover transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete Session
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* ============================================ */
              /* CREATE SESSION FORM */
              /* ============================================ */
              <div className="animate-fade-in">
                {/* Header */}
                <div className="mb-5">
                  <h1 className="text-2xl lg:text-3xl font-bold text-black mb-1">
                    Create Your Expert Session
                  </h1>
                  <p className="text-xs text-[#475569]">
                    Schedule a session to share your expertise with learners
                  </p>
                </div>

                {scheduled && (
                  <div className="mb-6 p-4 bg-status-success-bg border-2 border-status-success-border rounded-xl flex items-center gap-3 shadow-sm">
                    <svg className="w-6 h-6 text-status-success-icon flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-status-success-text font-bold">Session scheduled successfully!</p>
                      <p className="text-status-success-text text-sm">Your session has been added to the list</p>
                    </div>
                  </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-[#1e40af] mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Schedule Your Session
                  </h2>
                  
                  {/* No Skills Warning */}
                  {isTutorRole && userSkills.length === 0 && (
                    <div className="mb-6 p-4 bg-status-warning-bg border-2 border-status-warning-border rounded-xl flex items-start gap-3">
                      <svg className="w-6 h-6 text-status-warning-icon flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-status-warning-text font-bold mb-1">No Verified Skills Found</p>
                        <p className="text-sm text-gray-600">
                          You need to get your teaching skills verified before creating sessions. 
                          Please apply for tutor verification from your profile page.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  {/* Class Dropdown */}
                  <div className="relative">
                    <label className="block text-[#475569] font-semibold mb-1.5 text-xs uppercase tracking-wide">Class</label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={e => { handleChange(e); setShowCourseDropdown(true); setHighlightedCourseIdx(-1); }}
                      onFocus={() => setShowCourseDropdown(true)}
                      onBlur={() => setTimeout(() => { setShowCourseDropdown(false); setHighlightedCourseIdx(-1); }, 120)}
                      onKeyDown={e => {
                        if (!showCourseDropdown || courseList.length === 0) return;
                        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                          e.preventDefault();
                          setHighlightedCourseIdx(idx => (idx + 1) % courseList.length);
                        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                          e.preventDefault();
                          setHighlightedCourseIdx(idx => (idx - 1 + courseList.length) % courseList.length);
                        } else if (e.key === 'Enter') {
                          if (highlightedCourseIdx >= 0 && highlightedCourseIdx < courseList.length) {
                            setForm(prev => ({ ...prev, subject: courseList[highlightedCourseIdx], topic: '', subtopic: '' }));
                            setShowCourseDropdown(false);
                            setHighlightedCourseIdx(-1);
                          }
                        }
                      }}
                      placeholder="Search Class..."
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all bg-white shadow-sm hover:border-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200"
                      required
                      autoComplete="off"
                      disabled={userSkills.length === 0}
                    />
                    {showCourseDropdown && (
                      <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-brand-primary rounded-xl shadow-2xl max-h-60 overflow-y-auto mt-2">
                        {courseList.length > 0 ? courseList.map((s, idx) => (
                          <li
                            key={idx}
                            className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors text-black font-medium ${highlightedCourseIdx === idx ? 'bg-brand-primary text-white' : ''}`}
                            onMouseDown={() => {
                              setForm(prev => ({ ...prev, subject: s, topic: '', subtopic: '' }));
                              setShowCourseDropdown(false);
                              setHighlightedCourseIdx(-1);
                            }}
                          >
                            {s}
                          </li>
                        )) : (
                          <li className="px-4 py-3 text-text-muted">
                            {isTutorRole && userSkills.length === 0 ? (
                              <div className="text-center py-2">
                                <p className="font-medium text-status-warning-text">No verified skills found</p>
                                <p className="text-xs mt-1">Please apply for tutor verification to add your teaching skills</p>
                              </div>
                            ) : (
                              'No classes found'
                            )}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Subject Dropdown */}
                  <div className="relative">
                    <label className="block text-[#475569] font-semibold mb-1.5 text-xs uppercase tracking-wide">Subject</label>
                    <input
                      type="text"
                      name="topic"
                      value={form.topic}
                      onChange={e => { handleChange(e); setShowUnitDropdown(true); setHighlightedUnitIdx(-1); }}
                      onFocus={() => { if (form.subject) setShowUnitDropdown(true); }}
                      onBlur={() => setTimeout(() => { setShowUnitDropdown(false); setHighlightedUnitIdx(-1); }, 120)}
                      onKeyDown={e => {
                        if (!showUnitDropdown || unitDropdownList.length === 0) return;
                        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                          e.preventDefault();
                          setHighlightedUnitIdx(idx => (idx + 1) % unitDropdownList.length);
                        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                          e.preventDefault();
                          setHighlightedUnitIdx(idx => (idx - 1 + unitDropdownList.length) % unitDropdownList.length);
                        } else if (e.key === 'Enter') {
                          if (highlightedUnitIdx >= 0 && highlightedUnitIdx < unitDropdownList.length) {
                            setForm(prev => ({ ...prev, topic: unitDropdownList[highlightedUnitIdx], subtopic: '' }));
                            setShowUnitDropdown(false);
                            setHighlightedUnitIdx(-1);
                          }
                        }
                      }}
                      placeholder="Search Subject..."
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all bg-white shadow-sm hover:border-brand-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
                      required
                      autoComplete="off"
                      disabled={!form.subject || unitList.length === 0}
                    />
                    {showUnitDropdown && form.subject && (
                      <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-[#1e40af] rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                        {unitDropdownList.length > 0 ? unitDropdownList.map((u, idx) => (
                          <li
                            key={idx}
                            className={`px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors text-sm text-black font-medium ${highlightedUnitIdx === idx ? 'bg-[#1e40af] text-white' : ''}`}
                            onMouseDown={() => {
                              setForm(prev => ({ ...prev, topic: u, subtopic: '' }));
                              setShowUnitDropdown(false);
                              setHighlightedUnitIdx(-1);
                            }}
                          >
                            {u}
                          </li>
                        )) : <li className="px-4 py-3 text-text-muted">No matching subjects found.</li>}
                      </ul>
                    )}
                  </div>

                  {/* Topic Dropdown */}
                  <div className="relative">
                    <label className="block text-brand-primary font-bold mb-2 text-sm uppercase tracking-wide">Topic *</label>
                    {form.topic && topicList.length === 0 && (
                      <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <p className="font-medium">⚠️ No topics available for "{form.topic}"</p>
                        <p className="text-xs mt-1">You may not be verified to teach any topics in this subject. Please select a different subject or contact support.</p>
                      </div>
                    )}
                    <input
                      type="text"
                      name="subtopic"
                      value={form.subtopic}
                      onChange={e => { handleChange(e); setShowSubtopicDropdown(true); setHighlightedSubtopicIdx(-1); }}
                      onFocus={() => { 
                        if (form.topic) {
                          console.log('[CreateSession] Topic field focused, form.topic:', form.topic);
                          console.log('[CreateSession] topicList:', topicList);
                          setShowSubtopicDropdown(true); 
                        }
                      }}
                      onBlur={() => setTimeout(() => { setShowSubtopicDropdown(false); setHighlightedSubtopicIdx(-1); }, 120)}
                      onKeyDown={e => {
                        if (!showSubtopicDropdown || topicDropdownList.length === 0) return;
                        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                          e.preventDefault();
                          setHighlightedSubtopicIdx(idx => (idx + 1) % topicDropdownList.length);
                        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                          e.preventDefault();
                          setHighlightedSubtopicIdx(idx => (idx - 1 + topicDropdownList.length) % topicDropdownList.length);
                        } else if (e.key === 'Enter') {
                          if (highlightedSubtopicIdx >= 0 && highlightedSubtopicIdx < topicDropdownList.length) {
                            setForm(prev => ({ ...prev, subtopic: topicDropdownList[highlightedSubtopicIdx] }));
                            setShowSubtopicDropdown(false);
                            setHighlightedSubtopicIdx(-1);
                          }
                        }
                      }}
                      placeholder="Search Topic..."
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-all bg-white shadow-sm hover:border-[#1e40af] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-500"
                      required
                      autoComplete="off"
                      disabled={!form.topic || topicList.length === 0}
                    />
                    {showSubtopicDropdown && form.topic && (
                      <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-brand-primary rounded-xl shadow-2xl max-h-60 overflow-y-auto mt-2">
                        {topicDropdownList.length > 0 ? topicDropdownList.map((t, idx) => (
                          <li
                            key={idx}
                            className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors text-black font-medium ${highlightedSubtopicIdx === idx ? 'bg-brand-primary text-white' : ''}`}
                            onMouseDown={() => {
                              setForm(prev => ({ ...prev, subtopic: t }));
                              setShowSubtopicDropdown(false);
                              setHighlightedSubtopicIdx(-1);
                            }}
                          >
                            {t}
                          </li>
                        )) : (
                          <li className="px-4 py-3 text-text-muted">
                            {topicList.length === 0 ? (
                              <div className="text-center py-2">
                                <p className="font-medium text-status-warning-text">No topics available</p>
                                <p className="text-xs mt-1">Please select a different subject</p>
                              </div>
                            ) : (
                              'No matching topics found'
                            )}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[#475569] font-semibold mb-1.5 text-xs uppercase tracking-wide">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 min-h-[100px] text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-all bg-white shadow-sm hover:border-[#1e40af] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200"
                      placeholder="Describe your learning goals or questions..."
                      maxLength={500}
                      required
                      disabled={userSkills.length === 0}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">{form.description.length}/500 characters</p>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block text-[#475569] font-semibold mb-1.5 text-xs uppercase tracking-wide">Date & Time</label>
                    <DateTimePicker
                      date={form.date}
                      time={form.time}
                      onChange={(dateStr, timeStr) =>
                        setForm(prev => ({ ...prev, date: dateStr, time: timeStr }))
                      }
                    />
                  </div>

                  {/* SkillMates (Required) */}
                  <div>
                    <label className="block text-[#475569] font-semibold mb-1.5 text-xs uppercase tracking-wide">
                      SkillMates
                    </label>

                    {/* Search */}
                    <div className="mb-2">
                      <input
                        type="text"
                        value={skillMateSearch}
                        onChange={(e) => setSkillMateSearch(e.target.value)}
                        placeholder="Search SkillMates..."
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-all bg-white shadow-sm hover:border-[#1e40af] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={skillMates.length === 0}
                      />
                    </div>

                    <select
                      name="selectedSkillMate"
                      value={form.selectedSkillMate}
                      onChange={e => setForm(prev => ({ ...prev, selectedSkillMate: e.target.value }))}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-all bg-white shadow-sm hover:border-[#1e40af] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={skillMates.length === 0}
                      required
                    >
                      <option value="">-- Select SkillMate --</option>
                      {filteredSkillMates.map(mate => (
                        <option key={mate._id} value={mate._id}>
                          {mate.firstName} {mate.lastName} ({mate.username})
                        </option>
                      ))}
                    </select>

                    {skillMates.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        You have no SkillMates yet. Create Session is available only for SkillMates.
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 mt-5">
                    <button
                      type="submit"
                      className="flex-1 bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                      disabled={userSkills.length === 0 || isSubmitting}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {isSubmitting ? (editId ? 'Updating...' : 'Scheduling...') : (editId ? 'Update Session' : 'Schedule Session')}
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setForm({ subject: '', topic: '', subtopic: '', description: '', date: '', time: '', selectedSkillMate: '' });
                          setSkillMateSearch('');
                        }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateSessionNew;
