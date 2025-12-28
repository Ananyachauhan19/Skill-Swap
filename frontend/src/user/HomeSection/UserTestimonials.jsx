import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import axios from 'axios';
import TestimonialCard from './TestimonialCard';

const UserTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);
  const lastTapRef = useRef(0);
  const scrollPositionRef = useRef(0);
  const clickTimeoutRef = useRef(null);
  const tapTimeoutRef = useRef(null);

  // Fetch testimonials from backend
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/testimonials?limit=20`);
        if (response.data && response.data.length > 0) {
          setTestimonials(response.data);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-scroll animation (RIGHT to LEFT continuously)
  useEffect(() => {
    if (!loading && testimonials.length > 0 && scrollContainerRef.current && !isPaused) {
      const container = scrollContainerRef.current;
      const baseSpeed = 0.5; // Base pixels per frame
      
      const animate = () => {
        scrollPositionRef.current += baseSpeed * scrollSpeed;
        
        // Get the width of one complete set of testimonials
        const singleSetWidth = container.scrollWidth / 2;
        
        // Reset position when first set is completely out of view
        if (scrollPositionRef.current >= singleSetWidth) {
          scrollPositionRef.current = 0;
        }
        
        container.style.transform = `translateX(-${scrollPositionRef.current}px)`;
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }
  }, [loading, testimonials, scrollSpeed, isPaused]);

  // Ensure RAF is stopped while paused, and timeouts are cleaned up on unmount.
  useEffect(() => {
    if (isPaused && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
    };
  }, [isPaused]);

  // Handle double-click to increase scroll speed
  const handleDoubleClick = () => {
    // Prevent the single-click pause toggle from firing.
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    setScrollSpeed((prev) => {
      const newSpeed = prev === 1 ? 2 : prev === 2 ? 3 : 1;
      return newSpeed;
    });
  };

  // Handle single click to pause/resume (with a small delay to avoid fighting double-click)
  const handleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setIsPaused((prev) => !prev);
      clickTimeoutRef.current = null;
    }, 220);
  };

  // Handle touch events for mobile (double-tap)
  const handleTouchEnd = () => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    
    // Double tap detected (within 300ms)
    if (tapLength < 300 && tapLength > 0) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      setScrollSpeed((prev) => {
        const newSpeed = prev === 1 ? 2 : prev === 2 ? 3 : 1;
        return newSpeed;
      });
    } else {
      // Single tap: pause/resume (delay to avoid toggling on first tap of a double-tap)
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        setIsPaused((prev) => !prev);
        tapTimeoutRef.current = null;
      }, 260);
    }
    
    lastTapRef.current = currentTime;
  };

  // Duplicate testimonials for seamless infinite loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              SkillSwap Ratings & Reviews 👀
            </h2>
            <p className="text-lg text-gray-600">
              Real feedback from learners and mentors on SkillSwap
            </p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              SkillSwap Ratings & Reviews 👀
            </h2>
            <p className="text-lg text-gray-600">
              Real feedback from learners and mentors on SkillSwap
            </p>
          </div>
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No testimonials available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {/* Header */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            See What People Are Saying 👀
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Real feedback from learners and mentors on SkillSwap
          </p>
          <p className="text-sm text-gray-500 italic">
            💡 Tip: Tap/click once to pause/resume, twice to speed up
          </p>
        </Motion.div>
      </div>

      {/* Scrolling Testimonials Container */}
      <div 
        className="relative"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'pointer' }}
      >
        {/* Left Fade Gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
        
        {/* Right Fade Gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling Container */}
        <div className="overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex"
            style={{
              width: 'fit-content',
              willChange: 'transform'
            }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${testimonial._id || testimonial.id}-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserTestimonials;
