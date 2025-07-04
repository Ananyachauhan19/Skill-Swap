import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
   <div className="flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 shadow-lg border-t border-blue-300">
      {/* Left Side - 30% */}
      <div className="w-full lg:w-[30%] p-6 sm:p-8 flex flex-col justify-between">

        
        {/* Logo and Title */}
        <div
          className="flex items-center gap-4 cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => navigate('/')}
        >
          <img
            src="/assets/skillswap-logo.webp"
            alt="SkillSwapHub Logo"
            className="h-12 w-12 object-contain rounded-full border-2 border-blue-300 shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900">SkillSwapHub</h1>
            <p className="text-sm text-gray-800 leading-relaxed">
              Empowering people to learn, teach, and grow together
            </p>
          </div>
        </div>

        {/* Real-time 1-on-1 Session */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Real-time 1-on-1 Session</h2>
          <p className="text-sm text-gray-800 mb-4">Schedule your live session now!</p>
          <button
            onClick={() => navigate('/one-on-one')}
            className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:from-blue-800 hover:to-blue-600 hover:scale-105 hover:shadow-lg"
          >
            Book Now
          </button>
        </div>

        {/* Support & Inquiry */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Support & Inquiry</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-800 text-sm w-16">Email:</span>
              <a
                href="mailto:skillswaphub@example.com"
                className="text-gray-800 hover:underline text-sm break-all"
              >
                skillswaphub@example.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-800 text-sm w-16">Mobile:</span>
              <a
                href="tel:+917508669870"
                className="text-gray-800 hover:underline text-sm"
              >
                +917508669870
              </a>
            </div>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="flex gap-3 mt-6">
          {[
            { name: 'instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.326 3.608 1.301.975.975 1.24 2.242 1.301 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.326 2.633-1.301 3.608-.975.975-2.242 1.24-3.608 1.301-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.326-3.608-1.301-.975-.975-1.24-2.242-1.301-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.326-2.633 1.301-3.608.975-.975 2.242-1.24 3.608-1.301 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.627.073-3.083.398-4.267 1.582-1.184 1.184-1.509 2.64-1.582  4.267-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.073 1.627.398 3.083 1.582 4.267 1.184 1.184 2.64 1.509 4.267 1.582 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.627-.073 3.083-.398 4.267-1.582 1.184-1.184 1.509-2.64 1.582-4.267.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.073-1.627-.398-3.083-1.582-4.267-1.184-1.184-2.64-1.509-4.267-1.582-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.441-1.441-1.441z' },
            { name: 'facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-2.628v-3.469h2.628v-2.644c0-2.606 1.598-4.038 3.938-4.038 1.119 0 2.081.083 2.359.12v2.738h-1.621c-1.271 0-1.517.604-1.517 1.49v1.954h3.034l-.396 3.469h-2.638v8.385c5.737-.9 10.125-5.864 10.125-11.854z' },
            { name: 'twitter', path: 'M23.643 4.937c-.835.37-1.732.62-2.675.733.961-.576 1.697-1.49 2.045-2.578-.898.532-1.892.922-2.949 1.131-.847-.904-2.054-1.468-3.39-1.468-2.565 0-4.645 2.08-4.645 4.645 0 .364.041.719.121 1.059-3.861-.194-7.287-2.042-9.577-4.853-.4.686-.629 1.485-.629 2.342 0 1.615.823 3.038 2.072 3.872-.764-.024-1.482-.234-2.112-.583v.058c0 2.256 1.606 4.138 3.737 4.563-.391.106-.803.162-1.227.162-.3 0-.592-.029-.877-.083.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.601-4.828 4.828-.343.025-.686.048-1.033.072-2.888 0-5.228-2.34-5.228-5.228 0-.289.025-.576.074-.857 2.55.954 5.437 1.523 8.607 1.523 10.335 0 15.976-8.564 15.976-15.976 0-.244-.005-.487-.015-.729 1.099-.793 2.055-1.784 2.811-2.911z' },
            { name: 'linkedin', path: 'M22.225 0H1.775C.797 0 0 .797 0 1.775v20.451C0 23.203.797 24 1.775 24h20.451c.977 0 1.775-.797 1.775-1.775V1.775C24 .797 23.203 0 22.225 0zM7.165 20.451H3.558V9.045h3.607v11.406zM5.362 7.528c-1.158 0-2.098-.940-2.098-2.098 0-1.159.94-2.098 2.098-2.098 1.159 0 2.098.939 2.098 2.098 0 1.158-.939 2.098-2.098 2.098zm15.089 12.923h-3.607v-5.947c0-1.418-.025-3.24-1.975-3.24-1.975 0-2.279 1.541-2.279 3.136v6.051h-3.607V9.045h3.462v1.563h.049c.483-.914 1.663-1.879 3.419-1.879 3.656 0 4.333 2.406 4.333 5.534v6.188z' },
            { name: 'youtube', path: 'M23.498 6.186c-.276-1.038-1.088-1.85-2.126-2.126C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.372.56C1.59 4.336.778 5.148.502 6.186.001 8.053 0 12 0 12s0 3.947.502 5.814c.276 1.038 1.088 1.85 2.126 2.126 1.867.56 9.372.56 9.372.56s7.505 0 9.372-.56c1.038-.276 1.85-1.088 2.126-2.126.501-1.867.502-5.814.502-5.814s-.001-3.947-.502-5.814zM9.75 15.75V8.25l6.5 3.75-6.5 3.75z' },
            { name: 'telegram', path: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.895 8.221l-1.88 8.893c-.133.627-.693 1.02-1.32.793l-2.88-2.12-1.39 1.34c-.154.148-.346.228-.54.228l.206-2.88 5.26-4.76c.23-.207.08-.573-.253-.407l-6.52 4.107-2.8-.88c-.627-.2-.64-1.107.013-1.333l11.28-4.347c.52-.2 1.093.133.92.786z' },
          ].map((social) => (
            <a
              key={social.name}
              href="#"
              aria-label={social.name}
              className="border border-blue-300 p-2 rounded-full hover:bg-blue-700 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <svg className="w-5 h-5 text-blue-600 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-6 text-gray-800 text-sm">
          © {new Date().getFullYear()} SkillSwapHub. All rights reserved.
        </div>
      </div>

      {/* Right Side - 70% */}
      <div className="w-full lg:w-[70%] p-6 sm:p-8 flex flex-col justify-between">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-blue-900 mb-3">Stay Updated</h2>
          <p className="text-base text-gray-800 max-w-2xl leading-relaxed">
            Empowering people to learn, teach, and grow together through live sessions, group discussions, and real interview practice.
          </p>
        </div>

        {/* Menu Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3 border-b border-blue-300 pb-2">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="/one-on-one" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  1-on-1 Sessions
                </a>
              </li>
              <li>
                <a href="/discuss" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Group Discussion
                </a>
              </li>
              <li>
                <a href="/interview" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Interview Practice
                </a>
              </li>
              <li>
                <a href="/workshops" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Workshops
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3 border-b border-blue-300 pb-2">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Press
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3 border-b border-blue-300 pb-2">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3 border-b border-blue-300 pb-2">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-blue-800 hover:underline transition-all duration-300">
                  GDPR
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Subscribe to Our Newsletter</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow px-4 py-2 rounded-full bg-white border border-blue-300 text-gray-800 placeholder-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
            />
            <button
              className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:from-blue-800 hover:to-blue-600 hover:scale-105 hover:shadow-lg"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;