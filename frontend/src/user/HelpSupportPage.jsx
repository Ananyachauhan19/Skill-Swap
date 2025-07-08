import React, { useState, useEffect } from "react";
import faqs from "./faqs";

const HelpSupportPage = () => {
	// FAQ search state
	const [faqSearch, setFaqSearch] = useState("");
	const [showAllFaqs, setShowAllFaqs] = useState(false);
	// Contact form state
	const [form, setForm] = useState({ name: "", email: "", message: "" });
	const [formStatus, setFormStatus] = useState("");
	const [formLoading, setFormLoading] = useState(false);

	// Filtered FAQs
	const filteredFaqs = faqs.filter((faq) =>
		faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
		faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
	);

	const visibleFaqs = showAllFaqs || faqSearch ? filteredFaqs : filteredFaqs.slice(0, 3);

	// Handle form input
	function handleFormChange(e) {
		setForm({ ...form, [e.target.name]: e.target.value });
	}

	// Handle form submit
	async function handleFormSubmit(e) {
		e.preventDefault();
		setFormStatus("");
		if (!form.name || !form.email || !form.message) {
			setFormStatus("Please fill in all fields.");
			return;
		}
		// Simple email validation
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
			setFormStatus("Please enter a valid email address.");
			return;
		}
		setFormLoading(true);
		try {
			const res = await fetch("/api/support/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (!res.ok) throw new Error("Failed to submit request");
			setFormStatus("Your request has been submitted! We'll get back to you soon.");
			setForm({ name: "", email: "", message: "" });
		} catch (err) {
			setFormStatus("Failed to submit your request. Please try again later.");
		} finally {
			setFormLoading(false);
		}
	}

	useEffect(() => {
		if (window.location.hash === "#contact-support") {
			const el = document.getElementById("contact-support");
			if (el) {
				setTimeout(() => {
					el.scrollIntoView({ behavior: "smooth", block: "start" });
				}, 100);
			}
		}
	}, []);

	return (
		<div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-8 text-gray-800 w-full">
			<h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Help & Support</h1>

            {/* Pro Features: Skill Coin Packages */}
			<div className="mb-8 sm:mb-10">
				<h2 className="text-xl sm:text-2xl font-semibold mb-4">Pro Feature: Skill Coin Packages</h2>
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-5 rounded-lg mb-6 text-yellow-900 text-sm sm:text-base overflow-x-auto">
					<p className="mb-2 font-semibold">Unlock more learning and teaching opportunities with Skill Coin Packages!</p>
					<ul className="list-disc list-inside space-y-2">
						<li><b>Silver Coin Packages:</b> <br/>
							- Buy Silver Skill Coins for live 1-on-1 sessions.<br/>
							- <b>Worth:</b> ₹0.25 per Silver Skill Coin.<br/>
							- (Package sizes and bonus coins coming soon!)
						</li>
						<li><b>Golden Coin Packages:</b> <br/>
							- Buy Golden Skill Coins for unlocking premium content and live/recorded sessions.<br/>
							- <b>Worth:</b> ₹2 per Golden Skill Coin.<br/>
							- (Package sizes and bonus coins coming soon!)
						</li>
						<li><b>Combo Packages:</b> <br/>
							- Get a mix of Golden and Silver Skill Coins at a special price.<br/>
							- (Details about combo offers will be available soon!)
						</li>
					</ul>
					<p className="mt-3 text-xs sm:text-sm text-yellow-800">Stay tuned for more details and the ability to purchase packages directly from your dashboard!</p>
				</div>
			</div>

            {/* How SkillSwapHub Works Section */}
			<div className="mb-8 sm:mb-10">
				<h2 className="text-xl sm:text-2xl font-semibold mb-4">How SkillSwapHub Works</h2>
				<div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-5 rounded-lg mb-6 text-blue-900 text-sm sm:text-base overflow-x-auto">
					<p className="mb-2 font-semibold">Welcome to SkillSwapHub!</p>
					<ul className="list-disc list-inside space-y-2">
						<li><b>Profile:</b> Set up your profile with your skills, what you want to learn, and your experience. Edit your profile anytime from the Profile page.</li>
						<li><b>Contribution Calendar:</b> Track your learning and teaching activity over the year, just like GitHub's contribution graph.</li>
						<li><b>Skill Coins & Credit System:</b> <br/>
							<ul className="list-disc ml-6 mt-2 space-y-1">
								<li><b>Two types of Skill Coins:</b> <br/>
									- <b>Golden Skill Coin</b>: Worth ₹2 per coin.<br/>
									- <b>Silver Skill Coin</b>: Worth ₹0.25 per coin.
								</li>
								<li><b>1-on-1 Live Sessions:</b> <br/>
									- Book using Silver Skill Coins. <br/>
									- 1 Silver Skill Coin per minute. <br/>
									- At session end, total coins (duration in minutes) are transferred from learner to tutor.
								</li>
								<li><b>Group Discussions (GD):</b> <br/>
									- GDs are job-based. <br/>
									- Search for your job and book a GD.<br/>
									- Price: ₹1500 per head for each GD.
								</li>
								<li><b>Interview Rounds:</b> <br/>
									- Book by job type with an expert.<br/>
									- Price: ₹500 per head per interview session.
								</li>
								<li><b>Go Live or Upload Recorded Sessions:</b> <br/>
									- Unlock a recorded session: 2 Golden Skill Coins.<br/>
									- Watch a full live session: 2 Golden Skill Coins.
								</li>
								<li><b>Referral Rewards:</b> <br/>
									- Bring your friends and earn Skill Coins for each successful referral!
								</li>
							</ul>
						</li>
						<li><b>Badges & Rank:</b> Earn badges and increase your rank by being active and helping others.</li>
						<li><b>Session Types:</b> Book or host <b>1-on-1</b> sessions, <b>Mock Interviews</b>, or <b>Group Discussions</b> on various topics.</li>
						<li><b>History:</b> View all your past sessions in the History page, filter by date, tutor, subject, or topic.</li>
						<li><b>Logout:</b> Use the logout button on your profile to securely end your session.</li>
						<li><b>Real-time Updates:</b> Profile and calendar update instantly when you make changes.</li>
					</ul>
				</div>
				<h2 className="text-lg sm:text-xl font-semibold mb-3">Common User Actions</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 md:gap-10 mb-8">
					<div className="bg-white border border-blue-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm md:shadow-lg mb-6 md:mb-0">
						<h3 className="font-semibold mb-3">Edit Your Profile & Privacy</h3>
						<ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
							<li>Go to your Profile page and click <b>Edit Profile</b>.</li>
							<li>Update your name, bio, contact info, country, university, education, skills, experience, and certificates.</li>
							<li>Adjust your privacy and notification settings in the Privacy section.</li>
							<li>Save changes to see them instantly reflected on your profile.</li>
						</ul>
					</div>
					<div className="bg-white border border-blue-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm md:shadow-lg mb-6 md:mb-0">
						<h3 className="font-semibold mb-3">Book, Edit, or Cancel a Session</h3>
						<ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
							<li>Go to the <b>Book a Mock Interview</b>, <b>Join a Discussion</b>, or <b>Book 1-on-1 Session</b> section.</li>
							<li>Choose a topic, date, and time, then confirm your booking.</li>
							<li>Edit or cancel bookings from your <b>History</b> or <b>Bookings</b> page (subject to cancellation policy).</li>
							<li>Credits will be deducted automatically.</li>
						</ul>
					</div>
					<div className="bg-white border border-blue-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm md:shadow-lg mb-6 md:mb-0">
						<h3 className="font-semibold mb-3">View Your History & Payments</h3>
						<ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
							<li>Open the <b>History</b> page from the menu to see all your past sessions.</li>
							<li>Filter by date, tutor, subject, or topic.</li>
							<li>Go to <b>Billing</b> or <b>Payment History</b> to view payments and download invoices.</li>
						</ul>
					</div>
					<div className="bg-white border border-blue-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm md:shadow-lg mb-6 md:mb-0">
						<h3 className="font-semibold mb-3">Reset Password & Account Security</h3>
						<ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
							<li>Go to Profile &gt; Settings &gt; Security.</li>
							<li>Click <b>Reset Password</b> and follow the instructions sent to your email.</li>
							<li>If you suspect your account is compromised, reset your password and contact support immediately.</li>
						</ul>
					</div>
					<div className="bg-white border border-blue-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm md:shadow-lg md:col-span-2 mb-6 md:mb-0">
						<h3 className="font-semibold mb-3">Report Issues, Bugs, or Suspicious Profiles</h3>
						<ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
							<li>Use the contact form below to report bugs, suspicious/fake profiles, or inappropriate behavior.</li>
							<li>Include as much detail as possible for faster resolution.</li>
						</ul>
					</div>
					<div className="bg-white border border-blue-100 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm md:shadow-lg md:col-span-2">
						<h3 className="font-semibold mb-3">Mobile & App Actions</h3>
						<ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
							<li>Access SkillSwapHub on your mobile browser. A dedicated app is coming soon!</li>
							<li>To update or reinstall the app, visit the App Store or Google Play Store.</li>
							<li>If the app crashes, try restarting or reinstalling. Contact support if issues persist.</li>
							<li>You can use your account on multiple devices.</li>
						</ul>
					</div>
				</div>
			</div>


			{/* Search Bar */}
			<div className="mb-6 sm:mb-8">
				<input
					type="text"
					placeholder="Search for help..."
					className="w-full p-2 sm:p-3 border rounded-lg shadow-sm text-sm sm:text-base"
					value={faqSearch}
					onChange={(e) => {
						setFaqSearch(e.target.value);
						setShowAllFaqs(false);
					}}
				/>
			</div>

			{/* FAQ Section */}
			<div className="mb-8 sm:mb-10">
				<h2 className="text-xl sm:text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
				<div className="space-y-3 sm:space-y-4 overflow-x-auto">
					{visibleFaqs.length === 0 ? (
						<div className="text-gray-500">No FAQs found for your search.</div>
					) : (
						visibleFaqs.map((faq, idx) => (
							<div key={idx} className="border p-3 sm:p-4 rounded-lg bg-gray-50">
								<p className="font-medium">{faq.question}</p>
								<p className="text-xs sm:text-sm text-gray-600 mt-1">{faq.answer}</p>
							</div>
						))
					)}
					{filteredFaqs.length > 3 && !showAllFaqs && !faqSearch && (
						<button
							onClick={() => setShowAllFaqs(true)}
							className="mt-2 text-blue-700 underline text-xs sm:text-sm font-medium hover:text-blue-900"
						>
							View More
						</button>
					)}
					{showAllFaqs && !faqSearch && filteredFaqs.length > 3 && (
						<button
							onClick={() => setShowAllFaqs(false)}
							className="mt-2 text-blue-700 underline text-xs sm:text-sm font-medium hover:text-blue-900"
						>
							Show Less
						</button>
					)}
				</div>
			</div>
			

			{/* Contact Support Form */}
            <div className="mb-10 sm:mb-12 w-full max-w-lg mx-auto px-2 sm:px-4" >
                <h2 id="contact-support" className="text-xl sm:text-2xl font-semibold mb-4">Still need help? Contact Us</h2>
                <form className="space-y-3 sm:space-y-4" onSubmit={handleFormSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        className="w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base"
                        value={form.name}
                        onChange={handleFormChange}
                        disabled={formLoading}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        className="w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base"
                        value={form.email}
                        onChange={handleFormChange}
                        disabled={formLoading}
                    />
                    <textarea
                        name="message"
                        placeholder="Describe your issue..."
                        className="w-full p-2 sm:p-3 border rounded-lg h-24 sm:h-32 text-sm sm:text-base"
                        value={form.message}
                        onChange={handleFormChange}
                        disabled={formLoading}
                    ></textarea>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm sm:text-base w-full"
                        disabled={formLoading}
                    >
                        {formLoading ? "Submitting..." : "Submit Request"}
                    </button>
                    {formStatus && (
                        <div className={`mt-2 text-xs sm:text-sm ${formStatus.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>{formStatus}</div>
                    )}
                </form>
            </div>

			{/* Quick Links */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-center mt-8">
				<div>
					<h3 className="font-semibold mb-1">Email Support</h3>
					<a href="mailto:support@yourdomain.com" className="text-xs sm:text-sm text-blue-700 underline break-all">support@yourdomain.com</a>
				</div>
				<div>
					<h3 className="font-semibold mb-1">Community Forum</h3>
					<a href="#" className="text-xs sm:text-sm text-blue-700 underline">Ask and answer questions with others.</a>
				</div>
			</div>
		</div>
	);
};

export default HelpSupportPage;
