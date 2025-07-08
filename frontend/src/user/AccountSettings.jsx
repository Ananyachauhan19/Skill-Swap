import React from "react";

const sections = [
	{
		title: "📩 Contact Information",
		items: [
			"New Email Address (with verification option)",
			"New Phone Number (with OTP verification)",
		],
	},
	{
		title: "🔐 Security & Privacy",
		items: [
			"Change Password",
			"Two-Factor Authentication (2FA)",
			"Login Activity / Active Devices",
			"Deactivate Account",
		],
	},
	{
		title: "💳 Payments & Subscriptions",
		items: [
			"Saved Payment Methods",
			"Billing History",
			"Invoices & Receipts",
			"Active Subscriptions / Packages",
			"Upgrade or Cancel Plan",
		],
	},
	{
		title: "🧭 Platform Preferences",
		items: [
			"Theme Mode (Light/Dark)",
			"Notification Settings",
			"Email notifications",
		],
	},
	{
		title: "🪙 Credits & Coins",
		items: [
			"Current Silver & Golden Coin Balance",
			"Coin Earning History",
			"Coin Spending / Usage History",
			"Buy More Coins / Redeem Offers",
		],
	},
	{
		title: "📚 Learning & Teaching Records",
		items: [
			"My Sessions (as Learner)",
			"My Sessions (as Teacher)",
			"Skill Badges / Certifications Earned",
		],
	},
	{
		title: "📞 Support & Feedback",
		items: [
			"Help Center / Support Ticket",
			"Submit Feedback",
			"Report a Problem",
			"View Support History",
		],
	},
	{
		title: "⚙️ Referral Feature and Time Zone Setting",
		items: [
			"Referral Program (invite & earn)",
			"Time Zone Settings",
		],
	},
];

const handleAction = (sectionTitle, item) => {
	const navigateMap = {
		"Email Address (with verification option)": "/settings/email",
		"New Email Address (with verification option)": "/settings/email",
		"Phone Number (with OTP verification)": "/settings/phone",
		"New Phone Number (with OTP verification)": "/settings/phone",
		"Linked Social Accounts (e.g., Google, Facebook, GitHub)": "/settings/social",
		"Change Password": "/settings/password",
		"Two-Factor Authentication (2FA)": "/settings/twofactor",
		"Login Activity / Active Devices": "/settings/activedevices",
		"Deactivate Account": "/settings/deactivate",
		"Saved Payment Methods": "/settings/payment-methods",
		"Billing History": "/settings/billing-history",
		"Invoices & Receipts": "/settings/invoices",
		"Active Subscriptions / Packages": "/settings/subscriptions",
		"Upgrade or Cancel Plan": "/settings/plan",
		"Current Silver & Golden Coin Balance": "/settings/coin-balance",
		"Coin Earning History": "/settings/coin-earning-history",
		"Coin Spending / Usage History": "/settings/coin-spending-history",
		"Buy More Coins / Redeem Offers": "/settings/buy-redeem-coins",
		"My Sessions (as Learner/Expert)": "/settings/my-sessions",
		"Past Bookings": "/settings/past-bookings",
		"Skill Badges / Certifications Earned": "/settings/skill-badges",
		"Help Center / Support Ticket": "/help",
		"Submit Feedback": "/help",
		"Report a Problem": "/help",
		"View Support History": "/settings/support-history",
		"Referral Program (invite & earn)": "/settings/referral-program",
		"Time Zone Settings": "/settings/timezone-settings",
	};
	if (item === "Submit Feedback" || item === "Report a Problem") {
		window.location.href = "/help#contact-support";
	} else if (navigateMap[item]) {
		window.location.href = navigateMap[item];
	}
};

const themeOptions = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System Default" },
];
const notificationOptions = [
	{ value: "all", label: "All Notifications" },
	{ value: "important", label: "Only Important" },
	{ value: "none", label: "None" },
];

const AccountSettings = () => {
	const [activeSection, setActiveSection] = React.useState(sections[0].title);
	const [theme, setTheme] = React.useState("system");
	const [notification, setNotification] = React.useState("all");
	return (
        <div className="max-w-10xl mx-auto px-0 sm:px-4 py-16 sm:py-20 text-gray-800 w-full flex flex-col gap-8">
            <h1 className="w-full text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Account Settings</h1>
            <div className="flex flex-col md:flex-row gap-8">
			{/* Sidebar */}
			<aside className="w-full md:w-1/4 md:max-w-xs py-6 md:py-0 mb-8 md:mb-0 md:mr-0 md:pl-0 md:rounded-none md:shadow-none md:border-none md:bg-transparent">
				<nav className="bg-white rounded-none md:rounded-none shadow border border-blue-100 md:border-r md:border-t-0 md:border-b-0 md:border-l-0 p-0 md:p-0 flex md:flex-col gap-2 md:gap-0 overflow-x-auto md:overflow-y-auto hide-scrollbar md:h-[calc(100vh-5rem)] md:sticky md:top-20 md:left-0 md:w-full md:min-h-0">
					<div className="flex md:flex-col w-full">
						{sections.map((section) => (
							<button
								key={section.title}
								onClick={() => setActiveSection(section.title)}
								className={`text-left px-3 py-2 rounded-none font-medium transition-all text-sm md:text-base whitespace-nowrap w-full border-b border-blue-100 last:border-b-0 ${activeSection === section.title ? 'bg-blue-100 text-blue-900 shadow font-semibold' : 'text-blue-800 hover:bg-blue-50'}`}
							>
								{section.title}
							</button>
						))}
					</div>
				</nav>
			</aside>
			{/* Main Content */}
			<main className="flex-1 md:ml-1/4">
				<div className="grid grid-cols-1 gap-4 sm:gap-6">
					{sections.filter(s => s.title === activeSection).map((section) => (
						<div
							key={section.title}
							className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col gap-2 sm:gap-3 border border-blue-100 min-w-0"
						>
							<h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{section.title}</h2>
							<div className="flex flex-col gap-1 sm:gap-2">
								{section.items.map((item) => {
									if (section.title === "🧭 Platform Preferences" && item === "Theme Mode (Light/Dark)") {
										return (
											<div key={item} className="flex items-center gap-3">
												<label className="font-medium text-blue-900 text-xs sm:text-sm min-w-[120px]">Theme Mode:</label>
												<select
													value={theme}
													onChange={e => setTheme(e.target.value)}
													className="border border-blue-200 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
												>
													{themeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
												</select>
											</div>
										);
									}
									if (section.title === "🧭 Platform Preferences" && item === "Notification Settings") {
										return (
											<div key={item} className="flex items-center gap-3">
												<label className="font-medium text-blue-900 text-xs sm:text-sm min-w-[120px]">Notifications:</label>
												<select
													value={notification}
													onChange={e => setNotification(e.target.value)}
													className="border border-blue-200 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
												>
													{notificationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
												</select>
											</div>
										);
									}
									return (
										<button
											key={item}
											className="w-full text-left px-3 sm:px-4 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium border border-blue-100 transition text-xs sm:text-sm truncate"
											onClick={() => handleAction(section.title, item)}
										>
											{item}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</main>
			</div>
		</div>
	);
};

export default AccountSettings;
