import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

export const RefundPolicyPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const { settings } = usePublicSettings();
  const contactEmail = settings.contactEmail || 'support@aradhnamarg.com';

  const pageTitle = isHi ? 'वापसी नीति (Refund Policy) | Aradhna Marg' : 'Refund Policy | Aradhna Marg';

  const pageDesc = isHi
    ? 'आराधना मार्ग पर स्वैच्छिक सहयोग, अंशदान, तकनीकी विफलताओं एवं वापसी से संबंधित आधिकारिक नीति व दिशानिर्देश।'
    : 'Official Refund Policy for voluntary contributions and support on Aradhna Marg.';

  const breadcrumbItems = [{ label: isHi ? 'वापसी नीति' : 'Refund Policy' }];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: isHi ? 'वापसी नीति' : 'Refund Policy', item: '/refund-policy' }
  ]);

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-3 sm:pt-4 pb-24 selection:bg-saffron/20 selection:text-saffron ${
        isHi ? 'font-hindi-body' : 'font-legal'
      }`}
    >
      <SEOHead title={pageTitle} description={pageDesc} canonicalPath="/refund-policy" schema={breadcrumbSchema} />

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
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 ${
                isHi ? 'font-hindi-body' : 'font-sans'
              }`}
            >
              {isHi ? 'वापसी नीति' : 'Refund Policy'}
              <span
                className={`block text-xl sm:text-2xl md:text-3xl text-amber-300/95 font-medium mt-3 ${
                  isHi ? 'font-hindi-body' : 'font-sans'
                }`}
              >
                {isHi ? '(वापसी व रद्दीकरण नीति - आराधना मार्ग)' : '(Refund & Cancellation Policy - Aradhna Marg)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${
                isHi ? 'font-hindi-body' : 'font-sans'
              }`}
            >
              {isHi
                ? 'आराधना मार्ग पर स्वैच्छिक सहयोग, दक्षिणा कोष, तकनीकी त्रुटि समीक्षा एवं धनवापसी से संबंधित पारदर्शी नियम व दिशानिर्देश।'
                : 'Clear and transparent terms regarding voluntary contributions, payment reviews, and refund procedures for Aradhna Marg.'}
            </p>

            <div
              className={`mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm sm:text-base font-semibold text-amber-200 ${
                isHi ? 'font-hindi-body' : 'font-sans'
              }`}
            >
              <Sparkles className="w-5 h-5 text-golden shrink-0" />
              <span className="leading-none">{isHi ? 'अंतिम अद्यतन: नवम्बर 2026' : 'Last Updated: November 2026'}</span>
            </div>
          </div>
        </div>

        {/* Introduction Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm mb-8">
          <p
            className={`text-xl sm:text-2xl md:text-[23px] text-gray-800 leading-[1.8] font-normal ${
              isHi ? 'font-hindi-body' : 'font-legal'
            }`}
          >
            {isHi ? (
              <>
                <strong className="text-darkBrown font-bold">आराधना मार्ग (aradhnamarg.com)</strong> सनातन धर्म के पावन
                भजनों, 18 महापुराणों, देवी-देवताओं की स्तुतियों, व्रतों व धार्मिक लेखों का एक व्यक्तिगत रूप से संचालित
                एवं सर्वसुलभ आध्यात्मिक मंच है। हमारा संपूर्ण भक्ति साहित्य जन-जन के लिए पूर्णतः निःशुल्क उपलब्ध है। मंच
                के संचालन, सर्वर व्यय एवं सनातन शोध कार्य हेतु आगंतुक स्वेच्छा से{' '}
                <strong className="text-darkBrown font-bold">"Support Aradhna Marg"</strong> के माध्यम से सहयोग राशि दे
                सकते हैं।
              </>
            ) : (
              <>
                Welcome to <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong>. Our
                platform is an individually operated Hindu devotional and spiritual content sanctuary dedicated to
                preserving and sharing sacred bhajans, the 18 Mahapuranas, festival dates, deities, and spiritual wisdom
                free of cost. Visitors may voluntarily contribute through our{' '}
                <strong className="text-darkBrown font-bold">"Support Aradhna Marg"</strong> initiative to support
                hosting, server maintenance, research, and platform improvements.
              </>
            )}
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {/* Section 1: About Contributions */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '1. स्वैच्छिक सहयोग के संबंध में (About Contributions)' : '1. About Contributions'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग एक निःशुल्क सनातन भक्ति एवं आध्यात्मिक ज्ञान मंच है। आगंतुक वेबसाइट के रखरखाव, तकनीकी विकास एवं परिचालन खर्चों में सहयोग हेतु स्वेच्छा से अपना योगदान दे सकते हैं।'
                  : 'Aradhna Marg is a free devotional and spiritual content platform. Visitors may voluntarily contribute towards the maintenance, development, and operational expenses of the website.'}
              </p>
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-darkBrown font-medium text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8]">
                {isHi
                  ? 'महत्वपूर्ण: वेबसाइट पर किए जाने वाले सभी योगदान पूर्णतः स्वैच्छिक हैं और ये किसी भी भौतिक उत्पाद, सदस्यता (Subscription) अथवा सशुल्क सेवा की खरीद के बदले किया गया भुगतान नहीं हैं।'
                  : 'Important: All contributions are voluntary and are not payments for any product, subscription, or paid service.'}
              </div>
            </div>
          </div>

          {/* Section 2: Nature of Contributions */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '2. सहयोग की प्रकृति एवं स्वरूप (Nature of Contributions)' : '2. Nature of Contributions'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? '"Support Aradhna Marg" सुविधा के माध्यम से किया जाने वाला प्रत्येक योगदान पूर्णतः स्वैच्छिक प्रकृति का है।'
                  : 'Contributions made through the Support Aradhna Marg feature are voluntary in nature.'}
              </p>
              <p>
                {isHi
                  ? 'सहयोग करके आगंतुक यह स्वीकार करते हैं कि यह भुगतान केवल आराधना मार्ग के सुचारु संचालन, डिजिटल अवसंरचना और निरंतर विकास में सहायता प्रदान करने के उद्देश्य से किया जा रहा है।'
                  : 'By making a contribution, visitors acknowledge that the payment is intended to support the operation and development of Aradhna Marg.'}
              </p>
              <p>
                {isHi
                  ? 'किसी भी योगदान के बदले में किसी भौतिक उत्पाद, डिजिटल उत्पाद, विशेष सदस्यता या सशुल्क सेवा का कोई वादा या अनुबंध नहीं किया जाता है।'
                  : 'No physical product, digital product, subscription, or exclusive service is promised in exchange for a contribution.'}
              </p>
            </div>
          </div>

          {/* Section 3: Refund Policy */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '3. वापसी नीति (Refund Policy)' : '3. Refund Policy'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'चूँकि सभी योगदान स्वैच्छिक होते हैं, इसलिए सफलतापूर्वक संपन्न हो चुके योगदान सामान्यतः अप्रतिदेय (Non-refundable) होते हैं।'
                  : 'As contributions are voluntary, successfully completed contributions are generally non-refundable.'}
              </p>
              <p>
                {isHi
                  ? 'तथापि, निम्नलिखित असाधारण एवं सत्यापित परिस्थितियों में वापसी (Refund) के अनुरोधों पर विचार किया जा सकता है:'
                  : 'However, refund requests may be considered in the following circumstances:'}
              </p>

              <ul className="list-disc pl-6 space-y-3.5 marker:text-saffron text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'दोहरा लेन-देन (Duplicate Payment):' : 'Duplicate Transactions:'}
                  </strong>{' '}
                  {isHi
                    ? 'एक ही सहयोग अनजाने में तकनीकी त्रुटि के कारण एक से अधिक बार प्रोसेस हो गया हो।'
                    : 'The same contribution was accidentally processed more than once.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'तकनीकी विफलता (Technical Error):' : 'Technical Debit Without Credit:'}
                  </strong>{' '}
                  {isHi
                    ? 'खाते से राशि कट गई हो, परंतु पेमेंट गेटवे अथवा नेटवर्क एरर के कारण वह सफलतापूर्वक दर्ज न हुई हो।'
                    : 'An amount was deducted from the contributor’s account due to a technical error, but the contribution was not successfully recorded.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'अनधिकृत लेन-देन (Unauthorised Transaction):' : 'Unauthorised Transaction:'}
                  </strong>{' '}
                  {isHi
                    ? 'किसी अनधिकृत अथवा संदिग्ध लेन-देन की रिपोर्ट बैंक या कार्डधारक द्वारा की गई हो।'
                    : 'An unauthorised transaction is reported and verified.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'गलत राशि कटौती (Processing Discrepancy):' : 'Processing Discrepancy:'}
                  </strong>{' '}
                  {isHi
                    ? 'सत्यापित पेमेंट-प्रोसेसिंग त्रुटि के कारण गलत अथवा अतिरिक्त राशि काटी गई हो।'
                    : 'An incorrect amount was charged due to a verified payment-processing error.'}
                </li>
              </ul>

              <p className="pt-2 text-slate-600 italic">
                {isHi
                  ? 'प्रत्येक प्राप्त अनुरोध की व्यक्तिगत रूप से निष्पक्ष जांच और समीक्षा की जाएगी।'
                  : 'Each request will be reviewed individually.'}
              </p>
            </div>
          </div>

          {/* Section 4: Cancellation Policy */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '4. रद्दीकरण नीति (Cancellation Policy)' : '4. Cancellation Policy'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'चूँकि योगदान स्वैच्छिक होते हैं और भुगतान गेटवे के माध्यम से तत्काल प्रोसेस किए जाते हैं, इसलिए सफलतापूर्वक संपन्न हो चुके योगदान को सामान्यतः रद्द (Cancel) नहीं किया जा सकता है।'
                  : 'Since contributions are voluntary and are generally processed immediately through the payment gateway, a successfully completed contribution cannot ordinarily be cancelled.'}
              </p>
              <p>
                {isHi
                  ? 'यदि कोई आगंतुक भुगतान पूरा करने से पहले अपना विचार बदलते हैं, तो वे बिना आगे बढ़े भुगतान विंडो अथवा पेमेंट स्क्रीन को आसानी से बंद कर सकते हैं।'
                  : 'If a visitor changes their mind before completing the payment, they can simply close the payment page without proceeding.'}
              </p>
            </div>
          </div>

          {/* Section 5: Failed and Pending Transactions */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi
                ? '5. विफल एवं लंबित लेन-देन (Failed and Pending Transactions)'
                : '5. Failed and Pending Transactions'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'यदि बैंक खाते से धनराशि कट जाती है किंतु पेमेंट गेटवे द्वारा विफल (Failed) अथवा लंबित (Pending) लेन-देन की सूचना मिलती है, तो योगदानकर्ता को सबसे पहले अपने बैंक स्टेटमेंट और लेन-देन की स्थिति की जांच करनी चाहिए।'
                  : 'If money is deducted from a bank account but the payment gateway reports a failed or pending transaction, the contributor should first check their bank statement and transaction status.'}
              </p>
              <p>
                {isHi
                  ? 'अनेक मामलों में, बैंकिंग नियमों के तहत ऐसी विफल राशियां पेमेंट प्रदाता अथवा संबंधित बैंक द्वारा स्वतः ही वापस (Auto-reversed) कर दी जाती हैं।'
                  : 'In many cases, failed transactions are automatically reversed by the payment provider or bank.'}
              </p>
              <p>
                {isHi
                  ? 'यदि पेमेंट प्रदाता द्वारा निर्धारित समयावधि के भीतर राशि स्वतः वापस नहीं होती है, तो योगदानकर्ता लेन-देन के विवरण के साथ हमारी टीम से संपर्क कर सकते हैं।'
                  : 'If the amount is not reversed within the timeframe communicated by the payment provider, the contributor may contact us with the transaction details.'}
              </p>
            </div>
          </div>

          {/* Section 6: How to Request a Refund */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '6. वापसी का अनुरोध कैसे करें (How to Request a Refund)' : '6. How to Request a Refund'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'पात्र वापसी अनुरोधों के लिए, योगदानकर्ता हमारे आधिकारिक संपर्क पृष्ठ अथवा प्रकाशित सहायता ईमेल के माध्यम से संपर्क कर सकते हैं।'
                  : 'For eligible refund requests, contributors should contact us through our official contact page or published support email.'}
              </p>
              <p className="font-semibold text-darkBrown">
                {isHi
                  ? 'कृपया अपने अनुरोध के साथ निम्नलिखित विवरण अवश्य संलग्न करें:'
                  : 'Please provide the following details:'}
              </p>

              <ul className="list-disc pl-6 space-y-3.5 marker:text-saffron text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">{isHi ? 'पूरा नाम:' : 'Full Name:'}</strong>{' '}
                  {isHi ? 'योगदानकर्ता का पूरा नाम।' : 'Full name of the contributor.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'पंजीकृत ईमेल:' : 'Registered Email Address:'}
                  </strong>{' '}
                  {isHi ? 'भुगतान के समय प्रयुक्त ईमेल पता।' : 'Email address used during the transaction.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'ट्रांजेक्शन संदर्भ आईडी:' : 'Transaction Reference ID:'}
                  </strong>{' '}
                  {isHi ? 'गेटवे अथवा बैंक संदर्भ संख्या।' : 'Payment gateway or bank reference number.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">{isHi ? 'लेन-देन तिथि:' : 'Transaction Date:'}</strong>{' '}
                  {isHi ? 'जिस दिन राशि काटी गई।' : 'Date and time of transaction.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">{isHi ? 'सहयोग राशि:' : 'Contribution Amount:'}</strong>{' '}
                  {isHi ? 'कटौती की गई वास्तविक राशि।' : 'Exact amount charged.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'वापसी का कारण:' : 'Reason for Request:'}
                  </strong>{' '}
                  {isHi ? 'वापसी अनुरोध का स्पष्ट कारण।' : 'Specific reason for requesting the refund.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'भुगतान प्रमाण:' : 'Supporting Evidence:'}
                  </strong>{' '}
                  {isHi
                    ? 'बैंक स्टेटमेंट या भुगतान पुष्टिकरण का स्क्रीनशॉट।'
                    : 'Payment confirmation screenshot or bank receipt.'}
                </li>
              </ul>

              <p className="pt-2">
                {isHi
                  ? 'हम आपके अनुरोध की समीक्षा करेंगे और निर्धारित समयावधि में निर्णय से अवगत कराएंगे। स्वीकृत रिफंड सामान्यतः पेमेंट गेटवे एवं बैंकिंग प्रक्रियाओं के अनुसार मूल भुगतान माध्यम में ही प्रोसेस किए जाएंगे।'
                  : 'We will review the request and communicate the outcome. Approved refunds will generally be processed through the original payment method, subject to the payment gateway and banking procedures.'}
              </p>
            </div>
          </div>

          {/* Section 7: Refund Processing Time */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '7. वापसी प्रक्रिया की समयावधि (Refund Processing Time)' : '7. Refund Processing Time'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'रिफंड स्वीकृत होने के बाद, धनराशि के योगदानकर्ता के खाते में दिखने का वास्तविक समय पेमेंट गेटवे, संबंधित बैंक अथवा भुगतान पद्धति (सामान्यतः 5 से 7 बैंकिंग कार्यदिवस) पर निर्भर करता है।'
                  : 'Once a refund is approved, the actual time required for the amount to appear in the contributor’s account depends on the payment gateway, bank, or payment method (typically 5 to 7 business days).'}
              </p>
              <p>
                {isHi
                  ? 'जहां भी संभव होगा, हम आपको रिफंड की स्थिति की जानकारी ईमेल के माध्यम से उपलब्ध कराएंगे।'
                  : 'We will communicate the refund status and reference ID wherever possible.'}
              </p>
            </div>
          </div>

          {/* Section 8: Contact Us */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '8. संपर्क एवं सहायता सूत्र (Contact Us)' : '8. Contact Us'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'स्वैच्छिक सहयोग, वापसी अथवा भुगतान से संबंधित किसी भी प्रश्न या चिंता के समाधान के लिए आगंतुक आराधना मार्ग के आधिकारिक संपर्क पृष्ठ के माध्यम से हमसे संपर्क कर सकते हैं।'
                  : 'For questions or concerns regarding contributions, refunds, or payment-related issues, visitors may contact Aradhna Marg through its official Contact Us page.'}
              </p>
              <div className="pt-2 space-y-2">
                <p>
                  <strong className="text-darkBrown font-bold">{isHi ? 'वेबसाइट:' : 'Website:'}</strong>{' '}
                  <span className="text-slate-700">https://aradhnamarg.com</span>
                </p>
                {contactEmail && (
                  <p>
                    <strong className="text-darkBrown font-bold">{isHi ? 'सहायता ईमेल:' : 'Email:'}</strong>{' '}
                    <a href={`mailto:${contactEmail}`} className="font-medium text-saffron hover:underline">
                      {contactEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3
            className={`text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight font-hindi-heading`}
          >
            {isHi ? 'सहयोग या भुगतान से संबंधित कोई प्रश्न है?' : 'Questions About Contributions or Refunds?'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${
              isHi ? 'font-hindi-body' : 'font-legal'
            }`}
          >
            {isHi
              ? 'यदि आपके पास स्वैच्छिक सहयोग, किसी लेन-देन अथवा हमारी नीतियों के विषय में कोई प्रश्न है, तो हमारी टीम से निःसंकोच संपर्क करें।'
              : 'If you have questions regarding voluntary support, transaction verification, or our policies, please reach out to the Aradhna Marg team.'}
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
