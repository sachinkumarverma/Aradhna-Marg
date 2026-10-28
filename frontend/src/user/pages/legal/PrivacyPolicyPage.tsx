import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const pageTitle = isHi
    ? 'गोपनीयता नीति (Privacy Policy) | Aradhna Marg'
    : 'Privacy Policy & Cookie Disclosures | Aradhna Marg';
  const pageDesc = isHi
    ? 'आराधना मार्ग की आधिकारिक गोपनीयता नीति। जानें कि हम आपके डेटा, कुकीज़, Google AdSense विज्ञापनों और उपयोगकर्ता अधिकारों की सुरक्षा कैसे करते हैं।'
    : 'Official Privacy Policy for Aradhna Marg. Learn how we handle personal data, cookies, Google AdSense advertising disclosures, opt-outs, and EEA consent.';

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
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
            >
              {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
              <span
                className={`block text-xl sm:text-2xl md:text-3xl text-emerald-300/95 font-medium mt-3 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
              >
                {isHi ? '(Privacy Policy & Advertising Disclosures)' : '(User Data, Cookies & Publisher Disclosures)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${isHi ? 'font-hindi-body' : 'font-sans'}`}
            >
              {isHi
                ? 'आराधना मार्ग आपकी व्यक्तिगत गोपनीयता, कुकी नियंत्रण एवं डेटा सुरक्षा की पूर्ण रक्षा के लिए वचनबद्ध है।'
                : 'Comprehensive disclosure of our data practices, cookie usage, Google AdSense advertising partners, user opt-out choices, and international privacy standards.'}
            </p>

            <div
              className={`mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm sm:text-base font-semibold text-emerald-200 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
            >
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
                <strong className="text-darkBrown font-bold">आराधना मार्ग (aradhnamarg.com)</strong> सनातन धर्म का एक
                पावन भक्ति मंच है। हम अपने सभी पाठकों और श्रद्धालुओं की निजता का पूर्ण आदर करते हैं। यह नीति पत्र यह
                स्पष्ट रूप से प्रकट करता है कि जब आप हमारी वेबसाइट पर आते हैं, तो किस प्रकार की जानकारी एकत्रित की जाती
                है, कुकीज़ और तृतीय-पक्ष विज्ञापनदाता (विशेषकर Google AdSense) उसका क्या उपयोग करते हैं, तथा आपके पास
                अपनी प्राथमिकताओं को नियंत्रित करने के क्या विकल्प उपलब्ध हैं।
              </>
            ) : (
              <>
                <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong> is committed to
                safeguarding the privacy of every visitor. This Privacy Policy discloses in full detail how information
                is collected, used, and protected, specifically including transparent disclosures regarding cookies,
                personalized advertising served via Google AdSense and third-party vendors, opt-out mechanisms, and
                regulatory compliance for users worldwide.
              </>
            )}
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi ? '1. एकत्रित की जाने वाली जानकारी (Information We Collect)' : '1. Information We Collect'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'हम अपनी वेबसाइट पर केवल आवश्यक एवं वैध उद्देश्यों के लिए ही जानकारी एकत्रित करते हैं:'
                  : 'We collect information in two primary ways: information you directly provide to us, and information automatically collected through standard web technologies:'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-emerald-500 text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'स्वैच्छिक संपर्क जानकारी:' : 'Voluntarily Provided Information:'}
                  </strong>{' '}
                  {isHi
                    ? 'जब आप संपर्क प्रपत्र (Contact Us) या प्रतिक्रिया भेजते हैं, तो आपका नाम, ईमेल पता और संदेश सुरक्षित रखा जाता है ताकि हम आपके प्रश्नों का उत्तर दे सकें।'
                    : 'When you submit inquiries, feedback, or devotional corrections through our contact form, we collect your name, email address, and message contents solely to respond to you.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'सर्वर लॉग्स एवं तकनीकी डेटा:' : 'Server Logs & Technical Data:'}
                  </strong>{' '}
                  {isHi
                    ? 'आपका आईपी पता (सख्त रूप से हैश/गुमनाम किया हुआ), ब्राउज़र का प्रकार, ऑपरेटिंग सिस्टम, पृष्ठ दृश्य (Pageviews) एवं आगमन का समय।'
                    : 'Standard server logs record your browser type, device category, referring URL, timestamp, and an anonymized/hashed IP address for system reliability and DDoS mitigation.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'स्थानीय प्राथमिकताएं (Local Storage):' : 'Local Storage Preferences:'}
                  </strong>{' '}
                  {isHi
                    ? 'आपकी चुनी हुई भाषा (हिंदी/अंग्रेजी), पसंदीदा भजन (My Favorites) और पढ़ने के फ़ॉन्ट आकार की प्राथमिकताएं आपके अपने डिवाइस पर स्थानीय रूप से सुरक्षित रहती हैं।'
                    : 'Language selection, saved bookmarks (My Sangrah), and reader font sizing are stored locally in your browser and never transmitted to external third parties.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Google AdSense & Third-Party Advertising Cookies (Crucial Google Requirement) */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 rounded-2xl p-6 sm:p-10 border-2 border-amber-200/90 shadow-md">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi
                ? '2. Google AdSense एवं तृतीय-पक्ष विज्ञापन कुकीज़ (Advertising Cookies)'
                : '2. Google AdSense & Third-Party Advertising Cookies'}
            </h2>
            <div
              className={`text-gray-800 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi ? (
                  <>
                    आराधना मार्ग अपनी निःशुल्क भक्ति सेवाओं, सर्वर संचालन एवं नए भजनों के संपादन का खर्च वहन करने के लिए
                    Google AdSense एवं अधिकृत विज्ञापन नेटवर्कों के विज्ञापनों का प्रदर्शन कर सकता है। Google की प्रकाशक
                    नीतियों के अनुसार हम निम्नलिखित तथ्यों का पूर्ण प्रकटीकरण करते हैं:
                  </>
                ) : (
                  <>
                    Aradhna Marg may display advertisements served by Google AdSense and accredited third-party
                    advertising networks to support server infrastructure and keep our devotional content freely
                    accessible. In strict accordance with Google Publisher Policies, we disclose the following:
                  </>
                )}
              </p>

              <ul className="list-disc pl-6 space-y-3.5 marker:text-amber-600 text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 leading-[1.8]">
                <li>
                  {isHi ? (
                    <>
                      <strong className="text-darkBrown font-bold">तृतीय-पक्ष विक्रेता (Third-Party Vendors):</strong>{' '}
                      Google सहित अन्य तृतीय-पक्ष विक्रेता उपयोगकर्ता द्वारा हमारी वेबसाइट अथवा इंटरनेट पर अन्य
                      वेबसाइटों पर पूर्व में किए गए दौरों के आधार पर विज्ञापन प्रस्तुत करने हेतु{' '}
                      <strong>कुकीज़ (Cookies)</strong> का उपयोग करते हैं।
                    </>
                  ) : (
                    <>
                      <strong className="text-darkBrown font-bold">
                        Third-party vendors, including Google, use cookies
                      </strong>{' '}
                      to serve ads based on a user&apos;s prior visits to this website or other websites across the
                      Internet.
                    </>
                  )}
                </li>

                <li>
                  {isHi ? (
                    <>
                      <strong className="text-darkBrown font-bold">व्यक्तिगत विज्ञापन (Personalized Ads):</strong>{' '}
                      विज्ञापन कुकीज़ के उपयोग से Google और उसके भागीदारों को उपयोगकर्ता के आराधना मार्ग अथवा अन्य
                      इंटरनेट साइटों पर भ्रमण के आधार पर प्रासंगिक विज्ञापन दिखाने की अनुमति मिलती है।
                    </>
                  ) : (
                    <>
                      <strong className="text-darkBrown font-bold">Personalized Advertising:</strong> Google&apos;s use
                      of advertising cookies enables it and its partners to serve relevant ads to our users based on
                      their visits to our site and/or other sites on the Internet.
                    </>
                  )}
                </li>

                <li>
                  {isHi ? (
                    <>
                      <strong className="text-darkBrown font-bold">गैर-सामग्री पृष्ठों पर विज्ञापन निषेध:</strong>{' '}
                      Google के नियमों के अनुरूप हम किसी भी गैर-सामग्री पृष्ठ जैसे गोपनीयता नीति, नियम, अस्वीकरण,
                      संपर्क, खोज परिणाम या दान पृष्ठों पर विज्ञापन प्रदर्शित नहीं करते हैं।
                    </>
                  ) : (
                    <>
                      <strong className="text-darkBrown font-bold">Strict Exclusion on Non-Content Pages:</strong> In
                      compliance with Google policies, advertisements are strictly prohibited and paused on non-content,
                      utility, search, legal, and donation pages (/privacy, /terms, /disclaimer, /contact, /support-us,
                      /search, /favorites).
                    </>
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Opt-Out Links & User Controls (Crucial Google Requirement) */}
          <div
            id="ad-settings"
            className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi
                ? '3. विज्ञापनों से बाहर निकलने के विकल्प (Your Opt-Out Choices)'
                : '3. Your Opt-Out Choices & Ad Settings'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आप किसी भी समय व्यक्तिगत विज्ञापनों और ट्रैकिंग कुकीज़ से बाहर निकल सकते हैं। इसके लिए आप नीचे दिए गए आधिकारिक टूल्स का उपयोग कर सकते हैं:'
                  : 'You have full autonomy over how advertising cookies are used. Users may opt out of personalized advertising at any time using the following accredited industry resources:'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <a
                  href="https://adssettings.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-darkBrown font-bold text-lg mb-1.5">
                      <span>Google Ads Settings</span>
                      <ExternalLink className="w-4 h-4 text-saffron group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {isHi
                        ? 'Google खाता धारक अपनी विज्ञापन सेटिंग्स में जाकर व्यक्तिगत विज्ञापन को बंद कर सकते हैं।'
                        : 'Opt out of Google personalized advertising directly across your Google accounts and devices.'}
                    </p>
                  </div>
                  <span className="text-xs text-saffron font-bold mt-3 block">adssettings.google.com →</span>
                </a>

                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-darkBrown font-bold text-lg mb-1.5">
                      <span>AboutAds.info (DAA)</span>
                      <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {isHi
                        ? 'Digital Advertising Alliance के माध्यम से सभी तृतीय-पक्ष विज्ञापनदाताओं से एक क्लिक में बाहर निकलें।'
                        : 'Digital Advertising Alliance consumer choice tool to opt out of third-party interest-based ads.'}
                    </p>
                  </div>
                  <span className="text-xs text-blue-600 font-bold mt-3 block">aboutads.info/choices →</span>
                </a>

                <a
                  href="https://optout.networkadvertising.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-darkBrown font-bold text-lg mb-1.5">
                      <span>Network Advertising (NAI)</span>
                      <ExternalLink className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {isHi
                        ? 'NAI के भागीदार विज्ञापन नेटवर्कों द्वारा उपयोग की जाने वाली कुकीज़ को बंद करें।'
                        : 'Network Advertising Initiative opt-out page for participating advertising network vendors.'}
                    </p>
                  </div>
                  <span className="text-xs text-purple-600 font-bold mt-3 block">optout.networkadvertising.org →</span>
                </a>

                <a
                  href="https://www.youronlinechoices.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-darkBrown font-bold text-lg mb-1.5">
                      <span>Your Online Choices (EU)</span>
                      <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {isHi
                        ? 'यूरोपीय संघ एवं यूके के उपयोगकर्ताओं के लिए विशेष इंटरएक्टिव विज्ञापन नियंत्रण गाइड।'
                        : 'Dedicated behavioral advertising guidance and opt-out choices for visitors in the EU and UK.'}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold mt-3 block">youronlinechoices.com →</span>
                </a>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3">
                <div>
                  <p className="font-bold text-darkBrown text-base">
                    {isHi ? 'कुकी प्राथमिकताएं बदलें (Consent Preferences)' : 'Manage Cookie Preferences (CMP)'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isHi
                      ? 'यूरोपीय संघ (EEA/UK/Switzerland) के उपयोगकर्ता अपनी कुकी सहमति को पुनः खोलकर बदल अथवा वापस ले सकते हैं।'
                      : 'Visitors in the EEA, UK, and Switzerland can reopen the Google-certified CMP to review, modify, or revoke consent.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const w = window as any;
                      if (w.googlefc && typeof w.googlefc.showRevocationMessage === 'function') {
                        w.googlefc.showRevocationMessage();
                      } else {
                        alert(
                          isHi
                            ? 'Google Consent Management बैनर आपके क्षेत्र (EEA/UK/Switzerland) या AdSense सक्रिय होने पर प्रदर्शित होता है।'
                            : 'Google Consent Management banner displays for visitors in regions (EEA/UK/Switzerland) governed by GDPR.'
                        );
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-saffron hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  {isHi ? 'कुकी प्राथमिकताएं खोलें' : 'Open Cookie Settings'}
                </button>
              </div>

              <p className="text-sm sm:text-base text-gray-600 pt-2">
                {isHi
                  ? 'इसके अतिरिक्त आप अपने इंटरनेट ब्राउज़र (जैसे Chrome, Firefox, Safari, Edge) की सेटिंग्स में जाकर भी किसी भी समय सभी कुकीज़ को मिटा या ब्लॉक कर सकते हैं।'
                  : 'You can also configure your web browser (Chrome, Safari, Firefox, Edge) to block or delete cookies entirely at any time through your browser settings.'}
              </p>
            </div>
          </div>

          {/* Section 4: Third-Party Vendors & Ad Networks */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi
                ? '4. तृतीय-पक्ष विक्रेता एवं विज्ञापन नेटवर्क (Third-Party Ad Networks)'
                : '4. Third-Party Vendors & Ad Networks'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'Google AdSense कार्यक्रम के अंतर्गत Google द्वारा प्रमाणित अन्य विज्ञापनदाता कंपनियां और तकनीकी प्रदाता भी विज्ञापन प्रदर्शित करने के लिए कुकीज़ का उपयोग कर सकते हैं। आप Google द्वारा प्रमाणित अधिकृत विज्ञापन प्रौद्योगिकी प्रदाताओं (Ad Technology Providers) की संपूर्ण सूची निम्नलिखित लिंक पर देख सकते हैं:'
                  : 'Under Google AdSense, certified third-party vendors and ad technology providers may serve ads on Aradhna Marg. You can review the complete list of Google-certified ad technology providers, their policies, and opt-out mechanisms at:'}
              </p>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <a
                  href="https://support.google.com/adsense/answer/9012903"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-saffron font-bold hover:underline"
                >
                  <span>Google Ad Technology Providers List (Google सहायता पृष्ठ)</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Section 5: EEA, UK & Switzerland Consent Handling (GDPR Compliance) */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi
                ? '5. यूरोपीय संघ (EEA), यूके एवं स्विट्ज़रलैंड हेतु सहमति (EU User Consent)'
                : '5. Consent Handling for EEA, UK & Switzerland (GDPR)'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi ? (
                  <>
                    यूरोपीय आर्थिक क्षेत्र (EEA), यूनाइटेड किंगडम एवं स्विट्ज़रलैंड के उपयोगकर्ताओं के लिए, हम{' '}
                    <strong>सामान्य डेटा संरक्षण विनियमन (GDPR)</strong> एवं Google की{' '}
                    <strong>EU User Consent Policy</strong> का कड़ाई से पालन करते हैं:
                  </>
                ) : (
                  <>
                    For users located in the European Economic Area (EEA), the United Kingdom, and Switzerland, we
                    strictly comply with the <strong>General Data Protection Regulation (GDPR)</strong>, the UK GDPR,
                    and Google&apos;s <strong>EU User Consent Policy</strong>:
                  </>
                )}
              </p>
              <ul className="list-disc pl-6 space-y-2.5 marker:text-emerald-500 text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  {isHi
                    ? 'विज्ञापन कुकीज़ अथवा व्यक्तिगत डेटा केवल उपयोगकर्ता की पूर्व, स्पष्ट एवं संसूचित सहमति (Explicit Consent) प्राप्त करने के पश्चात ही सक्रिय किए जाते हैं।'
                    : 'Personalized advertising cookies are deployed only after obtaining valid, affirmative user consent via a Google-certified Consent Management Platform (CMP).'}
                </li>
                <li>
                  {isHi
                    ? 'हम Google Consent Mode v2 एवं IAB Europe Transparency & Consent Framework (TCF v2.2) मानकों का पूर्ण अनुपालन सुनिश्चित करते हैं।'
                    : 'We support Google Consent Mode v2 and the IAB Europe Transparency and Consent Framework (TCF v2.2) to pass accurate consent signals.'}
                </li>
                <li>
                  {isHi
                    ? 'उपयोगकर्ताओं को अपनी सहमति वापस लेने, बदलने अथवा व्यक्तिगत विज्ञापनों को अस्वीकार करने का पूर्ण अधिकार सुरक्षित है।'
                    : 'Users have the right to withdraw or modify their cookie consent at any time without restriction.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 6: Analytics & Embedded Devotional Media */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi
                ? '6. एनालिटिक्स एवं एम्बेडेड भक्ति मीडिया (Analytics & Media)'
                : '6. Analytics & Embedded Devotional Media'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'वेबसाइट के सुधार और तकनीकी निगरानी हेतु हम निम्नलिखित वैध सेवाओं का उपयोग करते हैं:'
                  : 'To monitor website health and provide rich devotional media, we integrate:'}
              </p>
              <ul className="list-disc pl-6 space-y-2.5 marker:text-emerald-500 text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">Google Analytics:</strong>{' '}
                  {isHi
                    ? 'वेबसाइट ट्रैफ़िक और लोकप्रिय भजनों को समझने हेतु आईपी-एनोनिमाइज़ेशन (IP Anonymization) के साथ उपयोग किया जाता है।'
                    : 'Used with IP anonymization to understand aggregate content trends without identifying individual visitors.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">YouTube Video Embeds:</strong>{' '}
                  {isHi
                    ? 'भजनों के वीडियो देखने हेतु आधिकारिक YouTube प्लेयर का उपयोग होता है, जो Google/YouTube की निजता नीति के अधीन संचालित होता है।'
                    : 'Official devotional videos are streamed using embedded YouTube players governed by Google’s Privacy Policy (policies.google.com/privacy).'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 7: Data Security & Storage */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight">
              {isHi
                ? '7. डेटा सुरक्षा एवं गोपनीयता प्रतिबद्धता (Data Security)'
                : '7. Data Security & Sacred Commitment'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग किसी भी स्थिति में आपकी व्यक्तिगत जानकारी को व्यावसायिक लाभ अथवा डेटा ब्रोकरों को नहीं बेचता है। संपूर्ण वेबसाइट 256-बिट SSL/TLS एन्क्रिप्शन से सुरक्षित है। हम सनातन धर्म की पवित्रता के अनुरूप आपकी निजता को उच्चतम प्राथमिकता देते हैं।'
                  : 'Aradhna Marg never sells, rents, or commercializes personal data to data brokers. The entire platform is secured using modern 256-bit SSL/TLS encryption. We treat the privacy of every seeker with the utmost sanctity and responsibility.'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight">
            {isHi ? 'गोपनीयता या विज्ञापन से संबंधित कोई प्रश्न?' : 'Questions Regarding Privacy or Advertising?'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi
              ? 'यदि आपके पास हमारी गोपनीयता नीति, कुकीज़ अथवा विज्ञापन नीतियों के संबंध में कोई प्रश्न है, तो कृपया हमसे बेझिझक संपर्क करें।'
              : 'If you have questions, feedback, or concerns regarding our Privacy Policy or advertising disclosures, please reach out to us.'}
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
