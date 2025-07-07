import React from "react";

// Placeholder for backend purchase function
// async function purchasePackage(packageType) {

//   // await fetch('/api/purchase', { method: 'POST', body: JSON.stringify({ packageType }) })
//   // Handle payment and update user coins
// }

const GoPro = () => (
  <div className="max-w-10xl mx-auto p-8 sm:p-12 my-12 bg-white rounded-xl shadow-lg border border-blue-100 text-gray-800">
    <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-6 text-center">SkillSwapHub Pro Features</h1>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-blue-800">Skill Coin Packages</h2>
      <ul className="list-disc list-inside space-y-3 text-base">
        <li><b>Silver Coin Packages:</b> Buy Silver Skill Coins for live 1-on-1 sessions. <b>Worth:</b> ₹0.25 per Silver Skill Coin. (Package sizes and bonus coins coming soon!)</li>
        <li><b>Golden Coin Packages:</b> Buy Golden Skill Coins for unlocking premium content and live/recorded sessions. <b>Worth:</b> ₹2 per Golden Skill Coin. (Package sizes and bonus coins coming soon!)</li>
        <li><b>Combo Packages:</b> Get a mix of Golden and Silver Skill Coins at a special price. (Details about combo offers will be available soon!)</li>
      </ul>
      <p className="mt-3 text-sm text-yellow-800">Stay tuned for more details and the ability to purchase packages directly from your dashboard!</p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-blue-800">How Skill Coins Work</h2>
      <ul className="list-disc list-inside space-y-3 text-base">
        <li><b>Two types of Skill Coins:</b> <br />
          - <b>Golden Skill Coin</b>: Worth ₹2 per coin.<br />
          - <b>Silver Skill Coin</b>: Worth ₹0.25 per coin.
        </li>
        <li><b>1-on-1 Live Sessions:</b> Book using Silver Skill Coins. 1 Silver Skill Coin per minute. At session end, total coins (duration in minutes) are transferred from learner to tutor.</li>
        <li><b>Group Discussions (GD):</b> GDs are job-based. Search for your job and book a GD. Price: ₹1500 per head for each GD.</li>
        <li><b>Interview Rounds:</b> Book by job type with an expert. Price: ₹500 per head per interview session.</li>
        <li><b>Go Live or Upload Recorded Sessions:</b> Unlock a recorded session: 2 Golden Skill Coins. Watch a full live session: 2 Golden Skill Coins.</li>
        <li><b>Referral Rewards:</b> Bring your friends and earn Skill Coins for each successful referral!</li>
      </ul>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-blue-800">Why Go Pro?</h2>
      <ul className="list-disc list-inside space-y-3 text-base">
        <li>Unlock exclusive Skill Coin packages and bonus offers.</li>
        <li>Access premium content and live/recorded sessions.</li>
        <li>Enjoy priority support and early access to new features.</li>
        <li>Track your Skill Coin usage and payment history in your dashboard.</li>
        <li>Special combo deals for power users and professionals.</li>
      </ul>
    </section>
    <div className="text-center mt-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-900">Sample Packages</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center">
          <h4 className="font-bold text-lg text-blue-800 mb-2">Silver Starter</h4>
          <p className="text-2xl font-bold text-blue-900 mb-1">200 Silver Coins</p>
          <p className="text-base text-gray-700 mb-2">Worth ₹50</p>
          <span className="text-xs text-blue-700 mb-3">For 1-on-1 sessions</span>
          <button className="bg-blue-700 text-white px-6 py-2 rounded font-semibold mt-2 shadow hover:bg-blue-800 transition-all duration-200" disabled>{/* onClick={() => purchasePackage('silver')} */}
            Purchase Silver
          </button>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col items-center">
          <h4 className="font-bold text-lg text-yellow-800 mb-2">Golden Pro</h4>
          <p className="text-2xl font-bold text-yellow-900 mb-1">50 Golden Coins</p>
          <p className="text-base text-gray-700 mb-2">Worth ₹100</p>
          <span className="text-xs text-yellow-700 mb-3">For premium content</span>
          <button className="bg-yellow-500 text-white px-6 py-2 rounded font-semibold mt-2 shadow hover:bg-yellow-600 transition-all duration-200" disabled>{/* onClick={() => purchasePackage('golden')} */}
            Purchase Golden
          </button>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-yellow-100 border border-blue-200 rounded-lg p-6 flex flex-col items-center">
          <h4 className="font-bold text-lg text-blue-900 mb-2">Combo Pack</h4>
          <p className="text-2xl font-bold text-blue-900 mb-1">100 Silver + 20 Golden</p>
          <p className="text-base text-gray-700 mb-2">Worth ₹60</p>
          <span className="text-xs text-blue-700 mb-3">Best for all-rounders</span>
          <button className="bg-gradient-to-r from-blue-700 to-yellow-500 text-white px-6 py-2 rounded font-semibold mt-2 shadow hover:from-blue-800 hover:to-yellow-600 transition-all duration-200" disabled>{/* onClick={() => purchasePackage('combo')} */}
            Purchase Combo
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default GoPro;
