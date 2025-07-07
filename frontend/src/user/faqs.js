// FAQ data for Help & Support Page
const faqs = [
	{
		question: "How do I reset my password?",
		answer: "Go to your profile Account Settings > Security > Reset Password. Follow the email instructions.",
	},
	{
		question: "How do I delete my account?",
		answer: "Contact support via the form below and request account deletion. It takes 24-48 hours.",
	},
	{
		question: "Why can't I log in?",
		answer: "Double-check your credentials. If the issue persists, try resetting your password or contact support.",
	},
	{
		question: "What are Skill Coins?",
		answer: "Skill Coins are the platform's currency. There are two types: Golden Skill Coins (₹2 each) and Silver Skill Coins (₹0.25 each).",
	},
	{
		question: "How do I buy Skill Coin packages?",
		answer: "You can soon purchase Silver, Golden, or Combo Skill Coin packages from the Pro Features section. Package sizes and offers will be announced soon!",
	},
	{
		question: "What can I use Silver Skill Coins for?",
		answer: "Silver Skill Coins are used to book live 1-on-1 sessions. Each minute costs 1 Silver Skill Coin, deducted from the learner and credited to the tutor at session end.",
	},
	{
		question: "What can I use Golden Skill Coins for?",
		answer: "Golden Skill Coins are used to unlock premium content, such as full live sessions or recorded sessions (2 coins per unlock).",
	},
	{
		question: "What are Combo Packages?",
		answer: "Combo Packages offer a mix of Golden and Silver Skill Coins at a special price. Details coming soon!",
	},
	{
		question: "How do I join a Group Discussion (GD)?",
		answer: "Search for your job in the GD section and book a seat. Each GD costs ₹1500 per head.",
	},
	{
		question: "How do I book an Interview session?",
		answer: "Search for your job and book an interview session with an expert. Each interview costs ₹500 per head.",
	},
	{
		question: "How do I go live or upload a recorded session?",
		answer: "You can go live to teach or upload a recorded session. Unlocking either costs 2 Golden Skill Coins for viewers.",
	},
	{
		question: "How do I earn Skill Coins?",
		answer: "Earn Skill Coins by teaching, hosting sessions, or referring friends. Referral rewards are given for each successful signup!",
	},
	{
		question: "How do I edit my profile information?",
		answer: "Go to your Profile page and click 'Edit Profile'. Update your details and save changes.",
	},
	{
		question: "How do I view my session history?",
		answer: "Go to the History page from the menu to see all your past sessions. You can filter by date, tutor, subject, or topic.",
	},
	{
		question: "How do I change my email address?",
		answer: "Currently, you need to contact support to change your registered email address.",
	},
	{
		question: "What are badges and how do I earn them?",
		answer: "Badges are awarded for milestones like teaching, learning, or helping others. Stay active to earn more!",
	},
	{
		question: "How do I increase my rank?",
		answer: "Your rank increases as you earn more credits and badges through active participation.",
	},
	{
		question: "How do I report inappropriate behavior?",
		answer: "Use the contact form below to report any issues. Our team will review and take action as needed.",
	},
	{
		question: "Is my data secure?",
		answer: "Yes, we use industry-standard security practices to protect your data.",
	},
	{
		question: "Can I use SkillSwapHub for free?",
		answer: "SkillSwapHub provides free silver coins to every new user upon sign-up. You can spend them to learn, earn more by teaching, or purchase Pro packages if you run out of coins.",
	},
	{
		question: "How do I contact support?",
		answer: "Fill out the contact form below or email us at support@yourdomain.com.",
	},
	{
		question: "How do I log out?",
		answer: "Click the 'Logout' button on your profile to securely end your session.",
	},
	{
		question: "What should I do if I find a bug?",
		answer: "Please report bugs using the contact form below. Include as much detail as possible.",
	},
	{
		question: "I forgot my email/username — what should I do?",
		answer: "If you forgot your email or username, contact support using the form below. Provide any details you remember (such as your name or phone number) to help us verify your account.",
	},
	{
		question: "How can I change my email address or contact number?",
		answer: "To change your email address or contact number, please contact support. For security reasons, these changes require manual verification.",
	},
	{
		question: "What payment methods are supported?",
		answer: "We support major credit/debit cards, UPI, and net banking. More payment options will be added soon!",
	},
	{
		question: "How do I update my billing information?",
		answer: "Go to your account settings and select 'Billing'. Update your payment method and billing address as needed.",
	},
	{
		question: "Where can I find my payment history or invoices?",
		answer: "You can view your payment history and download invoices from the 'Billing' or 'Payment History' section in your account dashboard.",
	},
	{
		question: "Why was my payment declined?",
		answer: "Payments may be declined due to insufficient funds, incorrect details, or bank restrictions. Please check your payment method or contact your bank for more information.",
	},
	{
		question: "The website/app is not loading — what can I do?",
		answer: "Try refreshing the page, clearing your browser cache, or checking your internet connection. If the issue persists, contact support.",
	},
	{
		question: "Why am I not receiving emails or notifications?",
		answer: "Check your spam or junk folder. Make sure your email address is correct in your profile. If you still don't receive emails, contact support.",
	},
	{
		question: "The page says “Error 404” — what does that mean?",
		answer: "A 404 error means the page you are looking for does not exist or has been moved. Double-check the URL or use the site navigation to find what you need.",
	},
	{
		question: "How do I clear cach ?",
		answer: "To clear cache, go to your browser settings and clear browsing data for this site.",
	},
	{
		question: "How do I get started as a new user?",
		answer: "Sign up with your email, set up your profile, and explore available sessions or content. Check the Help section for a step-by-step guide!",
	},
	{
		question: "How do I update my profile or preferences?",
		answer: "Go to your Profile page and click 'Edit Profile' to update your information, skills, and preferences. Save changes to apply them.",
	},
	{
		question: "How do I book/schedule/submit (task specific to your website)?",
		answer: "Navigate to the relevant section (e.g., Book a Session, Join a Discussion), select your options, and follow the prompts to complete your booking or submission.",
	},
	{
		question: "Can I edit or cancel a submission/booking once it’s made?",
		answer: "You can edit or cancel most bookings from your History or Bookings page, subject to our cancellation policy. Contact support if you need help.",
	},
	{
		question: "How is my personal data protected?",
		answer: "We use industry-standard security measures to protect your data. Your information is encrypted and stored securely.",
	},
	{
		question: "Do you share my data with third parties?",
		answer: "We do not sell or share your personal data with third parties except as required by law or to provide essential services (see our Privacy Policy).",
	},
	{
		question: "How can I control my privacy settings?",
		answer: "Go to your Profile or Account Settings and look for the Privacy section. Here you can adjust who can see your information and manage notification preferences.",
	},
	{
		question: "How do I report a suspicious or fake profile?",
		answer: "Use the report option on the user's profile or contact support with the details. Our team will investigate and take appropriate action.",
	},
	{
		question: "What should I do if I think my account was hacked?",
		answer: "Immediately reset your password and contact support. We recommend enabling two-factor authentication if available.",
	},
	{
		question: "Is your platform available on mobile devices?",
		answer: "Yes, you can access SkillSwapHub via your mobile browser. A dedicated mobile app is coming soon!",
	},
	{
		question: "Why is the mobile view different from desktop?",
		answer: "The mobile view is optimized for smaller screens and may have a different layout for better usability. All core features remain accessible.",
	},
	{
		question: "Can I use the same account on multiple devices?",
		answer: "Yes, you can log in to your SkillSwapHub account on multiple devices. Your data will sync automatically.",
	},
	{
		question: "How can I send feedback or suggestions?",
		answer: "Use the contact form on the Help & Support page or email us at support@yourdomain.com. We value your feedback!",
	},
	{
		question: "How do I contact support directly?",
		answer: "You can contact support by filling out the form on this page or emailing support@yourdomain.com.",
	},
	{
		question: "What are your customer support hours?",
		answer: "Our support team is available Monday to Friday, 9:00 AM to 6:00 PM IST. We aim to respond to all queries within 24 hours.",
	},
	{
		question: "How long does it take to get a response?",
		answer: "We aim to respond to all support requests within 24 hours during business days. Response times may be longer on weekends or holidays.",
	},
	{
		question: "Where can I check the status of my support ticket?",
		answer: "After submitting a support request, you will receive updates via email. For ongoing tickets, you can reply to the email thread or contact support for an update.",
	},
];

export default faqs;
