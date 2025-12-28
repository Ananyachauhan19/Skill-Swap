/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',      // Tablet start
      'tablet': '820px',   // iPad/Surface
      'lg': '1024px',      // Desktop start (DO NOT MODIFY)
      'xl': '1280px',      // Large desktop (DO NOT MODIFY)
      '2xl': '1536px',     // Extra large (DO NOT MODIFY)
    },
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        lora: ['Lora', 'serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        // ============================================
        // SEMANTIC COLOR TOKENS - DESIGN SYSTEM
        // ============================================
        
        // Brand / Primary Colors
        'brand-primary': '#1e3a8a',           // Primary brand color (navy blue)
        'brand-primary-dark': '#0A2540',      // Darker brand variant
        'brand-secondary': '#2563eb',         // Secondary brand (blue)
        'brand-accent': '#3b82f6',            // Accent highlights
        
        // Background Colors
        'bg-page': '#F5F9FF',                 // Main page background (soft whitish blue)
        'bg-section': '#e6f0fa',              // Section backgrounds
        'bg-section-alt': '#f0f6fc',          // Alternate section background
        'bg-card': '#ffffff',                 // Card/panel backgrounds
        'bg-navbar': '#F5F9FF',               // Navbar background
        'bg-sidebar': '#ffffff',              // Sidebar background
        'bg-modal': '#ffffff',                // Modal backgrounds
        'bg-overlay': 'rgba(0, 0, 0, 0.4)',   // Overlay backdrop
        'bg-hero-dark': '#0A2540',            // Dark hero sections
        'bg-input': '#ffffff',                // Input backgrounds
        'bg-input-focus': '#f0f9ff',          // Input focus state
        
        // Text Colors
        'text-heading': '#1e3a8a',            // Main headings
        'text-subheading': '#0A2540',         // Subheadings
        'text-body': '#4b5563',               // Body text (gray-600)
        'text-muted': '#6b7280',              // Muted/secondary text (gray-500)
        'text-inverted': '#ffffff',           // White text on dark bg
        'text-link': '#2563eb',               // Link text
        'text-link-hover': '#1d4ed8',         // Link hover state
        'text-placeholder': '#60a5fa',        // Placeholder text (blue-400)
        
        // Button Colors - Primary
        'button-primary': '#1e3a8a',          // Primary button bg
        'button-primary-hover': '#0f172a',    // Primary button hover
        'button-primary-active': '#0A2540',   // Primary button active
        'button-primary-disabled': '#9ca3af', // Primary button disabled
        'button-primary-text': '#ffffff',     // Primary button text
        
        // Button Colors - Secondary
        'button-secondary': '#2563eb',        // Secondary button bg
        'button-secondary-hover': '#1d4ed8',  // Secondary button hover
        'button-secondary-active': '#1e40af', // Secondary button active
        'button-secondary-disabled': '#cbd5e1', // Secondary button disabled
        'button-secondary-text': '#ffffff',   // Secondary button text
        
        // Button Colors - Ghost/Outline
        'button-ghost': '#dbeafe',            // Ghost button bg (blue-100)
        'button-ghost-hover': '#bfdbfe',      // Ghost button hover (blue-200)
        'button-ghost-text': '#1e3a8a',       // Ghost button text
        'button-outline-border': '#2563eb',   // Outline button border
        
        // Status/State Colors - Success
        'status-success-bg': '#dcfce7',       // Success background (green-100)
        'status-success-text': '#166534',     // Success text (green-800)
        'status-success-border': '#bbf7d0',   // Success border (green-200)
        'status-success-icon': '#22c55e',     // Success icons (green-500)
        
        // Status/State Colors - Error
        'status-error-bg': '#fee2e2',         // Error background (red-100)
        'status-error-text': '#991b1b',       // Error text (red-800)
        'status-error-border': '#fecaca',     // Error border (red-200)
        'status-error-icon': '#ef4444',       // Error icons (red-500)
        'status-error-button': '#dc2626',     // Error button bg (red-600)
        'status-error-button-hover': '#b91c1c', // Error button hover (red-700)
        
        // Status/State Colors - Warning
        'status-warning-bg': '#fef3c7',       // Warning background (amber-100)
        'status-warning-text': '#78350f',     // Warning text (amber-900)
        'status-warning-border': '#fde68a',   // Warning border (amber-200)
        'status-warning-icon': '#f59e0b',     // Warning icons (amber-500)
        
        // Status/State Colors - Info
        'status-info-bg': '#dbeafe',          // Info background (blue-100)
        'status-info-text': '#1e3a8a',        // Info text (blue-900)
        'status-info-border': '#bfdbfe',      // Info border (blue-200)
        'status-info-icon': '#3b82f6',        // Info icons (blue-500)
        
        // Borders & Dividers
        'border-default': '#e5e7eb',          // Default borders (gray-200)
        'border-muted': '#f3f4f6',            // Subtle borders (gray-100)
        'border-strong': '#d1d5d8',           // Strong borders (gray-300)
        'border-focus': '#2563eb',            // Focus state borders
        'border-active': '#1e3a8a',           // Active element borders
        'divider-default': '#e5e7eb',         // Section dividers
        
        // Focus & Interactive States
        'focus-ring': '#60a5fa',              // Focus ring color (blue-400)
        'focus-ring-offset': '#ffffff',       // Focus ring offset
        
        // Shadow Colors
        'shadow-subtle': 'rgba(0, 0, 0, 0.05)',   // Subtle shadows
        'shadow-default': 'rgba(0, 0, 0, 0.1)',   // Default shadows
        'shadow-strong': 'rgba(0, 0, 0, 0.15)',   // Strong shadows
        
        // Accent/Special Colors
        'accent-gold': '#f59e0b',             // Gold/amber accent
        'accent-gold-bg': '#fef3c7',          // Gold background
        'accent-gold-gradient-start': '#fff9c4', // Gold gradient start
        'accent-gold-gradient-mid': '#fdd835',   // Gold gradient mid
        'accent-gold-gradient-end': '#f57f17',   // Gold gradient end
        'accent-silver': '#d1d5db',           // Silver accent (gray-300)
        'accent-silver-bg': '#f3f4f6',        // Silver background
        'accent-purple': '#a855f7',           // Purple accent
        'accent-indigo': '#6366f1',           // Indigo accent
        'accent-green': '#10b981',            // Green accent
        
        // Video Call / Interview Call Colors
        'call-bg': '#111827',                 // Call background (gray-900)
        'call-panel': '#1f2937',              // Call panel bg (gray-800)
        'call-control': '#374151',            // Call control bg (gray-700)
        'call-control-hover': '#4b5563',      // Call control hover (gray-600)
        'call-active': '#2563eb',             // Call active state (blue-600)
        'call-active-hover': '#1d4ed8',       // Call active hover (blue-700)
        
        // Notification Colors
        'notification-unread': '#3b82f6',     // Unread indicator (blue-500)
        'notification-bg': '#ffffff',         // Notification background
        'notification-border': '#e5e7eb',     // Notification border
        
        // Badge/Chip Colors
        'badge-bg': '#dbeafe',                // Badge background (blue-100)
        'badge-text': '#1e3a8a',              // Badge text (blue-900)
        'badge-border': '#bfdbfe',            // Badge border (blue-200)
        
        // Dropdown/Menu Colors
        'dropdown-bg': '#ffffff',             // Dropdown background
        'dropdown-border': '#bfdbfe',         // Dropdown border (blue-200)
        'dropdown-hover': '#dbeafe',          // Dropdown item hover (blue-50)
        'dropdown-active': '#bfdbfe',         // Dropdown item active (blue-100)
        
        // Special UI Elements
        'coin-golden': '#f59e0b',             // Golden coin color
        'coin-golden-gradient-start': '#f59e0b', // Golden coin gradient
        'coin-golden-gradient-end': '#d97706',   // Golden coin gradient end
        'coin-silver': '#d1d5db',             // Silver coin color
        'coin-silver-gradient-start': '#d1d5db', // Silver coin gradient
        'coin-silver-gradient-end': '#9ca3af',   // Silver coin gradient end
        
        // Skeleton/Loading Colors
        'skeleton-bg': '#f3f4f6',             // Skeleton background
        'skeleton-shimmer': '#e5e7eb',        // Skeleton shimmer
        
        // Whiteboard Colors
        'whiteboard-bg': '#ffffff',           // Whiteboard background
        'whiteboard-border': '#374151',       // Whiteboard border (gray-700)
        'whiteboard-pen': '#22c55e',          // Whiteboard pen color
        
        // ============================================
        // RECRUITMENT SECTION COLORS
        // ============================================
        
        // Recruitment Role Cards - Default State
        'role-card-bg-start': '#eff6ff',      // Role card gradient start (blue-50)
        'role-card-bg-end': '#dbeafe',        // Role card gradient end (blue-100)
        'role-card-border': '#bfdbfe',        // Role card border (blue-200)
        'role-card-border-hover': '#93c5fd',  // Role card hover border (blue-300)
        'role-card-icon-bg-start': '#3b82f6', // Role icon gradient start (blue-500)
        'role-card-icon-bg-end': '#2563eb',   // Role icon gradient end (blue-600)
        
        // Recruitment Role Cards - Verified State
        'role-verified-bg-start': '#dcfce7',  // Verified gradient start (green-100)
        'role-verified-bg-end': '#bbf7d0',    // Verified gradient end (green-200)
        'role-verified-border': '#86efac',    // Verified border (green-300)
        'role-verified-icon-bg-start': '#10b981', // Verified icon start (green-500)
        'role-verified-icon-bg-end': '#059669',   // Verified icon end (green-600)
        'role-verified-text': '#14532d',      // Verified text (green-900)
        'role-verified-button': '#10b981',    // Verified button bg (green-500)
        
        // Recruitment Role Cards - Pending State
        'role-pending-bg-start': '#fef3c7',   // Pending gradient start (amber-100)
        'role-pending-bg-end': '#fde68a',     // Pending gradient end (amber-200)
        'role-pending-border': '#fcd34d',     // Pending border (amber-300)
        'role-pending-icon-bg-start': '#f59e0b', // Pending icon start (amber-500)
        'role-pending-icon-bg-end': '#d97706',   // Pending icon end (amber-600)
        'role-pending-text': '#78350f',       // Pending text (amber-900)
        'role-pending-button': '#f59e0b',     // Pending button bg (amber-500)
        
        // Recruitment CTA Section
        'recruitment-cta-bg-start': '#1e40af', // CTA gradient start (blue-800)
        'recruitment-cta-bg-end': '#1e3a8a',   // CTA gradient end (blue-900)
        'recruitment-cta-text': '#dbeafe',     // CTA text (blue-100)
        'recruitment-badge-bg': '#1e3a8a',     // Badge bg (blue-900)
        
        // ============================================
        // CAMPUS DASHBOARD COLORS
        // ============================================
        
        // Campus Section Backgrounds
        'campus-bg-gradient-start': '#f8fafc', // Campus gradient start (slate-50)
        'campus-bg-gradient-end': '#e0f2fe',   // Campus gradient end (sky-100)
        'campus-accent-overlay': 'rgba(59, 130, 246, 0.06)', // Campus radial overlay
        
        // Campus Badge
        'campus-badge-border': '#bfdbfe',      // Badge border (blue-200)
        'campus-badge-bg': 'rgba(255, 255, 255, 0.8)', // Badge background
        'campus-badge-text': '#1e3a8a',        // Badge text (blue-900)
        'campus-badge-dot': '#2563eb',         // Badge animated dot (blue-600)
        
        // Campus Title & Content
        'campus-title': '#0f172a',             // Main title (slate-900)
        'campus-title-accent': '#1d4ed8',      // Title accent (blue-700)
        'campus-body-text': '#475569',         // Body text (slate-600)
        
        // Campus Stat Cards
        'campus-stat-bg': 'rgba(255, 255, 255, 0.9)', // Stat card background
        'campus-stat-border': '#cbd5e1',       // Stat card border (slate-300)
        'campus-stat-border-hover': '#93c5fd', // Stat card hover border (blue-300)
        'campus-stat-icon-1-start': '#3b82f6', // First stat icon gradient start (blue-500)
        'campus-stat-icon-1-end': '#2563eb',   // First stat icon gradient end (blue-600)
        'campus-stat-icon-2-start': '#6366f1', // Second stat icon gradient start (indigo-500)
        'campus-stat-icon-2-end': '#4f46e5',   // Second stat icon gradient end (indigo-600)
        'campus-stat-label': '#64748b',        // Stat label text (slate-500)
        'campus-stat-value': '#0f172a',        // Stat value text (slate-900)
        
        // Campus CTA Button
        'campus-cta-bg-start': '#2563eb',      // CTA gradient start (blue-600)
        'campus-cta-bg-end': '#1d4ed8',        // CTA gradient end (blue-700)
        'campus-cta-bg-hover-start': '#1d4ed8', // CTA hover start (blue-700)
        'campus-cta-bg-hover-end': '#1e40af',  // CTA hover end (blue-800)
        'campus-cta-shadow': 'rgba(37, 99, 235, 0.25)', // CTA shadow color
        
        // Campus Floating Cards
        'campus-float-card-bg': 'rgba(255, 255, 255, 0.95)', // Floating card bg
        'campus-float-card-border': '#e2e8f0', // Floating card border (slate-200)
        'campus-float-icon-1': '#10b981',      // Syllabus icon (emerald-500)
        'campus-float-icon-2': '#3b82f6',      // Weekly icon (blue-500)
        'campus-float-icon-3': '#8b5cf6',      // Progress icon (violet-500)
        'campus-float-icon-4': '#f59e0b',      // Institution icon (amber-500)
        
        // Campus Image Container
        'campus-image-border': '#cbd5e1',      // Image container border (slate-300)
        'campus-placeholder-bg-start': '#eff6ff', // Placeholder gradient start (blue-50)
        'campus-placeholder-bg-end': '#e0e7ff',   // Placeholder gradient end (indigo-50)
        
        // ============================================
        // TESTIMONIALS SECTION COLORS
        // ============================================
        
        'testimonial-section-bg': '#f9fafb',   // Section background (gray-50)
        'testimonial-gradient-fade': '#f9fafb', // Fade gradient (gray-50)
        'testimonial-card-bg': '#ffffff',      // Card background
        'testimonial-card-border': '#e5e7eb',  // Card border (gray-200)
        'testimonial-card-hover': '#f3f4f6',   // Card hover bg (gray-100)
        'testimonial-title': '#111827',        // Title text (gray-900)
        'testimonial-body': '#4b5563',         // Body text (gray-600)
        'testimonial-stars': '#fbbf24',        // Star color (amber-400)
        'testimonial-name': '#1f2937',         // Name text (gray-800)
        'testimonial-role': '#6b7280',         // Role text (gray-500)
        
        // ============================================
        // HOME SECTION BACKGROUNDS
        // ============================================
        
        'home-bg': '#f8fafc',                  // Main home background (slate-50)
        'home-section-alt': '#ffffff',         // Alternate section background
        'home-gradient-start': '#f1f5f9',      // Home gradient start (slate-100)
        'home-gradient-end': '#e0f2fe',        // Home gradient end (sky-100)
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
