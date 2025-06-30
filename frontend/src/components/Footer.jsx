import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-700 text-white pt-10 pb-4 px-2 sm:px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-blue-500 pb-6">
        {/* Logo and About */}
        <div className="flex flex-col items-start gap-2 md:w-1/3 w-full">
          <div className="flex items-center gap-2 mb-2">
            <img src="/assets/skillswap-logo.jpg" alt="SkillSwapHub Logo" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold tracking-wide">SkillSwapHub</span>
          </div>
          <p className="text-sm text-blue-100 max-w-xs">Empowering people to learn, teach, and grow together through live sessions, group discussions, and real interview practice.</p>
        </div>
        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-8 md:w-2/3 w-full justify-end">
          <div>
            <h4 className="font-semibold mb-2">Product</h4>
            <ul className="text-sm space-y-1">
              <li><a href="/one-on-one" className="hover:underline">1-on-1 Sessions</a></li>
              <li><a href="/discuss" className="hover:underline">Group Discussion</a></li>
              <li><a href="/interview" className="hover:underline">Interview Practice</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Company</h4>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="hover:underline">About Us</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="hover:underline">Help Center</a></li>
              <li><a href="#" className="hover:underline">Contact Us</a></li>
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
      {/* Socials and Copyright */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-blue-200 gap-2">
        <div className="flex gap-4 mb-2 md:mb-0">
          <a href="#" aria-label="Twitter" className="hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 001.88-2.37 8.59 8.59 0 01-2.72 1.04A4.28 4.28 0 0016.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.71-.02-1.38-.22-1.97-.54v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 012 19.54c-.28 0-.56-.02-.83-.05A12.13 12.13 0 007.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0024 4.59a8.36 8.36 0 01-2.54.7z" />
            </svg>
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.38v4.59h-3v-9h2.88v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z" />
            </svg>
          </a>
          <a href="#" aria-label="Facebook" className="hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.68 0h-21.36c-.73 0-1.32.59-1.32 1.32v21.36c0 .73.59 1.32 1.32 1.32h11.49v-9.29h-3.13v-3.62h3.13v-2.67c0-3.1 1.89-4.79 4.65-4.79 1.32 0 2.46.1 2.79.14v3.24h-1.91c-1.5 0-1.79.71-1.79 1.75v2.33h3.58l-.47 3.62h-3.11v9.29h6.09c.73 0 1.32-.59 1.32-1.32v-21.36c0-.73-.59-1.32-1.32-1.32z" />
            </svg>
          </a>
        </div>
        <div className="text-center md:text-right w-full md:w-auto">© {new Date().getFullYear()} SkillSwapHub. All rights reserved.</div>
      </div>
    </footer>
  );
};

export default Footer;
