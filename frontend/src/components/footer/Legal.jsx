import React from "react";

const Legal = () => (
  <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-[72px] xl:pt-20 pb-10 text-gray-800">
    <h1 className="text-3xl font-bold mb-4">Legal Information</h1>
    <p className="text-sm text-gray-500 mb-6">Last Updated: January 2026</p>

    {/* Company Information */}
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-blue-900">Company Information</h2>
      <div className="space-y-3 text-sm">
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="font-semibold text-gray-700 min-w-[180px]">Legal Entity Name:</span>
          <span className="text-gray-900">SkillSwap Hub Private Limited</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="font-semibold text-gray-700 min-w-[180px]">Corporate Identity Number (CIN):</span>
          <span className="text-gray-900 font-mono">U85499UT2026PTC020654</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="font-semibold text-gray-700 min-w-[180px]">Registration Date:</span>
          <span className="text-gray-900">2026</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="font-semibold text-gray-700 min-w-[180px]">Registered Office:</span>
          <span className="text-gray-900">Uttarakhand, India</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="font-semibold text-gray-700 min-w-[180px]">Official Website:</span>
          <a href="https://skillswaphub.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            www.skillswaphub.in
          </a>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="font-semibold text-gray-700 min-w-[180px]">Contact Email:</span>
          <a href="mailto:info@skillswaphub.in" className="text-blue-600 hover:underline">
            info@skillswaphub.in
          </a>
        </div>
      </div>
    </div>

    {/* Regulatory Compliance */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Regulatory Compliance</h2>
    <p className="mb-4 text-sm leading-relaxed">
      SkillSwap Hub Private Limited is a duly registered company under the Companies Act, 2013, and operates in full compliance 
      with applicable Indian laws and regulations. The company is registered with the Ministry of Corporate Affairs (MCA) and 
      follows all statutory requirements including annual filings, financial disclosures, and corporate governance norms.
    </p>

    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Key Regulatory Frameworks</h3>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-1">•</span>
          <span><strong>Companies Act, 2013:</strong> Governs corporate structure, operations, and compliance</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-1">•</span>
          <span><strong>Information Technology Act, 2000:</strong> Regulates electronic commerce and digital services</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-1">•</span>
          <span><strong>Digital Personal Data Protection Act, 2023:</strong> Protects user privacy and data security</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-1">•</span>
          <span><strong>Consumer Protection Act, 2019:</strong> Ensures consumer rights and fair practices</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-1">•</span>
          <span><strong>Copyright Act, 1957:</strong> Protects intellectual property rights</span>
        </li>
      </ul>
    </div>

    {/* Business Nature */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Nature of Business</h2>
    <p className="mb-4 text-sm leading-relaxed">
      SkillSwap Hub is India's first peer-to-peer learning and micro-tutoring platform that enables users to teach, learn, 
      and grow simultaneously. The platform facilitates:
    </p>
    <ul className="list-disc list-inside space-y-2 mb-6 text-sm ml-4">
      <li>One-on-one learning sessions between peers</li>
      <li>Group discussions and collaborative learning</li>
      <li>Real interview practice and career guidance</li>
      <li>Skill development through micro-tutoring</li>
      <li>Gamified learning experiences with rewards</li>
      <li>AI-powered matchmaking between learners and tutors</li>
      <li>Assessment and certification services</li>
    </ul>

    {/* Intellectual Property */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Intellectual Property Rights</h2>
    <p className="mb-4 text-sm leading-relaxed">
      All intellectual property rights in SkillSwap Hub, including but not limited to trademarks, service marks, logos, 
      brand names, domain names, website design, software code, platform architecture, databases, and proprietary algorithms, 
      are owned exclusively by SkillSwap Hub Private Limited or its licensors.
    </p>
    
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-amber-900">Protected Assets</h3>
      <ul className="space-y-2 text-sm text-gray-800">
        <li className="flex items-start gap-2">
          <span className="text-amber-600 mt-1">•</span>
          <span><strong>Brand Identity:</strong> SkillSwap Hub name, logo, and visual design elements</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-600 mt-1">•</span>
          <span><strong>Technology:</strong> Platform source code, algorithms, and technical infrastructure</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-600 mt-1">•</span>
          <span><strong>Content:</strong> Educational materials, documentation, and marketing content</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-600 mt-1">•</span>
          <span><strong>Data:</strong> User-generated content and platform analytics</span>
        </li>
      </ul>
      <p className="mt-4 text-xs text-amber-800">
        Unauthorized use, reproduction, or distribution of any intellectual property is strictly prohibited and may result 
        in legal action under the Copyright Act, 1957, and Trademarks Act, 1999.
      </p>
    </div>

    {/* Legal Disclaimers */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Legal Disclaimers</h2>
    
    <div className="space-y-4 mb-6">
      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-semibold text-base mb-2">Educational Purpose</h3>
        <p className="text-sm text-gray-700">
          SkillSwap Hub is an educational platform that facilitates peer-to-peer learning. The platform does not guarantee 
          specific learning outcomes, employment opportunities, or academic success. Users are responsible for their own 
          learning journey and career decisions.
        </p>
      </div>

      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-semibold text-base mb-2">No Professional Advice</h3>
        <p className="text-sm text-gray-700">
          Content shared on the platform does not constitute professional, legal, financial, medical, or career advice. 
          Users should consult qualified professionals for specific guidance in their respective fields.
        </p>
      </div>

      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-semibold text-base mb-2">Platform Availability</h3>
        <p className="text-sm text-gray-700">
          While we strive for uninterrupted service, SkillSwap Hub does not guarantee 24/7 availability. Technical 
          maintenance, updates, or unforeseen circumstances may cause temporary service interruptions.
        </p>
      </div>

      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-semibold text-base mb-2">Third-Party Content</h3>
        <p className="text-sm text-gray-700">
          User-generated content and third-party integrations are not endorsed by SkillSwap Hub. The platform is not 
          responsible for the accuracy, legality, or quality of such content.
        </p>
      </div>
    </div>

    {/* Liability Limitation */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Limitation of Liability</h2>
    <p className="mb-4 text-sm leading-relaxed">
      To the maximum extent permitted by Indian law, SkillSwap Hub Private Limited, its directors, officers, employees, 
      and affiliates shall not be liable for:
    </p>
    <ul className="list-disc list-inside space-y-2 mb-6 text-sm ml-4">
      <li>Any direct, indirect, incidental, or consequential damages arising from platform use</li>
      <li>Loss of data, profits, revenue, or business opportunities</li>
      <li>Errors, omissions, or inaccuracies in content or services</li>
      <li>Unauthorized access to user accounts due to user negligence</li>
      <li>Third-party actions, services, or content</li>
      <li>Force majeure events including natural disasters, pandemics, or government actions</li>
    </ul>
    <p className="text-xs text-gray-600 italic mb-6">
      Maximum liability in any case is limited to the amount paid by the user in the six months preceding the claim.
    </p>

    {/* Dispute Resolution */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Dispute Resolution</h2>
    <p className="mb-4 text-sm leading-relaxed">
      Any disputes, claims, or controversies arising from or relating to the use of SkillSwap Hub shall be resolved 
      through the following process:
    </p>
    
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-300 rounded-lg p-5 mb-6">
      <ol className="space-y-3 text-sm">
        <li className="flex gap-3">
          <span className="font-bold text-blue-600 min-w-[24px]">1.</span>
          <div>
            <strong>Informal Resolution:</strong> Users must first attempt to resolve disputes by contacting our support 
            team at info@skillswaphub.in. Most issues can be resolved through good faith communication.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-bold text-blue-600 min-w-[24px]">2.</span>
          <div>
            <strong>Mediation:</strong> If informal resolution fails, parties may agree to mediation by a neutral third 
            party to facilitate settlement.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-bold text-blue-600 min-w-[24px]">3.</span>
          <div>
            <strong>Arbitration:</strong> Unresolved disputes shall be referred to arbitration under the Arbitration and 
            Conciliation Act, 1996. Arbitration shall be conducted in Dehradun, Uttarakhand, in English language.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-bold text-blue-600 min-w-[24px]">4.</span>
          <div>
            <strong>Jurisdiction:</strong> If arbitration is not pursued, disputes shall be subject to the exclusive 
            jurisdiction of courts in Dehradun, Uttarakhand, India.
          </div>
        </li>
      </ol>
    </div>

    {/* Governing Law */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Governing Law and Jurisdiction</h2>
    <p className="mb-6 text-sm leading-relaxed">
      These terms and all related agreements shall be governed by and construed in accordance with the laws of India. 
      The courts at Dehradun, Uttarakhand shall have exclusive jurisdiction over all disputes arising from or relating 
      to the platform and its services. Users accessing the platform from outside India agree to comply with all applicable 
      local laws and accept that Indian law governs their relationship with SkillSwap Hub.
    </p>

    {/* Indemnification */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Indemnification</h2>
    <p className="mb-4 text-sm leading-relaxed">
      Users agree to indemnify, defend, and hold harmless SkillSwap Hub Private Limited and its affiliates, directors, 
      officers, employees, agents, and partners from any claims, damages, losses, liabilities, costs, or expenses (including 
      reasonable legal fees) arising from:
    </p>
    <ul className="list-disc list-inside space-y-2 mb-6 text-sm ml-4">
      <li>Violation of these Terms and Conditions or any applicable laws</li>
      <li>Infringement of intellectual property or other proprietary rights</li>
      <li>User-generated content or communications on the platform</li>
      <li>Misuse of platform services or features</li>
      <li>Fraudulent activities or unauthorized access</li>
      <li>Disputes with other users or third parties</li>
    </ul>

    {/* Data Protection and Privacy */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Data Protection and Privacy Compliance</h2>
    <p className="mb-4 text-sm leading-relaxed">
      SkillSwap Hub is committed to protecting user privacy in accordance with the Digital Personal Data Protection Act, 
      2023 and international best practices. We implement robust security measures including:
    </p>
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2 text-blue-900">Technical Safeguards</h3>
        <ul className="space-y-1 text-xs text-gray-700">
          <li>• SSL/TLS encryption for data transmission</li>
          <li>• Secure password hashing and storage</li>
          <li>• Regular security audits and updates</li>
          <li>• Firewall and intrusion detection systems</li>
        </ul>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2 text-green-900">Privacy Rights</h3>
        <ul className="space-y-1 text-xs text-gray-700">
          <li>• Right to access personal data</li>
          <li>• Right to correction and deletion</li>
          <li>• Right to data portability</li>
          <li>• Right to withdraw consent</li>
        </ul>
      </div>
    </div>
    <p className="text-sm text-gray-700 mb-6">
      For detailed information about data collection, use, and protection, please refer to our 
      <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1">Privacy Policy</a>.
    </p>

    {/* Tax and Financial Compliance */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Tax and Financial Compliance</h2>
    <p className="mb-4 text-sm leading-relaxed">
      SkillSwap Hub complies with all applicable tax laws including GST (Goods and Services Tax) where applicable. 
      Financial transactions are processed through secure, licensed payment gateways. Users earning income through the 
      platform are responsible for their own tax obligations and should consult tax professionals for guidance.
    </p>

    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 mb-6">
      <h3 className="font-semibold text-base mb-2 text-yellow-900">⚠ Important Financial Notices</h3>
      <ul className="space-y-2 text-sm text-gray-800">
        <li className="flex items-start gap-2">
          <span className="text-yellow-600 mt-1">•</span>
          <span>SkillCoins are platform-specific credits and not legal tender or cryptocurrency</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-yellow-600 mt-1">•</span>
          <span>All financial transactions are recorded and traceable for transparency</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-yellow-600 mt-1">•</span>
          <span>Users are responsible for reporting earnings as per income tax regulations</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-yellow-600 mt-1">•</span>
          <span>Platform fees and transaction charges are clearly disclosed before purchase</span>
        </li>
      </ul>
    </div>

    {/* Changes to Legal Terms */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Amendments to Legal Information</h2>
    <p className="mb-6 text-sm leading-relaxed">
      SkillSwap Hub reserves the right to update this legal information to reflect changes in business operations, 
      regulatory requirements, or corporate structure. Material changes will be communicated through email notifications 
      or prominent platform announcements. Continued use of the platform after such changes constitutes acceptance of 
      the updated terms.
    </p>

    {/* Contact Information */}
    <h2 className="text-2xl font-semibold mt-10 mb-4">Legal Contact Information</h2>
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-8">
      <p className="text-sm mb-4 text-gray-700">
        For legal inquiries, compliance questions, or to report legal concerns, please contact:
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <a href="mailto:info@skillswaphub.in" className="text-blue-600 hover:underline font-medium">
            info@skillswaphub.in
          </a>
        </div>
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
          </svg>
          <a href="https://skillswaphub.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
            www.skillswaphub.in
          </a>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-4">
        Response time for legal inquiries: 3-5 business days
      </p>
    </div>

    {/* Certification */}
    <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mt-10">
      <h3 className="text-lg font-bold mb-3 text-gray-900">Legal Certification</h3>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        This document constitutes the official legal information of SkillSwap Hub Private Limited. The information 
        provided herein is accurate and complete to the best of our knowledge as of the last updated date mentioned above.
      </p>
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
        <span>
          Verified and maintained by SkillSwap Hub Legal Department • Last reviewed: January 2026
        </span>
      </div>
    </div>

    {/* Footer Notice */}
    <div className="mt-10 pt-6 border-t border-gray-300">
      <p className="text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} SkillSwap Hub Private Limited • CIN: U85499UT2026PTC020654 • All Rights Reserved
      </p>
      <p className="text-xs text-gray-500 text-center mt-2">
        This is a legally binding document. For queries, contact <a href="mailto:info@skillswaphub.in" className="text-blue-600 hover:underline">info@skillswaphub.in</a>
      </p>
    </div>
  </div>
);

export default Legal;
