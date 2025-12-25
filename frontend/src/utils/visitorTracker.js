/**
 * Anonymous Visitor Tracking Utility
 * Tracks page views, time spent, and sends activity to backend
 * GDPR-friendly: Uses only visitor_id cookie, no PII
 */

import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config';

class VisitorTracker {
  constructor() {
    this.visitorId = null;
    this.currentPath = null;
    this.pageStartTime = null;
    this.totalTimeSpent = 0;
    this.isTracking = false;
    this.sendQueue = [];
    this.flushInterval = null;
  }

  /**
   * Initialize visitor tracking
   */
  init() {
    // Don't track if user is logged in (check for auth token)
    const authToken = Cookies.get('token') || localStorage.getItem('token');
    if (authToken) {
      return;
    }

    this.visitorId = Cookies.get('visitor_id');
    
    // Visitor ID will be set by backend on first request
    // We just track client-side activity here
    
    this.isTracking = true;
    this.setupListeners();
    
    // Flush queue every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);
  }

  /**
   * Setup event listeners for tracking
   */
  setupListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHide();
      } else {
        this.onPageShow();
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.onPageHide();
      this.flush(true); // Synchronous flush on unload
    });

    // Start tracking current page
    this.trackPageView(window.location.pathname);
  }

  /**
   * Track a new page view
   */
  trackPageView(path) {
    // Send time spent on previous page
    if (this.currentPath && this.pageStartTime) {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
      this.totalTimeSpent += timeSpent;
      
      this.sendQueue.push({
        path: this.currentPath,
        timeSpent,
        timestamp: new Date().toISOString(),
      });
    }

    // Start tracking new page
    this.currentPath = path;
    this.pageStartTime = Date.now();
  }

  /**
   * Called when page becomes hidden
   */
  onPageHide() {
    if (this.currentPath && this.pageStartTime) {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
      this.totalTimeSpent += timeSpent;
      
      this.sendQueue.push({
        path: this.currentPath,
        timeSpent,
        timestamp: new Date().toISOString(),
      });
      
      this.pageStartTime = null; // Stop counting while hidden
    }
  }

  /**
   * Called when page becomes visible again
   */
  onPageShow() {
    // Resume time tracking
    this.pageStartTime = Date.now();
  }

  /**
   * Flush queued events to backend
   */
  async flush(sync = false) {
    if (this.sendQueue.length === 0) return;

    const events = [...this.sendQueue];
    this.sendQueue = [];

    // Calculate total time for this batch
    const batchTimeSpent = events.reduce((sum, e) => sum + e.timeSpent, 0);

    try {
      if (sync) {
        // Use sendBeacon for synchronous send on page unload
        const data = JSON.stringify({ events, totalTimeSpent: batchTimeSpent });
        navigator.sendBeacon(`${BACKEND_URL}/api/track/visitor`, data);
      } else {
        // Async fetch for periodic flushes
        // Instead of dedicated endpoint, we'll piggyback on regular page requests
        // by adding timeSpent query param to next navigation
        // Store in localStorage for next request
        const existing = parseInt(localStorage.getItem('pendingTimeSpent') || '0', 10);
        localStorage.setItem('pendingTimeSpent', String(existing + batchTimeSpent));
      }
    } catch (error) {
      console.warn('[VisitorTracker] Failed to flush events:', error);
    }
  }

  /**
   * Get pending time spent for next request
   */
  static getPendingTimeSpent() {
    const timeSpent = parseInt(localStorage.getItem('pendingTimeSpent') || '0', 10);
    localStorage.removeItem('pendingTimeSpent');
    return timeSpent;
  }

  /**
   * Clean up tracking
   */
  destroy() {
    this.isTracking = false;
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton instance
const visitorTracker = new VisitorTracker();

export default visitorTracker;
