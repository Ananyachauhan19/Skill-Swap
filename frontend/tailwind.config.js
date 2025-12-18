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
      'md': '768px',
      'tablet': '810px',
      'lg': '1024px',
      'ipad-pro': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        lora: ['Lora', 'serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        // Legacy colors (will be deprecated)
        cream: {
          50: '#FFFDD0',
          100: '#FEFCBF',
          200: '#FAF089',
        },
        'home-bg': '#F5F9FF',

        // ========================================
        // SEMANTIC COLOR TOKENS - SINGLE SOURCE OF TRUTH
        // ========================================

        // Brand / Primary Colors
        'brand-primary': '#1E3A8A',        // Deep blue (blue-900)
        'brand-secondary': '#3B82F6',      // Medium blue (blue-500)
        'brand-accent': '#60A5FA',         // Light blue (blue-400)
        'brand-dark': '#1E40AF',           // Dark blue (blue-800)
        'brand-light': '#DBEAFE',          // Very light blue (blue-100)

        // Background Colors
        'bg-page': '#F5F9FF',              // Main page background (soft whitish)
        'bg-section': '#FFFFFF',           // Section background (white)
        'bg-card': '#FFFFFF',              // Card background
        'bg-modal': '#FFFFFF',             // Modal/dialog background
        'bg-overlay': 'rgba(0, 0, 0, 0.4)', // Overlay backdrop
        'bg-hover': '#EFF6FF',             // Hover state background (blue-50)
        'bg-active': '#DBEAFE',            // Active state background (blue-100)
        'bg-disabled': '#F3F4F6',          // Disabled background (gray-100)
        'bg-input': '#FFFFFF',             // Input field background
        'bg-sidebar': '#F9FAFB',           // Sidebar background (gray-50)

        // Text Colors
        'text-heading': '#1E3A8A',         // Heading text (blue-900)
        'text-body': '#374151',            // Body text (gray-700)
        'text-muted': '#6B7280',           // Muted text (gray-500)
        'text-link': '#3B82F6',            // Link text (blue-500)
        'text-inverted': '#FFFFFF',        // Text on dark backgrounds
        'text-placeholder': '#9CA3AF',     // Placeholder text (gray-400)
        'text-disabled': '#D1D5DB',        // Disabled text (gray-300)
        'text-emphasis': '#1E3A8A',        // Emphasized text (blue-900)

        // Button Colors - Primary
        'button-primary-default': '#1E40AF',  // Primary button default (blue-800)
        'button-primary-hover': '#1E3A8A',    // Primary button hover (blue-900)
        'button-primary-active': '#1E3A8A',   // Primary button active (blue-900)
        'button-primary-disabled': '#9CA3AF', // Primary button disabled (gray-400)
        'button-primary-text': '#FFFFFF',     // Primary button text

        // Button Colors - Secondary
        'button-secondary-default': '#EFF6FF',  // Secondary button default (blue-50)
        'button-secondary-hover': '#DBEAFE',    // Secondary button hover (blue-100)
        'button-secondary-active': '#BFDBFE',   // Secondary button active (blue-200)
        'button-secondary-disabled': '#F3F4F6', // Secondary button disabled (gray-100)
        'button-secondary-text': '#1E3A8A',     // Secondary button text (blue-900)

        // Button Colors - Ghost/Transparent
        'button-ghost-default': 'transparent',
        'button-ghost-hover': '#EFF6FF',        // Ghost button hover (blue-50)
        'button-ghost-text': '#1E3A8A',         // Ghost button text (blue-900)

        // Status Colors
        'status-success': '#10B981',            // Success green (green-500)
        'status-success-light': '#D1FAE5',      // Success light (green-100)
        'status-success-text': '#065F46',       // Success text (green-800)
        'status-error': '#EF4444',              // Error red (red-500)
        'status-error-light': '#FEE2E2',        // Error light (red-100)
        'status-error-text': '#991B1B',         // Error text (red-800)
        'status-warning': '#F59E0B',            // Warning amber (amber-500)
        'status-warning-light': '#FEF3C7',      // Warning light (amber-100)
        'status-warning-text': '#92400E',       // Warning text (amber-800)
        'status-info': '#3B82F6',               // Info blue (blue-500)
        'status-info-light': '#DBEAFE',         // Info light (blue-100)
        'status-info-text': '#1E40AF',          // Info text (blue-800)

        // Borders & Dividers
        'border-default': '#E5E7EB',            // Default border (gray-200)
        'border-strong': '#9CA3AF',             // Strong border (gray-400)
        'border-light': 'rgba(229, 231, 235, 0.5)', // Light border (gray-200/50)
        'border-focus': '#3B82F6',              // Focus border (blue-500)
        'border-error': '#EF4444',              // Error border (red-500)
        'divider-default': '#E5E7EB',           // Divider line (gray-200)
        'divider-light': 'rgba(229, 231, 235, 0.3)', // Light divider

        // Focus & Interaction States
        'focus-ring': '#3B82F6',                // Focus ring color (blue-500)
        'focus-ring-offset': '#FFFFFF',         // Focus ring offset
        'focus-outline': '#93C5FD',             // Focus outline (blue-300)

        // Shadows & Overlays
        'shadow-subtle': 'rgba(0, 0, 0, 0.1)',  // Subtle shadow
        'shadow-default': 'rgba(0, 0, 0, 0.15)', // Default shadow
        'shadow-strong': 'rgba(0, 0, 0, 0.25)',  // Strong shadow
        'overlay-light': 'rgba(0, 0, 0, 0.2)',   // Light overlay
        'overlay-default': 'rgba(0, 0, 0, 0.4)', // Default overlay
        'overlay-strong': 'rgba(0, 0, 0, 0.6)',  // Strong overlay

        // Navbar Specific
        'navbar-bg': '#F5F9FF',                  // Navbar background
        'navbar-text': '#1E3A8A',                // Navbar text (blue-900)
        'navbar-border': 'rgba(229, 231, 235, 0.5)', // Navbar border
        'navbar-hover': '#DBEAFE',               // Navbar hover state (blue-100)
        'navbar-active': '#BFDBFE',              // Navbar active state (blue-200)

        // Form Elements
        'input-border': '#D1D5DB',               // Input border (gray-300)
        'input-border-focus': '#3B82F6',         // Input border focus (blue-500)
        'input-bg': '#FFFFFF',                   // Input background
        'input-text': '#1E3A8A',                 // Input text (blue-900)
        'input-placeholder': '#60A5FA',          // Input placeholder (blue-400)

        // Dropdown & Menu
        'dropdown-bg': '#FFFFFF',                // Dropdown background
        'dropdown-border': '#BFDBFE',            // Dropdown border (blue-200)
        'dropdown-hover': '#EFF6FF',             // Dropdown hover (blue-50)
        'dropdown-text': '#1E3A8A',              // Dropdown text (blue-900)
        'dropdown-text-muted': 'rgba(30, 58, 138, 0.7)', // Dropdown muted text

        // Badge & Tag
        'badge-bg': 'rgba(219, 234, 254, 0.5)',  // Badge background (blue-100/50)
        'badge-text': '#1E3A8A',                 // Badge text (blue-900)
        'badge-border': '#93C5FD',               // Badge border (blue-300)

        // Avatar & Profile
        'avatar-bg': '#1E40AF',                  // Avatar background (blue-800)
        'avatar-border': '#1E3A8A',              // Avatar border (blue-900)
        'avatar-text': '#FFFFFF',                // Avatar text

        // Utility Colors
        'utility-transparent': 'transparent',
        'utility-white': '#FFFFFF',
        'utility-black': '#000000',
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
