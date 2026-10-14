import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Mail, ShieldAlert, Heart, Flame } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { PublicApi } from '@/api/publicApi';
import { SEOHead } from '@/components/seo';
import toast from 'react-hot-toast';

export const MaintenancePage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const { settings, refetch } = usePublicSettings();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    PublicApi.clearCache();
    const result = await refetch();
    setChecking(false);

    if (result.data?.maintenanceMode) {
      toast(isHi ? 'सामयिक संवर्धन अभी भी प्रगति पर है।' : 'Maintenance is still in progress.', {
        icon: '⏳'
      });
    } else {
      toast.success(isHi ? 'सेवा पुनः बहाल हो गई है!' : 'Platform is back online!');
    }
  };

  // Only poll while visitors are actively stranded on the maintenance screen
  React.useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, 20000);
    return () => clearInterval(timer);
  }, [refetch]);

  return (
    <div className="min-h-screen w-full bg-[#120904] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-saffron/20 selection:text-saffron">
      <SEOHead
        title={isHi ? 'सामयिक संवर्धन | आराधना मार्ग' : 'Scheduled Maintenance | Aradhna Marg'}
        description={
          isHi
            ? 'आराधना मार्ग पर सामयिक तकनीकी संवर्धन कार्य चल रहा है। हम शीघ्र ही पुनः उपस्थित होंगे।'
            : 'Aradhna Marg is currently undergoing scheduled maintenance. We will be back shortly.'
        }
        noIndex={true}
      />

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-saffron/25 via-amber-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-[#fff9f0] border border-orange-200/80 flex items-center justify-center p-1 shadow-md">
            <img src="/logo.png" alt="Aradhna Marg" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div className="flex flex-col">
            <span
              className="font-black text-lg sm:text-xl tracking-tight text-white leading-none uppercase"
              style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
            >
              ARADHNA <span className="text-saffron">MARG</span>
            </span>
            <span
              className="text-[7px] sm:text-[8px] font-extrabold text-amber-200/70 tracking-[0.3em] uppercase mt-0.5 ml-0.5"
              style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
            >
              SANATAN DHARMA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-amber-200">
          <Flame className="w-3.5 h-3.5 text-saffron shrink-0" />
          <span>{isHi ? 'सामयिक संवर्धन' : 'Under Maintenance'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-6 py-8 sm:py-12 flex flex-col items-center text-center my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-gradient-to-b from-[#24130a]/90 to-[#190c05]/95 border border-amber-900/40 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md"
        >
          {/* Sacred Diya / Sparkle Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-amber-500/20 via-saffron/20 to-orange-400/20 border border-saffron/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.25)]">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 animate-pulse" />
          </div>

          {/* Heading */}
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
          >
            {isHi ? 'आराधना मार्ग सामयिक संवर्धन पर है' : 'Aradhna Marg is Under Maintenance'}
          </h1>

          <p
            className={`text-amber-300/90 text-sm sm:text-base font-medium mb-6 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
          >
            {isHi ? 'प्रभु सेवा एवं धर्मग्रंथ मंच का तकनीकी उन्नयन' : 'Sacred Digital Platform Enhancement in Progress'}
          </p>

          {/* Body Description */}
          <p
            className={`text-slate-300 text-sm sm:text-base leading-relaxed mb-8 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
          >
            {isHi
              ? 'सनातन धर्म के पावन भजनों, अष्टादश महापुराणों एवं धार्मिक ज्ञान के इस डिजिटल मंच को और अधिक सुगम, तीव्र व सुंदर बनाने हेतु सामयिक तकनीकी सुधार किए जा रहे हैं। कृपया कुछ समय पश्चात पुनः पधारें।'
              : 'We are performing scheduled maintenance and performance optimizations to enhance your spiritual experience. All sacred scriptures and devotional features will be restored shortly. Thank you for your devotion and patience.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-saffron hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>
                {checking ? (isHi ? 'जांच जारी है...' : 'Checking...') : isHi ? 'स्थिति पुनः जांचें' : 'Check Status'}
              </span>
            </button>

            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-semibold text-sm transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-300" />
                <span>{isHi ? 'सहायता ईमेल' : 'Contact Support'}</span>
              </a>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <p className="flex items-center gap-1.5">
          <span>© {new Date().getFullYear()} Aradhna Marg.</span>
          <span>{isHi ? 'समस्त अधिकार सुरक्षित।' : 'All Rights Reserved.'}</span>
        </p>

        <a
          href="/admin"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition-colors"
          title="Admin Login"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{isHi ? 'व्यवस्थापक प्रवेश' : 'Admin Portal'}</span>
        </a>
      </footer>
    </div>
  );
};
