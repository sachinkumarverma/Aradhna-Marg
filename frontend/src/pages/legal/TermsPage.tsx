import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Mail,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';

export const TermsPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  useEffect(() => {
    document.title = isHi
      ? 'नियम एवं शर्तें (Terms of Service) | आराधना मार्ग - Aradhna Marg'
      : 'Terms of Service | Aradhna Marg - Sacred Devotional Platform';
  }, [isHi]);

  const breadcrumbItems = [{ label: isHi ? 'नियम व शर्तें' : 'Terms of Service' }];

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24 selection:bg-saffron/20 selection:text-saffron ${isHi ? 'font-hindi-body' : 'font-legal'}`}
    >
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
              {isHi ? 'नियम एवं शर्तें' : 'Terms of Service'}
              <span className="block text-xl sm:text-2xl md:text-3xl text-amber-300/95 font-semibold mt-3">
                {isHi ? '(Terms & Conditions - आराधना मार्ग)' : '(Terms of Use - Aradhna Marg)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              {isHi
                ? 'आराधना मार्ग (Aradhna Marg) पर उपलब्ध पावन भजनों, 18 महापुराणों, स्तोत्रों, भावार्थ, वीडियो एवं धार्मिक सामग्री के उपयोग के दिशानिर्देश व नियम।'
                : 'These terms explain how Aradhna Marg may be used and provide important information about our devotional content, editorial material, copyright, user contributions, and third-party services.'}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm sm:text-base font-semibold text-amber-200">
              <Sparkles className="w-5 h-5 text-golden shrink-0" />
              <span className="leading-none">{isHi ? 'अंतिम अद्यतन: अक्टूबर 2026' : 'Last Updated: October 2026'}</span>
            </div>
          </div>
        </div>

        {/* Introduction Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm mb-8">
          <p
            className={`text-xl sm:text-2xl md:text-[23px] text-gray-800 leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi ? (
              <>
                <strong className="text-darkBrown font-bold">आराधना मार्ग (Aradhna Marg)</strong> में आपका स्वागत है।
                हमारा यह डिजिटल मंच सनातन धर्म के पवित्र भजनों, आरतियों, चालीसा, 18 महापुराणों, दिव्य स्तोत्रों, मंत्रों
                तथा उनके सरल भावार्थ को जन-जन तक पहुँचाने के लिए समर्पित है। हमारी वेबसाइट का उपयोग करके आप इन नियमों और
                शर्तों का पूर्णतः पालन करने की सहमति देते हैं।
              </>
            ) : (
              <>
                Welcome to <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong>. Our
                digital sanctuary is dedicated to preserving, organizing, and sharing the eternal treasures of Sanatan
                Dharma—including sacred bhajans, aartis, chalisa, 18 Mahapuranas, stotras, and insightful Bhavarth
                (meanings). By accessing or using our platform, you agree to comply with and be bound by these Terms of
                Service.
              </>
            )}
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '1. शर्तों की स्वीकृति (Acceptance of Terms)' : '1. Acceptance of Terms'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग (Aradhna Marg) का उपयोग करके आप पुष्टि करते हैं कि आपने इन नियमों और हमारी गोपनीयता नीति (Privacy Policy) को पढ़, समझ और स्वीकार कर लिया है। यदि आप इन शर्तों से सहमत नहीं हैं, तो कृपया वेबसाइट का उपयोग बंद कर दें।'
                  : 'By accessing or using Aradhna Marg, you agree to these Terms of Service and to use the website in accordance with applicable laws. These terms apply to visitors, devotees, readers, contributors, and other users of the website.'}
              </p>
              <p>
                {isHi
                  ? 'यह नियम वेबसाइट पर आने वाले सभी भक्तों, पाठकों, शोधकर्ताओं तथा योगदानकर्ताओं पर समान रूप से लागू होते हैं।'
                  : 'If you do not agree with these terms, please discontinue use of the website. Our Privacy Policy explains how information may be collected and used when you interact with our platform.'}
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '2. हमारी सामग्री एवं सम्पादकीय कार्य (About Our Content)'
                : '2. About Our Devotional & Cultural Content'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग एक विशुद्ध धार्मिक, सांस्कृतिक एवं शैक्षिक मंच है। यहाँ सनातन धर्म के विभिन्न सम्प्रदायों, देवी-देवताओं की स्तुतियों, भजनों के बोल (Lyrics), 18 महापुराणों के प्रसंग, चालीसा, आरती, पर्वों की जानकारी एवं आध्यात्मिक लेखों का संग्रह है।'
                  : 'Aradhna Marg is a devotional and educational website that brings together bhajans, aartis, chalisa, stotras, 18 Mahapuranas, traditional devotional literature, spiritual articles, and explanatory material.'}
              </p>
              <p>
                {isHi
                  ? 'हमारा संपादकीय कार्य भजनों के प्रामाणिक बोल व्यवस्थित करना, भाषा व वर्तनी का परिमार्जन, सरल शब्दों में भावार्थ (Bhavarth) तैयार करना तथा भक्तों की सुविधा हेतु सुव्यवस्थित वर्गीकरण करना है।'
                  : 'Our editorial work includes selecting and organizing devotional material, formatting lyrics, preparing transliterations or translations, researching background context, and writing spiritual explanations such as Bhavarth (meaning). We aim to make devotional material easier to read, understand, and use for personal study and worship.'}
              </p>
              <p>
                {isHi
                  ? 'पारंपरिक, सार्वजनिक धरोहर एवं तृतीय-पक्ष रचनाओं के संदर्भ में जहाँ रचयिता, गायक, संगीतकार या प्रकाशक की जानकारी उपलब्ध होती है, हम उसे यथासंभव प्रस्तुत करते हैं।'
                  : 'Traditional, public-domain, and third-party material may appear on the website. Where a work is associated with a known author, singer, composer, publisher, or rights holder, we identify that information where available.'}
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '3. बौद्धिक संपदा एवं कॉपीराइट (Intellectual Property & Copyright)'
                : '3. Intellectual Property & Copyright'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'सनातन परम्परा के प्राचीन ग्रंथ, वेद, उपनिषद, स्तोत्र एवं पारंपरिक भजन सार्वजनिक धरोहर (Public Domain) हैं। आधुनिक रचित भजनों एवं रचनाओं का मूल अधिकार उनके संबंधित रचयिताओं, गायकों, संगीतकारों अथवा अधिकारधारकों के पास सुरक्षित है।'
                  : 'Copyright in individual devotional works belongs to the applicable author, composer, publisher, label, performer, or other rights holder where copyright protection applies. Traditional and public-domain works may be freely available under applicable law.'}
              </p>
              <p>
                {isHi
                  ? 'आराधना मार्ग द्वारा स्वतंत्र रूप से तैयार किए गए मूल भावार्थ, लेख, टिप्पणियां, अनुवाद, डेटाबेस संरचना तथा वेबसाइट की रूपरेखा पर आराधना मार्ग का बौद्धिक संपदा अधिकार लागू होता है।'
                  : "The website's original editorial contributions, including original explanations, Bhavarth, translations, formatting, organization, research, and other original written material, are protected by applicable intellectual-property laws."}
              </p>
              <p>
                {isHi
                  ? 'इन नियमों के अंतर्गत किसी भी तीसरे पक्ष की कॉपीराइट सामग्री का स्वामित्व आराधना मार्ग या उसके उपयोगकर्ताओं को हस्तांतरित नहीं होता है।'
                  : "Nothing in these Terms transfers ownership of a third party's copyrighted work to Aradhna Marg or to a website user."}
              </p>
            </div>

            {/* Callout Box */}
            <div className="mt-6 p-6 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-4">
              <BookOpen className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
              <p
                className={`text-[17px] sm:text-[18px] md:text-[19px] text-amber-900 font-medium leading-relaxed ${isHi ? 'font-hindi-body' : 'font-legal'}`}
              >
                {isHi
                  ? 'हम सभी रचयिताओं एवं संतों की पावन कृतियों का पूर्ण आदर करते हैं तथा उपलब्ध होने पर उचित श्रेय (Attribution) प्रदान करते हैं।'
                  : 'We hold deep reverence for all saints, poets, and composers, and strive to provide proper attribution wherever authentic sources are available.'}
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? '4. अनुमत एवं धार्मिक उपयोग (Permitted Use)' : '4. Permitted Personal & Devotional Use'}
            </h2>
            <p
              className={`text-gray-700 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] mb-5 font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              {isHi
                ? 'आप आराधना मार्ग का उपयोग व्यक्तिगत, धार्मिक, शैक्षिक तथा गैर-व्यावसायिक भक्ति उद्देश्यों के लिए कर सकते हैं:'
                : 'You may use the website for personal, devotional, educational, and informational purposes, provided that your use respects these terms and applicable law.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span
                  className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi ? 'भजन, आरती एवं चालीसा का पाठ व गायन करना' : 'Read and sing along with devotional lyrics'}
                </span>
              </div>
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span
                  className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi ? '18 महापुराणों व धार्मिक लेखों का अध्ययन' : 'Study the 18 Mahapuranas and spiritual articles'}
                </span>
              </div>
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span
                  className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi
                    ? 'मित्रों, परिजनों व सत्संग मंडलियों में लिंक साझा करना'
                    : 'Share links to pages with family and friends'}
                </span>
              </div>
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-orange-100/60">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span
                  className={`text-[17px] sm:text-[18px] md:text-[19px] text-gray-800 font-medium ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi ? 'निजी भक्ति साधना हेतु भावार्थ व अर्थ समझना' : 'Read our spiritual explanations and Bhavarth'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-red-100/80 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '5. जिम्मेदार उपयोग एवं निषिद्ध गतिविधियाँ (Responsible Use)'
                : '5. Responsible Use of the Website'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'मंच की सुरक्षा व मर्यादा बनाए रखने हेतु उपयोगकर्ताओं से अपेक्षा की जाती है कि वे:'
                  : 'To keep the website useful, secure, and available to readers, users should not:'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-red-500 text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  {isHi
                    ? 'बिना पूर्व अनुमति के स्वचालित बॉट्स, स्क्रैपर्स अथवा टूल्स द्वारा पूरी वेबसाइट के डेटा का व्यापक दोहन (Mass Scraping) न करें।'
                    : "Use automated systems to excessively crawl, scrape, mirror, or reproduce the website's database or original editorial material."}
                </li>
                <li>
                  {isHi
                    ? 'हमारे मौलिक भावार्थ, लेखों अथवा अनुवादों को व्यावसायिक लाभ के लिए किसी अन्य पोर्टल पर बिना अनुमति पुनर्प्रकाशित न करें।'
                    : 'Re-publish substantial portions of our original Bhavarth, explanations, articles, or other original editorial content without permission.'}
                </li>
                <li>
                  {isHi
                    ? 'वेबसाइट के सर्वर, सुरक्षा तंत्र या सामान्य संचालन में किसी भी प्रकार की बाधा उत्पन्न करने का प्रयास न करें।'
                    : 'Attempt to interfere with website security, infrastructure, or normal operation.'}
                </li>
                <li>
                  {isHi
                    ? 'वेबसाइट का उपयोग किसी भी ऐसे तरीके से न करें जो लागू कानूनों या अन्य व्यक्तियों के अधिकारों का उल्लंघन करता हो।'
                    : 'Use the website in a manner that violates applicable laws or the rights of other people.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '6. उपयोगकर्ता योगदान व सुझाव (User Submissions & Suggestions)'
                : '6. User Submissions & Suggestions'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'पाठक वेबसाइट पर दिए गए प्रपत्रों के माध्यम से भजन की जानकारी, सुधार अथवा सुझाव प्रेषित कर सकते हैं।'
                  : 'Readers may submit bhajan information, corrections, suggestions, or other devotional material through forms provided on the website.'}
              </p>
              <p>
                {isHi
                  ? 'सामग्री प्रेषित करके आप यह पुष्टि करते हैं कि आपको वह सामग्री साझा करने का अधिकार है। आप आराधना मार्ग को सामग्री की समीक्षा, सम्पादन, प्रारूपण एवं प्रदर्शन की अनुमति देते हैं।'
                  : 'Users should only submit lyrics, translations, arrangements, images, recordings, or other material when they have the right or permission to submit that material, or where the submission is otherwise lawful.'}
              </p>
              <p>
                {isHi
                  ? 'हम शुद्धता, गुणवत्ता एवं मर्यादा की दृष्टि से प्रविष्टियों की समीक्षा करते हैं और आवश्यकतानुसार सुधार या हटाने का अधिकार रखते हैं।'
                  : 'We may review submissions for accuracy, relevance, copyright, safety, and quality before publishing them. A submission may be edited, declined, or removed when appropriate.'}
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi
                ? '7. तृतीय-पक्ष सेवाएँ, कड़ियाँ एवं विज्ञापन (Third-Party Services)'
                : '7. Third-Party Services, Links & Advertising'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'वेबसाइट पर तृतीय पक्षों द्वारा प्रदान की गई कड़ियाँ, एम्बेडेड मीडिया (जैसे YouTube वीडियो प्लेयर) अथवा सेवाएँ शामिल हो सकती हैं।'
                  : 'The website may contain links, embedded media, or services provided by third parties. These may include video platforms, payment providers, analytics services, advertising partners, or other external services.'}
              </p>
              <p>
                {isHi
                  ? 'तृतीय-पक्ष सेवाएँ अपनी शर्तों और नीतियों के तहत संचालित होती हैं। आराधना मार्ग बाहरी वेबसाइटों की सामग्री या गोपनीयता प्रथाओं को नियंत्रित नहीं करता है।'
                  : 'Third-party services operate under their own terms and privacy policies. Aradhna Marg does not control the content or privacy practices of external websites.'}
              </p>
            </div>
          </div>

          {/* Section 8 & 9 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-extrabold text-darkBrown mb-3.5 tracking-tight flex items-center gap-2.5`}
              >
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                {isHi ? '8. पाठ भेद एवं सटीकता' : '8. Accuracy of Content'}
              </h2>
              <p
                className={`text-gray-700 text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
              >
                {isHi
                  ? 'भक्ति साहित्य में विभिन्न संतों की वाणी एवं क्षेत्रीय परंपराओं के कारण बोल व दोहों में पाठ-भेद पाया जाता है। हम भरसक शुद्धता का प्रयास करते हैं, किंतु किसी भी त्रुटि की सूचना मिलने पर हम उसे सहर्ष परिमार्जित करते हैं।'
                  : 'Traditional devotional works, public-domain works, modern compositions, translations, adaptations, arrangements, and recordings may have different copyright statuses. The fact that a devotional subject is traditional does not necessarily mean that every modern version, translation, arrangement, or recording is free of copyright.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-extrabold text-darkBrown mb-3.5 tracking-tight flex items-center gap-2.5`}
              >
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                {isHi ? '9. लागू कानून एवं न्यायक्षेत्र' : '9. Governing Law & Updates'}
              </h2>
              <p
                className={`text-gray-700 text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
              >
                {isHi
                  ? 'ये नियम एवं शर्तें भारत के लागू कानूनों के अनुसार शासित होंगी। किसी भी विवाद की स्थिति में भारत के सक्षम न्यायालयों का अधिकार क्षेत्र मान्य होगा।'
                  : 'These Terms are governed by the applicable laws of India. Subject to applicable law, disputes relating to the use of the website will be handled by the appropriate courts and authorities in India.'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight`}>
            {isHi ? 'क्या आपके पास कोई प्रश्न या सुझाव है?' : 'Questions About Our Terms?'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi
              ? 'यदि आपको इन नियमों, किसी भजन के कॉपीराइट अथवा सामग्री के संदर्भ में कोई शंका है, तो कृपया हमारी टीम से निःसंकोच संपर्क करें।'
              : 'If you have a question about website use, our content, copyright, submissions, or these Terms, please contact the Aradhna Marg team.'}
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
              to="/disclaimer"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white border border-orange-200 text-gray-800 rounded-full font-bold text-base sm:text-lg hover:bg-orange-50/50 transition-all shadow-xs"
            >
              <span className="inline-flex items-center">
                {isHi ? 'अस्वीकरण पढ़ें (Disclaimer)' : 'Read Disclaimer'}
              </span>
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
