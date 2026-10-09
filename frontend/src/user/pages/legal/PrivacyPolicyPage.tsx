import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  Cookie,
  Database,
  Mail,
  ArrowRight,
  Sparkles,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const pageTitle = isHi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy';
  const pageDesc = isHi
    ? 'आराधना मार्ग पर उपयोगकर्ताओं की निजता, डेटा सुरक्षा एवं गोपनीयता नीति का विवरण।'
    : 'Privacy policy and user data protection details for Aradhna Marg.';

  const breadcrumbItems = [{ label: isHi ? 'गोपनीयता नीति' : 'Privacy Policy' }];
  const breadcrumbs = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: isHi ? 'गोपनीयता नीति' : 'Privacy Policy', item: '/privacy' }
  ]);

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-3 sm:pt-4 pb-24 selection:bg-saffron/20 selection:text-saffron ${isHi ? 'font-hindi-body' : 'font-legal'}`}
    >
      <SEOHead title={pageTitle} description={pageDesc} canonicalPath="/privacy" schema={breadcrumbs} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#162016] via-[#243024] to-[#0e170e] text-white p-8 sm:p-12 md:p-16 mb-10 shadow-xl border border-emerald-900/30 text-center">
          {/* Ambient Glows */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
              {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
              <span className="block text-xl sm:text-2xl md:text-3xl text-emerald-300/95 font-semibold mt-3">
                {isHi ? '(Privacy & Data Protection - आराधना मार्ग)' : '(User Data & Privacy Protection)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              {isHi
                ? 'आराधना मार्ग (Aradhna Marg) आपकी व्यक्तिगत गोपनीयता और डेटा सुरक्षा की पूर्ण रक्षा के लिए प्रतिबद्ध है।'
                : 'Learn how Aradhna Marg collects, uses, protects, and handles information, including cookies, submissions, contact information, advertising, and third-party services.'}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm sm:text-base font-semibold text-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
              <span className="leading-none">{isHi ? 'अंतिम अद्यतन: अक्टूबर 2026' : 'Last Updated: October 2026'}</span>
            </div>
          </div>
        </div>

        {/* Introduction Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-emerald-100/80 shadow-sm mb-8">
          <p
            className={`text-xl sm:text-2xl md:text-[23px] text-gray-800 leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi ? (
              <>
                <strong className="text-darkBrown font-bold">आराधना मार्ग (aradhnamarg.com)</strong> आपकी गोपनीयता का
                पूर्ण सम्मान करता है। यह गोपनीयता नीति यह स्पष्ट करती है कि जब आप हमारी वेबसाइट का उपयोग करते हैं, तो
                किस प्रकार की जानकारी एकत्रित की जाती है, उसका क्या उपयोग होता है और आपके डेटा की सुरक्षा कैसे की जाती
                है।
              </>
            ) : (
              <>
                <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong> is committed to
                respecting the privacy of visitors, contributors, and other users of the website. This Privacy Policy
                explains what information may be collected, why it may be collected, how it may be used, and the choices
                available to you.
              </>
            )}
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '1. एकत्रित की जाने वाली जानकारी (Information We May Collect)' : '1. Information We May Collect'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'हम केवल वही जानकारी एकत्र करते हैं जो वेबसाइट के सुचारू संचालन, उपयोगकर्ता अनुभव को बेहतर बनाने तथा आपके प्रश्नों के उत्तर देने के लिए आवश्यक है:'
                  : 'The information we collect depends on how you interact with Aradhna Marg. We try to collect only information that is relevant to providing, maintaining, improving, or securing the website and its features.'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-emerald-500 text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'संपर्क जानकारी:' : 'Contact information:'}
                  </strong>{' '}
                  {isHi
                    ? 'यदि आप हमसे संपर्क करते हैं, तो हम आपका नाम, ईमेल पता तथा संदेश प्राप्त कर सकते हैं।'
                    : 'If you contact us, we may receive your name, email address, message, attachments, or other information that you voluntarily provide.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'भजन व सुझाव प्रेषण:' : 'Bhajan submissions:'}
                  </strong>{' '}
                  {isHi
                    ? 'यदि आप भजन प्रेषण प्रपत्र भरते हैं, तो बोल, शीर्षक, योगदानकर्ता का नाम व संपर्क जानकारी।'
                    : 'If you submit a Bhajan, Aarti, Chalisa, Stotram, or other devotional material, we may collect the title, lyrics or text, contributor name, and optional contact information.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'स्थानीय प्राथमिकताएं (Local Storage):' : 'Local preferences & Sangrah:'}
                  </strong>{' '}
                  {isHi
                    ? 'आपकी चुनी हुई भाषा (हिंदी/अंग्रेजी) तथा सहेजे गए भजन आपके ब्राउज़र के लोकल स्टोरेज में सुरक्षित रहते हैं।'
                    : 'Your language choice and bookmarked bhajans (My Sangrah) are stored securely in your browser’s local storage.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'तकनीकी व उपयोग जानकारी:' : 'Technical and usage information:'}
                  </strong>{' '}
                  {isHi
                    ? 'ब्राउज़र का प्रकार, ऑपरेटिंग सिस्टम, पृष्ठ दृश्य तथा सर्वर लॉग्स जो गति सुधारने में सहायक होते हैं।'
                    : 'Depending on the services active on the website, we or our service providers may receive information such as IP address, browser type, device information, referring pages, and approximate usage data.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '2. जानकारी का उपयोग (How We Use Information)' : '2. How We Use Information'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'एकत्रित की गई जानकारी का उपयोग निम्नलिखित कार्यों के लिए किया जाता है:'
                  : 'We may use the information we collect for purposes such as:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                  <span
                    className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                  >
                    {isHi
                      ? 'भजन व पुराणों की पाठन सुविधा प्रदान करना'
                      : 'Operating, maintaining, and improving the website'}
                  </span>
                </div>
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                  <span
                    className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                  >
                    {isHi
                      ? 'आपके द्वारा भेजे गए प्रश्नों व सुझावों का उत्तर देना'
                      : 'Responding to comments, corrections, and questions'}
                  </span>
                </div>
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                  <span
                    className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                  >
                    {isHi
                      ? 'वेबसाइट की गति एवं सुरक्षा में निरंतर सुधार'
                      : 'Protecting website security and preventing abuse'}
                  </span>
                </div>
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                  <span
                    className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                  >
                    {isHi
                      ? 'उपयोगकर्ता अनुभव को सरल और पावन बनाना'
                      : 'Reviewing and publishing devotional contributions'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '3. कुकीज़ एवं लोकल स्टोरेज (Cookies & Local Storage)' : '3. Cookies and Similar Technologies'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग आवश्यक कार्यप्रणाली हेतु कुकीज़ तथा ब्राउज़र लोकल स्टोरेज का उपयोग करता है ताकि आपकी भाषा व संग्रह की प्राथमिकताएं बनी रहें।'
                  : 'Cookies and similar technologies may be used for website functionality, preferences, security, analytics, and advertising. Most browsers allow you to manage or delete cookies through browser settings.'}
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '4. डेटा सुरक्षा (Data Protection & Security)' : '4. Data Protection & Security'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'हम आपकी किसी भी व्यक्तिगत जानकारी को किसी तीसरे पक्ष को बेचते अथवा व्यापारिक स्वार्थ हेतु साझा नहीं करते हैं। हमारी पूरी वेबसाइट आधुनिक SSL/HTTPS एन्क्रिप्शन द्वारा सुरक्षित है।'
                  : 'We maintain reasonable administrative, technical, and physical safeguards designed to protect information from unauthorized access, loss, misuse, or alteration. All communication is encrypted over SSL/HTTPS.'}
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '5. तृतीय-पक्ष सेवाएँ (Third-Party Services)' : '5. Third-Party Services & Links'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'वेबसाइट पर उपलब्ध YouTube वीडियो प्लेयर अथवा एनालिटिक्स टूल्स तृतीय-पक्ष प्रदाताओं द्वारा संचालित हैं। जब आप कोई वीडियो देखते हैं, तो संबंधित प्रदाता की गोपनीयता नीति लागू होती है।'
                  : 'Our website may contain links or embedded media hosted by third parties, such as YouTube. When you interact with third-party features, those services operate under their own terms and privacy policies.'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight`}>
            {isHi ? 'गोपनीयता से संबंधित कोई प्रश्न?' : 'Have Questions Regarding Your Privacy?'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi
              ? 'यदि आपके पास हमारी गोपनीयता नीति अथवा डेटा सुरक्षा के संबंध में कोई प्रश्न या चिंता है, तो हमसे संपर्क करें।'
              : 'If you have questions, comments, or requests regarding this Privacy Policy or your personal information, please contact us.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-legal">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-saffron text-white rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all shadow-sm active:scale-95"
            >
              <Mail className="w-5 h-5 shrink-0" />
              <span className="inline-flex items-center">{isHi ? 'संपर्क करें (Contact Us)' : 'Contact Us'}</span>
            </Link>

            <Link
              to="/terms"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white border border-orange-200 text-gray-800 rounded-full font-bold text-base sm:text-lg hover:bg-orange-50/50 transition-all shadow-xs"
            >
              <span className="inline-flex items-center">{isHi ? 'नियम व शर्तें (Terms)' : 'Terms of Service'}</span>
              <ArrowRight className="w-5 h-5 text-saffron shrink-0" />
            </Link>

            <Link
              to="/disclaimer"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white border border-orange-200 text-gray-800 rounded-full font-bold text-base sm:text-lg hover:bg-orange-50/50 transition-all shadow-xs"
            >
              <span className="inline-flex items-center">{isHi ? 'अस्वीकरण (Disclaimer)' : 'Disclaimer'}</span>
              <ArrowRight className="w-5 h-5 text-saffron shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
