import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

export const ShippingPolicyPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const { settings } = usePublicSettings();
  const contactEmail = settings.contactEmail || 'support@aradhnamarg.com';
  const contactAddress = settings.contactAddress || 'Sector 24, Gandhinagar, Gujarat - 382016, India';

  const pageTitle = isHi
    ? 'शिपिंग एवं डिलीवरी नीति (Shipping & Delivery Policy) | Aradhna Marg'
    : 'Shipping & Delivery Policy | Aradhna Marg';

  const pageDesc = isHi
    ? 'आराधना मार्ग की आधिकारिक शिपिंग एवं डिजिटल डिलीवरी नीति। जानें कि हमारी डिजिटल भक्ति सामग्री एवं स्वैच्छिक सहयोग की डिलीवरी कैसे होती है।'
    : 'Official Shipping & Delivery Policy for Aradhna Marg. Learn about our 100% digital content access and electronic fulfillment.';

  const breadcrumbItems = [{ label: isHi ? 'शिपिंग नीति' : 'Shipping Policy' }];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: isHi ? 'शिपिंग नीति' : 'Shipping Policy', item: '/shipping-policy' }
  ]);

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-3 sm:pt-4 pb-24 selection:bg-saffron/20 selection:text-saffron ${
        isHi ? 'font-hindi-body' : 'font-legal'
      }`}
    >
      <SEOHead title={pageTitle} description={pageDesc} canonicalPath="/shipping-policy" schema={breadcrumbSchema} />

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
              {isHi ? 'शिपिंग एवं डिलीवरी नीति' : 'Shipping & Delivery Policy'}
              <span
                className={`block text-xl sm:text-2xl md:text-3xl text-amber-300/95 font-medium mt-3 ${
                  isHi ? 'font-hindi-body' : 'font-sans'
                }`}
              >
                {isHi
                  ? '(डिजिटल सेवा एवं डिलीवरी नीति - आराधना मार्ग)'
                  : '(Digital Services & Delivery Terms - Aradhna Marg)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${
                isHi ? 'font-hindi-body' : 'font-sans'
              }`}
            >
              {isHi
                ? 'आराधना मार्ग पर उपलब्ध संपूर्ण डिजिटल भक्ति साहित्य, 18 महापुराणों, स्तोत्रों एवं स्वैच्छिक सहयोग से संबंधित डिलीवरी दिशानिर्देश।'
                : 'Clear information regarding instant digital fulfillment, absence of physical goods, and electronic delivery on Aradhna Marg.'}
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
                <strong className="text-darkBrown font-bold">आराधना मार्ग (aradhnamarg.com)</strong> सनातन धर्म का एक
                व्यक्तिगत रूप से संचालित, गैर-व्यावसायिक एवं विशुद्ध आध्यात्मिक मंच है। हमारा संपूर्ण भक्ति
                साहित्य—जिसमें पावन भजन, 18 महापुराण, आरतियाँ, चालीसा, स्तोत्र एवं पर्व-विवरण सम्मिलित हैं—जन-जन के लिए
                पूर्णतः <strong className="text-darkBrown font-bold">डिजिटल एवं निःशुल्क</strong> उपलब्ध है। हम किसी भी
                प्रकार के भौतिक उत्पाद (Physical Goods) की बिक्री या कूरियर शिपिंग नहीं करते हैं।
              </>
            ) : (
              <>
                Welcome to <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong>. Our
                platform is an individually operated, non-commercial Hindu devotional sanctuary. All content on our
                platform—including sacred bhajans, the 18 Mahapuranas, aartis, chalisas, stotras, and spiritual
                articles—is <strong className="text-darkBrown font-bold">100% digital and free of cost</strong>. We do
                not sell or physically ship any tangible products, books, or merchandise.
              </>
            )}
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {/* Section 1: 100% Digital Content & Instant Fulfillment */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi
                ? '1. शत-प्रतिशत डिजिटल सामग्री एवं त्वरित उपलब्धता (Digital Content & Instant Access)'
                : '1. 100% Digital Content & Instant Access'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग पर प्रस्तुत समस्त सामग्री डिजिटल प्रारूप में है। उपयोगकर्ता जैसे ही हमारी वेबसाइट पर आते हैं, वे बिना किसी प्रतीक्षा या शिपिंग शुल्क के तुरंत सभी भजनों के बोल, भावार्थ, आरती और पौराणिक आख्यानों को पढ़ और सुन सकते हैं।'
                  : 'All content provided on Aradhna Marg is strictly digital. Visitors have immediate, real-time access to browse, read, listen, and study sacred scriptures, hymns, and spiritual articles without any delay, waiting period, or shipping charges.'}
              </p>
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-darkBrown font-medium text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8]">
                {isHi
                  ? 'महत्वपूर्ण सूचना: चूँकि हमारी सेवाएँ पूर्णतः ऑनलाइन हैं, इसलिए यहाँ किसी भी प्रकार का भौतिक पैकेजिंग, कूरियर अथवा पार्सल डिलीवरी लागू नहीं होता है।'
                  : 'Important Notice: Because all services and resources are provided electronically online, there is no physical packaging, courier dispatch, or postal transit involved.'}
              </div>
            </div>
          </div>

          {/* Section 2: No Physical Shipping Exemption */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '2. भौतिक शिपिंग एवं कूरियर से छूट (No Physical Shipping)' : '2. Physical Shipping Exemption'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'हम निम्नलिखित बिंदुओं को स्पष्ट रूप से घोषित करते हैं:'
                  : 'We clearly affirm the following parameters regarding physical delivery:'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-saffron text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'कोई भौतिक वस्तु नहीं:' : 'No Tangible Goods:'}
                  </strong>{' '}
                  {isHi
                    ? 'हम किसी भी प्रकार की भौतिक पुस्तक, मूर्ति, पूजा सामग्री अथवा हार्ड-कॉपी उत्पाद नहीं बेचते हैं।'
                    : 'We do not sell, stock, or distribute tangible books, idols, religious accessories, or physical merchandise.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'कोई शिपिंग शुल्क नहीं:' : 'Zero Shipping Charges:'}
                  </strong>{' '}
                  {isHi
                    ? 'वेबसाइट पर किसी भी प्रकार का कूरियर या शिपिंग शुल्क नहीं लिया जाता है।'
                    : 'No courier, logistics, postage, or shipping fees are levied at any time.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'कोई ट्रैकिंग संख्या नहीं:' : 'No Tracking Numbers:'}
                  </strong>{' '}
                  {isHi
                    ? 'चूँकि कोई भौतिक पार्सल नहीं भेजा जाता, इसलिए कोई कूरियर ट्रैकिंग नंबर (AWB) जारी नहीं किया जाता है।'
                    : 'Since no parcel is dispatched through third-party couriers, tracking numbers or airway bills (AWB) do not apply.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Voluntary Contributions & Digital Delivery */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi
                ? '3. स्वैच्छिक सहयोग एवं डिजिटल पावती (Voluntary Contributions & Digital Delivery)'
                : '3. Voluntary Contributions & Digital Fulfillment'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'आगंतुक हमारी वेबसाइट के संचालन, सर्वर व्यय और सनातन शोध कार्य में सहयोग हेतु "Support Aradhna Marg" के माध्यम से स्वेच्छा से अंशदान कर सकते हैं।'
                  : 'Visitors may voluntarily contribute via our "Support Aradhna Marg" feature to help maintain server infrastructure, website hosting, and scripture digitization.'}
              </p>
              <p>
                {isHi
                  ? 'इस स्वैच्छिक सहयोग के बदले किसी भौतिक वस्तु या उपहार की डिलीवरी नहीं की जाती है। सहयोग सफलतापूर्वक संपन्न होने पर:'
                  : 'No physical goods, promotional gifts, or commercial perks are dispatched in exchange for voluntary contributions. Upon successful transaction:'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-saffron text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'त्वरित डिजिटल पावती:' : 'Instant Digital Acknowledgment:'}
                  </strong>{' '}
                  {isHi
                    ? 'भुगतान संपन्न होते ही स्क्रीन पर त्वरित पुष्टिकरण एवं डिजिटल रसीद प्रदर्शित होती है।'
                    : 'An immediate on-screen payment confirmation with reference ID is generated.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'ईमेल पुष्टिकरण:' : 'Email Confirmation:'}
                  </strong>{' '}
                  {isHi
                    ? 'योगदानकर्ता द्वारा दिए गए ईमेल पते पर डिजिटल पावती तुरंत ईमेल के माध्यम से भेज दी जाती है।'
                    : 'A formal digital acknowledgment receipt is transmitted electronically to the contributor’s registered email address.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4: Delivery Timelines */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi ? '4. डिलीवरी समयावधि (Delivery Timelines)' : '4. Electronic Delivery Timelines'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'हमारी सभी डिजिटल सेवाओं की डिलीवरी समयावधि निम्नलिखित प्रकार है:'
                  : 'Timelines for electronic fulfillment on our platform are as follows:'}
              </p>
              <ul className="list-disc pl-6 space-y-3.5 marker:text-saffron text-[17px] sm:text-[18px] md:text-[19px] text-gray-700 leading-[1.8]">
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'वेबसाइट सामग्री एवं भजन:' : 'Website Content & Lyrics:'}
                  </strong>{' '}
                  {isHi ? 'तात्कालिक (Instant / 0 सेकंड)।' : 'Immediate / Instant access upon page load.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'पुराण एवं स्तोत्र पीडीएफ (PDFs):' : 'Purana & Stotra PDFs:'}
                  </strong>{' '}
                  {isHi
                    ? 'डाउनलोड बटन पर क्लिक करते ही सीधे डिवाइस पर तात्कालिक डिजिटल डाउनलोड।'
                    : 'Immediate direct electronic download from our secure cloud storage.'}
                </li>
                <li>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'योगदान की डिजिटल पावती:' : 'Contribution Acknowledgment:'}
                  </strong>{' '}
                  {isHi
                    ? 'भुगतान गेटवे की पुष्टि के 1 से 5 मिनट के भीतर ईमेल द्वारा प्रेषित।'
                    : 'Generated immediately on-screen and delivered via email within 1 to 5 minutes.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 5: Delivery Support & Queries */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi
                ? '5. डिजिटल एक्सेस अथवा सहायता (Access Support & Queries)'
                : '5. Access Support & Delivery Queries'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'यदि किसी तकनीकी त्रुटि के कारण आपको किसी पीडीएफ को डाउनलोड करने अथवा स्वैच्छिक सहयोग की डिजिटल पावती प्राप्त करने में कोई कठिनाई आती है, तो आप अपने ट्रांजेक्शन विवरण के साथ हमारी सहायता टीम से संपर्क कर सकते हैं।'
                  : 'If you encounter any technical difficulty accessing downloadable scripture PDFs or if you did not receive your contribution receipt due to a network glitch, please reach out to our support team with your transaction details.'}
              </p>
              <p>
                {isHi
                  ? 'हमारी टीम 24 से 48 व्यावसायिक घंटों के भीतर आपकी समस्या का निवारण कर डिजिटल प्रति पुनः उपलब्ध कराएगी।'
                  : 'Our support team will verify the records and re-transmit your electronic receipt within 24 to 48 business hours.'}
              </p>
            </div>
          </div>

          {/* Section 6: Operator & Contact Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight font-hindi-heading`}
            >
              {isHi
                ? '6. संचालक एवं संपर्क सूत्र (Operator & Contact Information)'
                : '6. Operator & Contact Information'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${
                isHi ? 'font-hindi-body' : 'font-legal'
              }`}
            >
              <p>
                {isHi
                  ? 'शिपिंग, डिजिटल डिलीवरी अथवा वेबसाइट संचालन से संबंधित किसी भी विधिक या सामान्य जानकारी के लिए आप सीधे संचालक से संपर्क कर सकते हैं:'
                  : 'For any legal notices, delivery inquiries, or operational questions, you may contact the operating entity directly:'}
              </p>
              <div className="pt-2 space-y-2.5">
                <p>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'संचालक / विधिक नाम:' : 'Operating Entity / Legal Name:'}
                  </strong>{' '}
                  <span className="text-slate-800 font-semibold">Sachin Kumar Verma</span>
                </p>
                <p>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'पंजीकृत पता (Registered Address):' : 'Registered Address:'}
                  </strong>{' '}
                  <span className="text-slate-700">{contactAddress}</span>
                </p>
                <p>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'आधिकारिक वेबसाइट:' : 'Official Website:'}
                  </strong>{' '}
                  <span className="text-slate-700">https://aradhnamarg.com</span>
                </p>
                {contactEmail && (
                  <p>
                    <strong className="text-darkBrown font-bold">{isHi ? 'सहायता ईमेल:' : 'Support Email:'}</strong>{' '}
                    <a href={`mailto:${contactEmail}`} className="font-medium text-saffron hover:underline">
                      {contactEmail}
                    </a>
                  </p>
                )}
                <p>
                  <strong className="text-darkBrown font-bold">
                    {isHi ? 'दूरभाष (Helpline):' : 'Phone / Helpline:'}
                  </strong>{' '}
                  <a href="tel:+917000646227" className="font-medium text-saffron hover:underline">
                    +91 7000646227
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3
            className={`text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight font-hindi-heading`}
          >
            {isHi ? 'डिजिटल डिलीवरी से संबंधित कोई प्रश्न है?' : 'Questions About Delivery or Access?'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${
              isHi ? 'font-hindi-body' : 'font-legal'
            }`}
          >
            {isHi
              ? 'यदि आपके पास डिजिटल सामग्री, सहयोग रसीद अथवा हमारी नीतियों के विषय में कोई प्रश्न है, तो हमारी टीम से संपर्क करें।'
              : 'If you have questions regarding digital fulfillment, receipts, or our policies, please connect with the Aradhna Marg team.'}
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
              to="/refund-policy"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white border border-orange-200 text-gray-800 rounded-full font-bold text-base sm:text-lg hover:bg-orange-50/50 transition-all shadow-xs"
            >
              <span className="inline-flex items-center">{isHi ? 'वापसी नीति (Refund)' : 'Refund Policy'}</span>
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
