import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border-t border-blue-300">
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
            className="fill-current text-blue-200"
          ></path>
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            opacity="0.5" 
            className="fill-current text-blue-300"
          ></path>
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-current text-blue-400"
          ></path>
        </svg>
      </div>
      
      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:gap-x-16 py-10">
          {/* Right Side - 68% (Appears first on mobile) */}
          <div className="w-full lg:w-[68%] p-6 flex flex-col justify-between order-1 lg:order-none">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-blue-900 mb-3">Join Our Community</h2>
              <p className="text-base text-gray-800 max-w-2xl leading-relaxed">
                Connect with experts, share knowledge, and grow your skills through live sessions, group discussions, and real interview practice.
              </p>
            </div>

            {/* Menu Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              {/* Product */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b-2 border-blue-300">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/one-on-one" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      1-on-1 Sessions
                    </a>
                  </li>
                  <li>
                    <a href="/discuss" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Group Discussion
                    </a>
                  </li>
                  <li>
                    <a href="/interview" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Interview Practice
                    </a>
                  </li>
                  <li>
                    <a href="/session" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Learning Sessions
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b-2 border-blue-300">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/help" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="/blog" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Community
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b-2 border-blue-300">Support</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/help" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/help" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="/help" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      FAQs
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b-2 border-blue-300">Legal</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-800 hover:text-blue-700 hover:underline transition-all duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Rating Button */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 rounded-xl p-5 border border-blue-200">
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">Share Your Experience</h3>
                <p className="text-gray-800 text-sm max-w-xl">
                  Help us improve by sharing your feedback and rating your experience with SkillSwapHub
                </p>
              </div>
              <button
                className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-blue-800 hover:to-blue-600 hover:scale-[1.03] hover:shadow-lg whitespace-nowrap"
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
                    <circle cx="32" cy="32" r="30" fill="none" stroke="#1E3A8A" strokeWidth="2"/>
                    <text x="32" y="32" fontSize="8" fill="#1E3A8A" textAnchor="middle" fontWeight="bold" letterSpacing="1">
                    </text>
                    <defs>
                      <path id="circlePath" d="M 32,32 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0"/>
                    </defs>
                  </svg>
                  <img
                    src="/assets/skillswap-logo.webp"
                    alt="SkillSwapHub Logo"
                    className="h-12 w-12 object-contain absolute top-2 left-2"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">SkillSwap Hub</h1>
                  <p className="text-sm text-gray-800 leading-relaxed mt-1 max-w-xs">
                    Empowering people to learn, teach, and grow together
                  </p>
                </div>
              </div>

              {/* Support & Inquiry */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Support & Inquiry</h3>
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a
                    href="mailto:skillswaphubb@gmail.com"
                    className="text-gray-800 hover:text-blue-700 hover:underline text-sm break-all"
                  >
                    skillswaphubb@gmail.com
                  </a>
                </div>
              </div>

              {/* Newsletter */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Stay Updated</h3>
                <p className="text-gray-800 text-sm mb-4">
                  Subscribe to our newsletter for the latest updates
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-grow px-4 py-3 rounded-xl bg-white border border-blue-300 text-gray-800 placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
                  />
                  <button
                    className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-blue-800 hover:to-blue-600 hover:scale-[1.02] hover:shadow-lg whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            <div>
              {/* Social Media Icons */}
              <div className="flex items-center gap-3 mt-4">
                {[
                  {
                    name: 'instagram',
                    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.326 3.608 1.301.975.975 1.24 2.242 1.301 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.326 2.633-1.301 3.608-.975.975-2.242 1.24-3.608 1.301-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.326-3.608-1.301-.975-.975-1.24-2.242-1.301-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.326-2.633 1.301-3.608.975-.975 2.242-1.24 3.608-1.301 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.627.073-3.083.398-4.267 1.582-1.184 1.184-1.509 2.64-1.582 4.267-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.073 1.627.398 3.083 1.582 4.267 1.184 1.184 2.64 1.509 4.267 1.582 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.627-.073 3.083-.398 4.267-1.582 1.184-1.184 1.509-2.64 1.582-4.267.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.073-1.627-.398-3.083-1.582-4.267-1.184-1.184-2.64-1.509-4.267-1.582-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.441-1.441-1.441z',
                  },
                  {
                    name: 'x',
                    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
                  },
                  {
                    name: 'linkedin',
                    path: 'M22.225 0H1.775C.797 0 0 .797 0 1.775v20.451C0 23.203.797 24 1.775 24h20.451c.977 0 1.775-.797 1.775-1.775V1.775C24 .797 23.203 0 22.225 0zM7.165 20.451H3.558V9.045h3.607v11.406zM5.362 7.528c-1.158 0-2.098-.94-2.098-2.098 0-1.159.94-2.098 2.098-2.098 1.159 0 2.098.939 2.098 2.098 0 1.158-.939 2.098-2.098 2.098zm15.089 12.923h-3.607v-5.947c0-1.418-.025-3.24-1.975-3.24-1.975 0-2.279 1.541-2.279 3.136v6.051h-3.607V9.045h3.462v1.563h.049c.483-.914 1.663-1.879 3.419-1.879 3.656 0 4.333 2.406 4.333 5.534v6.188z',
                  },
                  {
                    name: 'github',
                    path: 'M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.756-1.333-1.756-1.087-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.762-1.604-2.665-.305-5.467-1.333-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.304-.535-1.527.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.649.242 2.872.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.604-.015 2.898-.015 3.293 0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z',
                  },
                  {
                    name: 'facebook',
                    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-2.628v-3.469h2.628v-2.644c0-2.606 1.598-4.038 3.938-4.038 1.119 0 2.081.083 2.359.12v2.738h-1.621c-1.271 0-1.517.604-1.517 1.49v1.954h3.034l-.396 3.469h-2.638v8.385c5.737-.9 10.125-5.864 10.125-11.854z',
                  },
                  {
                    name: 'youtube',
                    path: 'M23.498 6.186c-.276-1.038-1.088-1.85-2.126-2.126C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.372.56C1.59 4.336.778 5.148.502 6.186.001 8.053 0 12 0 12s0 3.947.502 5.814c.276 1.038 1.088 1.85 2.126 2.126 1.867.56 9.372.56 9.372.56s7.505 0 9.372-.56c1.038-.276 1.85-1.088 2.126-2.126.501-1.867.502-5.814.502-5.814s-.001-3.947-.502-5.814zM9.75 15.75V8.25l6.5 3.75-6.5 3.75z',
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href="#"
                    aria-label={social.name}
                    className="flex items-center justify-center border border-blue-300 p-1.5 rounded-full hover:bg-blue-700 hover:text-white transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4 text-blue-900 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>

              {/* Copyright */}
              <div className="text-gray-800 text-sm border-t border-blue-200 pt-4">
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