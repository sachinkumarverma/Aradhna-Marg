import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  BookOpen,
  Music,
  Flame,
  Calendar,
  ShieldCheck,
  Users,
  Compass,
  Mail,
  ArrowRight
} from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { IconText } from '@components/common/IconText';
import { useTranslation } from '@i18n/LanguageContext';

export const AboutPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  useEffect(() => {
    document.title = isHi
      ? 'हमारे बारे में (About Us) | आराधना मार्ग - Aradhna Marg'
      : 'About Us | Aradhna Marg - Sacred Devotional Platform';
  }, [isHi]);

  const breadcrumbItems = [{ label: isHi ? 'हमारे बारे में' : 'About Us' }];

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
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#29140a] via-[#3a1d0f] to-[#170a04] text-white p-8 sm:p-12 md:p-16 mb-10 shadow-xl border border-amber-900/30 text-center">
          {/* Ambient Glows */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-saffron/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
              {isHi ? 'हमारे बारे में' : 'About Aradhna Marg'}
              <span className="block text-xl sm:text-2xl md:text-3xl text-amber-300/95 font-semibold mt-3">
                {isHi ? '(सनातन धर्म का पावन डिजिटल मंच)' : '(Sanatan Devotion & Spiritual Heritage)'}
              </span>
            </h1>

            <p
              className={`text-slate-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              {isHi
                ? 'सनातन धर्म के पावन भजनों, 18 महापुराणों, आरतियों, चालीसा एवं आध्यात्मिक ज्ञान को जन-जन तक पहुँचाने का एक विनम्र प्रयास।'
                : 'A dedicated digital sanctuary for Sanatan Dharma, bringing authentic sacred bhajans, 18 Mahapuranas, aartis, chalisas, and deep spiritual meanings to devotees worldwide.'}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm sm:text-base font-semibold text-amber-200">
              <Sparkles className="w-5 h-5 text-golden shrink-0" />
              <span className="leading-none">
                {isHi ? 'भक्ति • ज्ञान • सेवा • समर्पण' : 'Devotion • Wisdom • Seva • Heritage'}
              </span>
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
                <strong className="text-darkBrown font-bold">आराधना मार्ग (Aradhna Marg)</strong> की स्थापना सनातन धर्म
                की समृद्ध आध्यात्मिक धरोहर को आधुनिक तकनीक के माध्यम से सुलभ और सुगम बनाने के पावन संकल्प के साथ की गई
                है। हमारा लक्ष्य प्रत्येक श्रद्धालु को प्रामाणिक भक्ति साहित्य, शुद्ध पाठ, सरल भावार्थ और आध्यात्मिक
                शांति प्रदान करना है।
              </>
            ) : (
              <>
                <strong className="text-darkBrown font-bold">Aradhna Marg (aradhnamarg.com)</strong> was created with a
                sacred vision: to preserve, organize, and illuminate the timeless spiritual wisdom of Sanatan Dharma for
                modern seekers and devotees worldwide. We bridge sacred tradition with intuitive technology, making
                devotional texts, hymns, and scripture accessible to all generations.
              </>
            )}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 - Our Mission */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? 'हमारा पावन उद्देश्य (Our Sacred Mission)' : 'Our Sacred Mission'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आज के व्यस्त डिजिटल युग में अनेक श्रद्धालु प्रामाणिक भजनों के सही बोल, उनके गूढ़ आध्यात्मिक अर्थ तथा पुराणों के मूल प्रसंगों की खोज में रहते हैं। आराधना मार्ग पर हम शुद्ध वर्तनी, छंदबद्ध रचनाओं और सरल हिंदी भावार्थ के साथ यह ज्ञान प्रस्तुत करते हैं।'
                  : 'In today’s fast-paced digital world, millions of devotees search for authentic devotional lyrics, accurate Sanskrit shlokas, and clear spiritual explanations. Aradhna Marg is committed to providing authenticated texts, accurate transliterations, and easy-to-understand explanations (Bhavarth).'}
              </p>
              <p>
                {isHi
                  ? 'हमारा उद्देश्य केवल सामग्री संकलित करना नहीं, अपितु भक्ति के अनुभव को सहज, पवित्र और आनंददायक बनाना है।'
                  : 'Our mission transcends mere compilation: we craft a serene digital sanctuary where devotion meets clarity, helping seekers deepen their daily connection with the Divine.'}
              </p>
            </div>
          </div>

          {/* Section 2 - Core Pillars */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? 'आराधना मार्ग पर क्या उपलब्ध है?' : 'What We Offer to Devotees'}
            </h2>
            <p
              className={`text-gray-700 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] mb-5 font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              {isHi
                ? 'आराधना मार्ग पर सनातन धर्म के सभी प्रमुख अंगों का संपूर्ण डिजिटल संकलन उपलब्ध है:'
                : 'Our platform encompasses key pillars of Sanatan devotional life:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-orange-100/60">
                <IconText
                  icon={<Music className="w-5 h-5 shrink-0 -translate-y-[1px]" />}
                  text={isHi ? 'पावन भजन एवं भावार्थ' : 'Bhajans & Bhavarth'}
                  className="mb-2 text-saffron font-bold text-lg leading-snug"
                />
                <p
                  className={`text-[16px] sm:text-[17px] text-gray-700 leading-relaxed ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi
                    ? 'विभिन्न देवी-देवताओं के पारंपरिक व लोकप्रिय भजनों के शुद्ध बोल तथा उनके अंतर्निहित भावार्थ।'
                    : 'Authentic lyrics and insightful verse-by-verse spiritual meanings for beloved devotional songs.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-orange-100/60">
                <IconText
                  icon={<BookOpen className="w-5 h-5 shrink-0 -translate-y-[1px]" />}
                  text={isHi ? '18 महापुराण संग्रह' : '18 Mahapuranas'}
                  className="mb-2 text-amber-700 font-bold text-lg leading-snug"
                />
                <p
                  className={`text-[16px] sm:text-[17px] text-gray-700 leading-relaxed ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi
                    ? 'शिव पुराण, विष्णु पुराण, श्रीमद्भागवत सहित समस्त 18 महापुराणों के सरल अध्याय एवं प्रसंग।'
                    : 'Comprehensive exploration of the 18 sacred Puranas with categorized chapters and sacred lore.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-orange-100/60">
                <IconText
                  icon={<Flame className="w-5 h-5 shrink-0 -translate-y-[1px]" />}
                  text={isHi ? 'आरती, चालीसा व स्तोत्र' : 'Aarti, Chalisa & Stotram'}
                  className="mb-2 text-emerald-700 font-bold text-lg leading-snug"
                />
                <p
                  className={`text-[16px] sm:text-[17px] text-gray-700 leading-relaxed ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi
                    ? 'नित्य पूजा, संध्या आरती, संकटमोचन हनुमानाष्टक, दुर्गा सप्तशती आदि के सिद्ध पाठ।'
                    : 'Complete daily prayer essentials, stotras, kavachams, and chalisas with audio/video accompaniment.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-orange-100/60">
                <IconText
                  icon={<Calendar className="w-5 h-5 shrink-0 -translate-y-[1px]" />}
                  text={isHi ? 'धार्मिक पर्व व तिथियाँ' : 'Festivals & Wisdom'}
                  className="mb-2 text-purple-700 font-bold text-lg leading-snug"
                />
                <p
                  className={`text-[16px] sm:text-[17px] text-gray-700 leading-relaxed ${isHi ? 'font-hindi-body' : 'font-legal'}`}
                >
                  {isHi
                    ? 'एकादशी, शिवरात्रि, नवरात्रि, दीपावली आदि प्रमुख पर्वों की पूजा विधि, कथा व महत्व।'
                    : 'Significance, rituals, vrats, and dates of holy Sanatan festivals throughout the Hindu calendar.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 - Editorial Values & Reverence */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? 'हमारी संपादकीय मर्यादा व संतों के प्रति आदर' : 'Our Editorial Values & Reverence'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'हम सनातन परंपरा के सभी ऋषि-मुनियों, भक्त कवियों (जैसे सूरदास, तुलसीदास, मीराबाई, कबीरदास आदि) तथा आधुनिक संगीतकारों की रचनाओं का हृदय से सम्मान करते हैं। जहाँ भी प्रामाणिक स्रोत उपलब्ध होते हैं, हम मूल रचनाकार व गायक को उचित श्रेय प्रदान करते हैं।'
                  : 'We hold the highest reverence for saint-poets, classical composers (such as Tulsidas, Surdas, Mirabai, Kabir, and Adi Shankaracharya), and modern devotional artists. We strive to provide proper attribution and context for every work featured on our platform.'}
              </p>
              <p>
                {isHi
                  ? 'हमारा मंच शुद्ध, निष्पक्ष एवं विज्ञापन-मुक्त सहज अनुभव प्रदान करने के लिए निरंतर प्रयत्नशील है।'
                  : 'We are committed to delivering an elegant, distraction-free reading experience that honors the sacred sanctity of devotional worship.'}
              </p>
            </div>
          </div>

          {/* Section 4 - Community & Devotee Engagement */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown mb-4 tracking-tight`}>
              {isHi ? 'भक्त सहभागिता एवं सेवा (Community & Seva)' : 'Devotee Community & Seva'}
            </h2>
            <div
              className={`text-gray-700 space-y-4 text-[18px] sm:text-[19px] md:text-[20px] leading-[1.85] font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
            >
              <p>
                {isHi
                  ? 'आराधना मार्ग केवल एक वेबसाइट नहीं, बल्कि सनातन संस्कृति के प्रेमियों का एक परिवार है। यदि आप किसी भजन के बोल भेजना चाहते हैं, किसी पाठ में सुधार सुझाना चाहते हैं या अपनी प्रतिक्रिया देना चाहते हैं, तो आपका सदैव स्वागत है।'
                  : 'Aradhna Marg is a growing global community of devotees and culture enthusiasts. Whether you wish to contribute devotional lyrics, suggest corrections, or share your valuable feedback, we warmly welcome your participation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Navigation Footer Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-orange-50 p-8 sm:p-12 border border-orange-200/80 shadow-sm text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black text-darkBrown mb-3.5 tracking-tight`}>
            {isHi ? 'हमसे जुड़ें व संपर्क करें' : 'Connect with Aradhna Marg'}
          </h3>
          <p
            className={`text-gray-700 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-normal ${isHi ? 'font-hindi-body' : 'font-legal'}`}
          >
            {isHi
              ? 'सनातन धर्म के इस पावन प्रचार में अपना अमूल्य सहयोग व सुझाव देने के लिए हमारी सेवा टीम से संपर्क करें।'
              : 'Join us in propagating the eternal wisdom of Sanatan Dharma. Reach out to our team for questions, suggestions, or contributions.'}
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
