import React from 'react';
import toast from 'react-hot-toast';

interface SocialShareButtonsProps {
  title: string;
  excerpt?: string;
  url?: string;
  className?: string;
}

export const formatShareMessage = (title: string, excerpt?: string, url?: string) => {
  const fullUrl = url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : window.location.href;
  const cleanExcerpt = excerpt
    ? excerpt
        .trim()
        .replace(/<[^>]*>/g, '')
        .slice(0, 140) + '...'
    : '';

  return (
    `🌸 *${title}* 🌸\n\n` +
    `✨ *आराधना मार्ग (Aradhna Marg) - सनातन धर्म एवं संस्कृति*\n\n` +
    (cleanExcerpt ? `📖 ${cleanExcerpt}\n\n` : '') +
    `🙏 सनातन परंपरा, पावन भजन, पौराणिक कथाएँ एवं वैदिक ज्ञान।\n\n` +
    `🔗 *पूरा पढ़ने एवं सुनने के लिए नीचे दिए लिंक पर क्लिक करें:*\n${fullUrl}\n\n` +
    `🚩 जय श्री राम | हर हर महादेव 🚩`
  );
};

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ title, excerpt, url, className = '' }) => {
  const [copied, setCopied] = React.useState(false);

  const getFullUrl = () => {
    if (!url) return window.location.href;
    return url.startsWith('http') ? url : `${window.location.origin}${url}`;
  };

  const isMobile = () => {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = formatShareMessage(title, excerpt, url);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleFacebook = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = getFullUrl();
    const msg = formatShareMessage(title, excerpt, url);

    // On mobile, if native share is supported, open native share dialog
    if (isMobile() && navigator.share) {
      try {
        await navigator.share({
          title,
          text: msg,
          url: fullUrl
        });
        return;
      } catch (err) {
        // User closed native dialog, proceed with fallback
      }
    }

    try {
      await navigator.clipboard.writeText(msg);
      toast.success('संदेश कॉपी हो गया! Facebook पोस्ट में पेस्ट करें।', { duration: 3000 });
    } catch {
      // ignore
    }

    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
  };

  const handleInstagram = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = formatShareMessage(title, excerpt, url);
    const fullUrl = getFullUrl();

    // On mobile devices, native share integrates with Instagram App directly
    if (isMobile() && navigator.share) {
      try {
        await navigator.share({
          title,
          text: msg,
          url: fullUrl
        });
        return;
      } catch (err) {
        // Cancelled share
      }
    }

    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success('संदेश कॉपी हो गया! Instagram स्टोरी या चैट में पेस्ट करें।', { duration: 3000 });
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }

    if (isMobile()) {
      window.location.href = 'instagram://app';
      setTimeout(() => {
        window.open('https://www.instagram.com', '_blank');
      }, 1000);
    } else {
      window.open('https://www.instagram.com', '_blank');
    }
  };

  return (
    <div className={`flex items-center gap-1.5 relative ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* WhatsApp */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-500 flex items-center justify-center transition-colors shadow-xs"
        title="WhatsApp पर शेयर करें"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 2c-5.514 0-9.989 4.475-9.989 9.989 0 1.763.459 3.487 1.33 5.006l-1.413 5.163 5.279-1.385c1.464.799 3.119 1.217 4.79 1.217 5.516 0 9.991-4.475 9.991-9.989 0-5.515-4.475-9.989-9.988-9.989zm0 18.232c-1.503 0-2.981-.403-4.276-1.168l-.307-.181-3.177.833.848-3.097-.199-.317c-.838-1.337-1.282-2.883-1.282-4.464 0-4.596 3.739-8.334 8.336-8.334 4.594 0 8.333 3.738 8.333 8.334 0 4.598-3.738 8.334-8.276 8.334zm4.568-6.241c-.251-.126-1.488-.734-1.718-.817-.23-.084-.397-.126-.565.126-.168.251-.65.817-.796.985-.147.168-.293.188-.544.063-.251-.126-1.061-.391-2.021-1.247-.747-.666-1.252-1.489-1.398-1.74-.146-.251-.016-.387.11-.512.113-.113.251-.293.376-.44.126-.147.168-.251.251-.418.084-.168.042-.314-.021-.44-.063-.126-.565-1.362-.774-1.865-.203-.489-.41-.423-.564-.431-.144-.007-.311-.009-.478-.009s-.439.063-.669.314c-.23.251-.879.858-.879 2.093 0 1.235.899 2.43 1.024 2.597.126.168 1.768 2.7 4.283 3.787.598.259 1.065.413 1.429.529.601.191 1.147.164 1.579.1.482-.072 1.488-.607 1.697-1.192.209-.586.209-1.088.146-1.193-.062-.105-.23-.168-.481-.294z" />
        </svg>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={handleFacebook}
        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-500 flex items-center justify-center transition-colors shadow-xs"
        title="Facebook पर शेयर करें"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      {/* Instagram */}
      <button
        type="button"
        onClick={handleInstagram}
        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white text-slate-500 flex items-center justify-center transition-colors shadow-xs"
        title="Instagram पर शेयर करें"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </button>

      {copied && (
        <span className="absolute -top-7 left-0 bg-darkBrown text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap animate-fade-in">
          Copied message!
        </span>
      )}
    </div>
  );
};
