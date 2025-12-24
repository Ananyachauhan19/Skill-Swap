import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white border-t border-gray-700 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px' 
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>

      {/* Wave Divider */}
      <div className="w-full overflow-hidden">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-16"
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            opacity="0.25" 
            className="fill-current text-gray-700"
          ></path>
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            opacity="0.5" 
            className="fill-current text-gray-800"
          ></path>
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-current text-slate-800"
          ></path>
        </svg>
      </div>
      
      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row lg:gap-x-16 py-10">
          {/* Right Side - 68% (Appears first on mobile) */}
          <div className="w-full lg:w-[68%] p-6 flex flex-col justify-between order-1 lg:order-none">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-white mb-3">Join Our Community</h2>
              <p className="text-base text-gray-300 max-w-2xl leading-relaxed">
                Connect with experts, share knowledge, and grow your skills through live sessions, group discussions, and real interview practice.
              </p>
            </div>

            {/* Menu Links - Dark Tabs Design */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {/* Product */}
              <div className="bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b-2 border-blue-500/50">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/one-on-one" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      1-on-1 Sessions
                    </a>
                  </li>
                  {/* <li>
                    <a href="/discuss" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Group Discussion
                    </a>
                  </li> */}
                  <li>
                    <a href="/interview" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Interview Practice
                    </a>
                  </li>
                  <li>
                    <a href="/profile/panel/your-home" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Learning Sessions
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div className="bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b-2 border-blue-500/50">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/about" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="/career" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="/blog" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="/community" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Community
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b-2 border-blue-500/50">Support</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/help" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/help" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="/faq" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      FAQs
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div className="bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b-2 border-blue-500/50">Legal</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/terms-conditions" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="/privacy-policy" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="cookies" className="text-gray-300 hover:text-white hover:underline transition-all duration-300 flex items-center gap-2 group">
                      <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></span>
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Rating Button */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Share Your Experience</h3>
                <p className="text-gray-300 text-sm max-w-xl">
                  Help us improve by sharing your feedback and rating your experience with SkillSwapHub
                </p>
              </div>
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
                onClick={() => navigate('/testimonials')}
              >
                Add Your Rating
              </button>
            </div>
          </div>

          {/* Left Side - 28% (Appears after right panel on mobile) */}
          <div className="w-full lg:w-[28%] p-6 flex flex-col justify-between order-2 lg:order-none">
            <div>
              {/* Logo and Title */}
              <div
                className="flex items-center gap-4 cursor-pointer transition-transform duration-300 hover:scale-105 mb-8"
                onClick={() => navigate('/')}
              >
                <div className="relative">
                  <svg className="h-16 w-16">
                    <circle cx="32" cy="32" r="30" fill="none" stroke="#60A5FA" strokeWidth="2"/>
                    <text x="32" y="32" fontSize="8" fill="#60A5FA" textAnchor="middle" fontWeight="bold" letterSpacing="1">
                    </text>
                    <defs>
                      <path id="circlePath" d="M 32,32 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0"/>
                    </defs>
                  </svg>
                  <img
                    src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
                    alt="SkillSwapHub Logo"
                    className="h-12 w-12 object-contain absolute top-2 left-2"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">SkillSwapHub</h1>
                  <p className="text-sm text-gray-300 leading-relaxed mt-1 max-w-xs">
                    Empowering people to learn, teach, and grow together
                  </p>
                </div>
              </div>

              {/* Support & Inquiry */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Support & Inquiry</h3>
                <div className="flex items-center gap-2 bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a
                    href="mailto:skillswaphubb@gmail.com"
                    className="text-gray-300 hover:text-white hover:underline text-sm break-all"
                  >
                    skillswaphubb@gmail.com
                  </a>
                </div>
              </div>

              {/* Newsletter */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">Stay Updated</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Subscribe to our newsletter for the latest updates
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-grow px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-gray-800/80 backdrop-blur-sm"
                  />
                  <button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            <div>
              {/* Social Media Icons */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
                <div className="flex items-center gap-4">
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/skillswaphub.in?igsh=YWd2anJ3YnVybWs3"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm border-2 border-gray-700/50 hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    <svg className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Instagram</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://whatsapp.com/channel/0029VbC2j0cFsn0eAHHgoS3v"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm border-2 border-gray-700/50 hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    <svg className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">WhatsApp</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/in/skillswap-hub-391476378?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800/60 to-slate-800/60 backdrop-blur-sm border-2 border-gray-700/50 hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    <svg className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">LinkedIn</span>
                  </a>

                  {/* Facebook - Placeholder for now */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    aria-label="Facebook (Coming Soon)"
                    className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700/40 to-gray-600/40 backdrop-blur-sm border-2 border-gray-600/30 opacity-50 cursor-not-allowed"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </a>
                </div>
              </div>

              {/* Copyright */}
              <div className="text-gray-400 text-sm border-t border-gray-700/50 pt-4">
                © {new Date().getFullYear()} SkillSwapHub. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;