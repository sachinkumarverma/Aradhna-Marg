import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Shield,
  BookOpen,
  Video,
  FileCheck2,
  Mail,
  ArrowRight,
  Sparkles,
  Info,
  Scale
} from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

export const DisclaimerPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const pageTitle = isHi ? 'अस्वीकरण (Disclaimer)' : 'Disclaimer';
  const pageDesc = isHi
    ? 'आराधना मार्ग पर प्रकाशित धार्मिक सामग्री, भजन एवं शास्त्रों से संबंधित कानूनी व धार्मिक अस्वीकरण।'
    : 'Legal and religious disclaimer regarding devotional content and scriptures on Aradhna Marg.';

  const breadcrumbItems = [{ label: isHi ? 'अस्वीकरण' : 'Disclaimer' }];
  const breadcrumbs = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: isHi ? 'अस्वीकरण' : 'Disclaimer', item: '/disclaimer' }
  ]);

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24 selection:bg-saffron/20 selection:text-saffron ${isHi ? 'font-hindi-body' : 'font-legal'}`}
    >
      <SEOHead title={pageTitle} description={pageDesc} canonicalPath="/disclaimer" schema={breadcrumbs} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#24130a] via-[#351c10] to-[#140a05] text-white p-8 sm:p-12 md:p-16 mb-10 shadow-xl border border-amber-900/30 text-center">
          {/* Ambient Glows */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-saffron/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
              {isHi ? 'अस्वीकरण' : 'Disclaimer'}
              <span className="block text-xl sm:text-2xl md:text-3xl text-amber-300/95 font-semibold mt-3">
                {isHi ? '(Disclaimer - आराधना मार्ग)' : '(Legal & Devotional Disclaimer)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              {isHi
                ? 'आराधना मार्ग पर प्रस्तुत भजनों, पुराणों, आरतियों, भावार्थ एवं वीडियो सामग्री की प्रकृति, कॉपीराइट एवं उपयोग से संबंधित महत्वपूर्ण सूचना।'
                : 'Read the Disclaimer for Aradhna Marg, including information about devotional content, copyright, user submissions, embedded media, external links, and website accuracy.'}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm sm:text-base font-semibold text-amber-200">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="leading-none">{isHi ? 'अंतिम अद्यतन: अक्टूबर 2026' : 'Last Updated: October 2026'}</span>
            </div>
          </div>
        </div>

        {/* Introduction Banner Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm mb-8">
          <p
            className={`text-xl sm:text-2xl md:text-[23px] text-gray-800 leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi ? (
              <>
                <strong className="text-darkBrown font-bold">आराधना मार्ग (aradhnamarg.com)</strong> पर आपका स्वागत है।
                यह अस्वीकरण (Disclaimer) यह स्पष्ट करता है कि हमारी वेबसाइट पर उपलब्ध धार्मिक सामग्री, भजनों के बोल,
                भावार्थ, महापुराणों के प्रसंग, एम्बेडेड वीडियो एवं बाहरी कड़ियों का उद्देश्य केवल आध्यात्मिक ज्ञान,
                भक्ति एवं सांस्कृतिक संवर्धन है।
              </>
            ) : (
              <>
                Welcome to <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong>. This
                Disclaimer explains the nature of the information and devotional content provided on the website,
                including devotional lyrics, meanings, editorial material, user submissions, embedded media, external
                links, and other website features. By using this website, you acknowledge and understand the information
                described below.
              </>
            )}
          </p>
        </div>

        {/* Disclaimer Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '1. हमारा उद्देश्य एवं संपादकीय दृष्टिकोण (Our Purpose & Editorial Approach)'
                : '1. Our Purpose & Editorial Approach'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग एक डिजिटल मंच है जिसे सनातन संस्कृति व धार्मिक साहित्य को पढ़ने, समझने और अनुसंधान के लिए सरल बनाने हेतु बनाया गया है। यहाँ भजन, आरती, स्तोत्र, चालीसा, महापुराण तथा आध्यात्मिक लेख संकलित हैं।'
                  : 'Aradhna Marg is a digital platform created to make devotional and cultural content easier to read, understand, and explore. The website features Bhajans, Aartis, Stotrams, Chalisas, 18 Mahapuranas, word meanings, Bhavarth, and contextual notes.'}
              </p>
              <p>
                {isHi
                  ? 'हमारा संपादकीय कार्य पाठों का स्वरूप संवारना, शब्दार्थ, भावार्थ और संदर्भ प्रदान करना है। यह संपादकीय योगदान इस बात का दावा नहीं करता कि आराधना मार्ग मूल रचना का स्वामी है।'
                  : 'Our editorial work may include formatting, language corrections, word explanations, translations, Bhavarth, contextual information, and categorisation. These editorial contributions should not be understood as a claim that Aradhna Marg owns the underlying devotional composition.'}
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '2. कॉपीराइट एवं स्वामित्वाधिकार (Copyright, Ownership & Content Rights)'
                : '2. Copyright, Ownership & Content Rights'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'प्रत्येक व्यक्तिगत भक्ति रचना में कॉपीराइट उसके रचयिता, कवि, संगीतकार, प्रकाशक, रिकॉर्ड लेबल अथवा गायक के पास रहता है। आराधना मार्ग किसी भी तृतीय-पक्ष सामग्री के स्वामित्व का दावा नहीं करता।'
                  : 'Copyright and other rights in an individual devotional work belong to its author, composer, publisher, label, performer, or applicable rights holder. Aradhna Marg does not claim ownership of third-party works merely because they are formatted, displayed, or explained on this website.'}
              </p>
              <p>
                {isHi
                  ? 'सनातन परंपरा की प्राचीन रचनाएँ सार्वजनिक डोमेन में हो सकती हैं। आराधना मार्ग द्वारा स्वतंत्र रूप से तैयार मूल भावार्थ, लेख, टिप्पणियां तथा प्रस्तुति पर आराधना मार्ग का अधिकार सुरक्षित है।'
                  : 'Some traditional devotional works may be in the public domain under applicable law. Original editorial material created by Aradhna Marg, including original explanations, Bhavarth, word meanings, translations, and curated presentation, is protected by applicable intellectual property laws.'}
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '3. एम्बेडेड वीडियो एवं मीडिया (Embedded Media & Third-Party Content)'
                : '3. Embedded Media & Third-Party Content'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग पर उपलब्ध YouTube वीडियो प्लेयर आधिकारिक एम्बेडिंग प्रणाली के अंतर्गत संचालित हैं।'
                  : 'Some pages on Aradhna Marg may include embedded videos or media hosted by third-party platforms such as YouTube. Embedded content is provided through the relevant platform’s standard embedding functionality.'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-red-500 text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  {isHi
                    ? 'सभी वीडियो व्यूज एवं दर्शक जुड़ाव सीधे मूल YouTube चैनल / अपलोडर को प्राप्त होते हैं।'
                    : 'Third-party media remains subject to the rights and policies applicable to its respective owner or platform.'}
                </li>
                <li>
                  {isHi
                    ? 'आराधना मार्ग किसी भी वीडियो फाइल को अपने निजी सर्वर पर होस्ट या री-अपलोड नहीं करता है।'
                    : 'Aradhna Marg does not represent that it owns the copyright in third-party recordings, videos, or thumbnails.'}
                </li>
                <li>
                  {isHi
                    ? 'यदि मूल अपलोडर वीडियो को YouTube से हटाता है, तो वह यहाँ भी स्वतः अनुपलब्ध हो जाएगा।'
                    : 'Availability of an embedded video may change if the original uploader removes, restricts, or modifies it.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '4. उचित उपयोग एवं सद्भावना (Copyright Exceptions & Fair Use)'
                : '4. Copyright Exceptions & Fair Use'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग पर सामग्री भारतीय कॉपीराइट कानून व अंतरराष्ट्रीय फेयर यूज़ प्रावधानों के अंतर्गत धार्मिक अध्ययन, स्वाध्याय व गैर-व्यावसायिक धर्म-प्रचार हेतु संकलित है।'
                  : 'References to fair use, fair dealing, or public-domain material are provided for general informational purposes. Where applicable, Aradhna Marg seeks to respect the rights of authors, composers, publishers, artists, and rights holders.'}
              </p>
            </div>
          </div>

          {/* Section 5 & 6 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-extrabold text-darkBrown mb-3.5 tracking-tight flex items-start gap-2.5 leading-snug`}
              >
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <span>{isHi ? '5. जानकारी की सटीकता (Accuracy)' : '5. Accuracy of Information'}</span>
              </h2>
              <p
                className={`text-gray-700 text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
              >
                {isHi
                  ? 'भक्ति साहित्य में क्षेत्रीय व पारंपरिक कारणों से बोल में पाठ-भेद पाया जाता है। हम भरसक शुद्धता का प्रयास करते हैं, किंतु किसी भी त्रुटि की सूचना मिलने पर हम उसे सहर्ष सुधारते हैं।'
                  : 'We make reasonable efforts to review and present devotional content clearly. However, different traditions and publications may contain variations in lyrics, spellings, or interpretations.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-extrabold text-darkBrown mb-3.5 tracking-tight flex items-start gap-2.5 leading-snug`}
              >
                <AlertOctagon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <span>{isHi ? '6. कोई परामर्श नहीं' : '6. No Professional Advice'}</span>
              </h2>
              <p
                className={`text-gray-700 text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
              >
                {isHi
                  ? 'वेबसाइट पर उपलब्ध सभी लेख और कथाएं केवल धार्मिक व सांस्कृतिक ज्ञान हेतु हैं। इसे कानूनी अथवा चिकित्सकीय परामर्श न समझें।'
                  : 'Content on this website is provided for general devotional, educational, cultural, and informational purposes and should not be treated as specialized advice.'}
              </p>
            </div>
          </div>

          {/* Section 7 - DMCA / Copyright Grievance */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl p-6 sm:p-10 border border-orange-200/80 shadow-sm">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight flex items-start gap-3 leading-snug`}
            >
              <FileCheck2 className="w-7 h-7 sm:w-8 sm:h-8 text-saffron shrink-0 mt-0.5" />
              <span>
                {isHi ? '7. कॉपीराइट आपत्ति एवं निवारण (Copyright Concerns)' : '7. Copyright Concerns & Grievance'}
              </span>
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'यदि आप किसी सामग्री के वैध कॉपीराइट धारक हैं और आपको लगता है कि आपकी सामग्री का उपयोग बिना अनुमति हुआ है, तो कृपया हमें तुरंत सूचित करें। हम 24-48 घंटों के भीतर उचित श्रेय जोड़ने अथवा सामग्री को हटाने का कदम उठाएंगे।'
                  : 'For copyright concerns, content corrections, questions about this Disclaimer, or other website-related enquiries, please contact us directly. For copyright-related requests, please provide enough information for us to identify and review the relevant material.'}
              </p>
              <div className="pt-3 flex items-center gap-3 text-saffron font-bold text-lg sm:text-xl">
                <Mail className="w-5 h-5 shrink-0" />
                <span>Email: support@aradhnamarg.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight`}>
            {isHi ? 'संपर्क एवं सहायता' : 'Get in Touch with Our Team'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi
              ? 'अस्वीकरण या किसी भजन से संबंधित सुझाव देने के लिए हमारे संपर्क पृष्ठ का उपयोग करें।'
              : 'For inquiries regarding this Disclaimer or to submit suggestions, please connect with our seva team.'}
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
              to="/privacy"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white border border-orange-200 text-gray-800 rounded-full font-bold text-base sm:text-lg hover:bg-orange-50/50 transition-all shadow-xs"
            >
              <span className="inline-flex items-center">{isHi ? 'गोपनीयता नीति (Privacy)' : 'Privacy Policy'}</span>
              <ArrowRight className="w-5 h-5 text-saffron shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
