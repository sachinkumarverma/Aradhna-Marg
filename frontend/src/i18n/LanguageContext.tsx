import React, { createContext, useContext, useState, useEffect } from 'react';
import { hi, type TranslationKeys } from './locales/hi';
import { en } from './locales/en';

export type LanguageMode = 'hi' | 'en';

const locales: Record<LanguageMode, TranslationKeys> = { hi, en };

interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: (key: string) => string;
  getLocalizedField: (item: any, fieldName: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'aradhnamarg_lang';

const DEITY_NAME_MAP: Record<string, { hi: string; en: string }> = {
  'lord ganesh': { hi: 'श्री गणेश', en: 'Lord Ganesh' },
  'maa durga': { hi: 'माँ दुर्गा', en: 'Maa Durga' },
  'lord vishnu': { hi: 'भगवान विष्णु', en: 'Lord Vishnu' },
  'lord krishna': { hi: 'श्री कृष्ण', en: 'Lord Krishna' },
  'lord ram': { hi: 'श्री राम', en: 'Lord Ram' },
  'lord shiva': { hi: 'भगवान शिव', en: 'Lord Shiva' },
  'shri radha rani': { hi: 'श्री राधा रानी', en: 'Shri Radha Rani' },
  'lord hanuman': { hi: 'हनुमान जी', en: 'Lord Hanuman' },
  'yamuna maiya': { hi: 'यमुना मैया', en: 'Yamuna Maiya' },
  'surya dev': { hi: 'सूर्य देव', en: 'Surya Dev' },
  'chhathi maiya': { hi: 'छठी मैया', en: 'Chhathi Maiya' },
  'maa saraswati': { hi: 'माँ सरस्वती', en: 'Maa Saraswati' },
  'mata lakshmi': { hi: 'माता लक्ष्मी', en: 'Mata Lakshmi' },
  'mata parvati': { hi: 'माता पार्वती', en: 'Mata Parvati' },
  'khatu shyam': { hi: 'खाटू श्याम जी', en: 'Khatu Shyam Ji' },
  'ganga maiya': { hi: 'गंगा मैया', en: 'Ganga Maiya' },
  'shani dev': { hi: 'शनि देव', en: 'Shani Dev' }
};

const DEITY_DESCRIPTION_MAP: Record<string, { hi: string; en: string }> = {
  'lord hanuman': {
    hi: 'हनुमान जी अगाध भक्ति, असीम शक्ति, साहस, विनम्रता और प्रभु श्री राम के प्रति अनन्य समर्पण के पावन प्रतीक हैं।',
    en: 'Lord Hanuman symbolizes unwavering devotion, strength, courage, humility, and complete surrender to Lord Rama.'
  },
  'हनुमान जी': {
    hi: 'हनुमान जी अगाध भक्ति, असीम शक्ति, साहस, विनम्रता और प्रभु श्री राम के प्रति अनन्य समर्पण के पावन प्रतीक हैं।',
    en: 'Lord Hanuman symbolizes unwavering devotion, strength, courage, humility, and complete surrender to Lord Rama.'
  },
  'lord ganesh': {
    hi: 'भगवान श्री गणेश समस्त विघ्नों के विनाशक, बुद्धि, विद्या, सफलता और शुभता के अधिपति देव हैं।',
    en: 'Lord Ganesha is the remover of obstacles, patron of wisdom, knowledge, success, and auspicious beginnings.'
  },
  'श्री गणेश': {
    hi: 'भगवान श्री गणेश समस्त विघ्नों के विनाशक, बुद्धि, विद्या, सफलता और शुभता के अधिपति देव हैं।',
    en: 'Lord Ganesha is the remover of obstacles, patron of wisdom, knowledge, success, and auspicious beginnings.'
  },
  'lord krishna': {
    hi: 'भगवान श्री कृष्ण भगवान विष्णु के अष्टम अवतार तथा दिव्य प्रेम, करुणा, ज्ञान और भक्ति के साक्षात् स्वरूप हैं।',
    en: 'Lord Krishna is the eighth incarnation of Lord Vishnu and the embodiment of divine love, compassion, wisdom, and devotion. He is worshipped through bhajans, Bhagavad Gita teachings, and the divine pastimes of Vrindavan.'
  },
  'श्री कृष्ण': {
    hi: 'भगवान श्री कृष्ण भगवान विष्णु के अष्टम अवतार तथा दिव्य प्रेम, करुणा, ज्ञान और भक्ति के साक्षात् स्वरूप हैं।',
    en: 'Lord Krishna is the eighth incarnation of Lord Vishnu and the embodiment of divine love, compassion, wisdom, and devotion. He is worshipped through bhajans, Bhagavad Gita teachings, and the divine pastimes of Vrindavan.'
  },
  'lord ram': {
    hi: 'मर्यादा पुरुषोत्तम भगवान श्री राम धर्म के रक्षक, आदर्श पुत्र, भ्राता, पति तथा नीतिपरायण राजा के परम प्रतीक हैं।',
    en: 'Lord Ram is the seventh incarnation of Lord Vishnu and the ideal king, son, husband, and protector of righteousness.'
  },
  'श्री राम': {
    hi: 'मर्यादा पुरुषोत्तम भगवान श्री राम धर्म के रक्षक, आदर्श पुत्र, भ्राता, पति तथा नीतिपरायण राजा के परम प्रतीक हैं।',
    en: 'Lord Ram is the seventh incarnation of Lord Vishnu and the ideal king, son, husband, and protector of righteousness.'
  },
  'lord shiva': {
    hi: 'देवाधिदेव भगवान शिव देवाधिदेव महादेव, परम योगी और दुष्टों के संहारक हैं। वे ध्यान, वैराग्य, करुणा और मोक्ष के प्रतीक हैं।',
    en: 'Lord Shiva is the supreme yogi and destroyer of evil. He represents meditation, renunciation, compassion, and spiritual transformation.'
  },
  'भगवान शिव': {
    hi: 'देवाधिदेव भगवान शिव देवाधिदेव महादेव, परम योगी और दुष्टों के संहारक हैं। वे ध्यान, वैराग्य, करुणा और मोक्ष के प्रतीक हैं।',
    en: 'Lord Shiva is the supreme yogi and destroyer of evil. He represents meditation, renunciation, compassion, and spiritual transformation.'
  },
  'lord vishnu': {
    hi: 'भगवान श्री हरि विष्णु संपूर्ण जगत के पालनकर्ता और धर्म के परम संरक्षक हैं, जिनकी अनेक दिव्य अवतारों में आराधना की जाती है।',
    en: 'Lord Vishnu is the preserver of the universe and the protector of dharma, worshipped through many divine incarnations.'
  },
  'भगवान विष्णु': {
    hi: 'भगवान श्री हरि विष्णु संपूर्ण जगत के पालनकर्ता और धर्म के परम संरक्षक हैं, जिनकी अनेक दिव्य अवतारों में आराधना की जाती है।',
    en: 'Lord Vishnu is the preserver of the universe and the protector of dharma, worshipped through many divine incarnations.'
  },
  'maa durga': {
    hi: 'माँ भगवती दुर्गा शक्ति, रक्षा, वात्सल्य और आसुरी शक्तियों पर सत्य व धर्म की विजय की साक्षात् अधिष्ठात्री हैं।',
    en: 'Maa Durga is the divine mother who symbolizes power, protection, compassion, and victory over evil.'
  },
  'माँ दुर्गा': {
    hi: 'माँ भगवती दुर्गा शक्ति, रक्षा, वात्सल्य और आसुरी शक्तियों पर सत्य व धर्म की विजय की साक्षात् अधिष्ठात्री हैं।',
    en: 'Maa Durga is the divine mother who symbolizes power, protection, compassion, and victory over evil.'
  },
  'maa saraswati': {
    hi: 'माँ सरस्वती विद्या, बुद्धि, ज्ञान, संगीत, वाणी और कला की अधिष्ठात्री देवी हैं, जिनकी आराधना से प्रज्ञा एवं आध्यात्मिक प्रकाश प्राप्त होता है।',
    en: 'Maa Saraswati is the Hindu goddess of knowledge, wisdom, learning, music, speech, arts and creativity. She is traditionally depicted wearing white garments and holding the Veena, a symbol of music and harmony, along with sacred scriptures and a lotus. Students, teachers, artists, musicians and seekers of knowledge worship Maa Saraswati for wisdom, understanding, creativity and spiritual enlightenment.'
  },
  'माँ सरस्वती': {
    hi: 'माँ सरस्वती विद्या, बुद्धि, ज्ञान, संगीत, वाणी और कला की अधिष्ठात्री देवी हैं, जिनकी आराधना से प्रज्ञा एवं आध्यात्मिक प्रकाश प्राप्त होता है।',
    en: 'Maa Saraswati is the Hindu goddess of knowledge, wisdom, learning, music, speech, arts and creativity. She is traditionally depicted wearing white garments and holding the Veena, a symbol of music and harmony, along with sacred scriptures and a lotus. Students, teachers, artists, musicians and seekers of knowledge worship Maa Saraswati for wisdom, understanding, creativity and spiritual enlightenment.'
  },
  'mata lakshmi': {
    hi: 'माता महालक्ष्मी धन, ऐश्वर्य, समृद्धि, सौभाग्य और पावनता की देवी हैं, जिनकी कृपा से जीवन में मंगल और सुख का संचार होता है।',
    en: 'Mata Lakshmi is the Hindu goddess of wealth, prosperity, fortune, abundance, beauty and auspiciousness. She is traditionally depicted seated or standing upon a lotus, symbolizing purity, spiritual abundance and the ability to remain graceful amid worldly life. Devotees worship Mata Lakshmi for prosperity, happiness, success and well-being, especially during Diwali and Lakshmi Puja.'
  },
  'माता लक्ष्मी': {
    hi: 'माता महालक्ष्मी धन, ऐश्वर्य, समृद्धि, सौभाग्य और पावनता की देवी हैं, जिनकी कृपा से जीवन में मंगल और सुख का संचार होता है।',
    en: 'Mata Lakshmi is the Hindu goddess of wealth, prosperity, fortune, abundance, beauty and auspiciousness. She is traditionally depicted seated or standing upon a lotus, symbolizing purity, spiritual abundance and the ability to remain graceful amid worldly life. Devotees worship Mata Lakshmi for prosperity, happiness, success and well-being, especially during Diwali and Lakshmi Puja.'
  },
  'mata parvati': {
    hi: 'माता पार्वती भगवान शिव की अर्धांगिनी तथा शक्ति, प्रेम, तपस्या, मातृत्व और अखंड सौभाग्य की पावन प्रतीक हैं।',
    en: 'Mata Parvati is one of the principal goddesses in Hindu tradition and the divine consort of Lord Shiva. She represents Shakti, divine feminine energy, love, devotion, strength, motherhood and compassion. She is revered in many forms, including Gauri, Durga, Kali and Annapurna, and is especially worshipped for marital harmony, family well-being, strength and spiritual devotion.'
  },
  'माता पार्वती': {
    hi: 'माता पार्वती भगवान शिव की अर्धांगिनी तथा शक्ति, प्रेम, तपस्या, मातृत्व और अखंड सौभाग्य की पावन प्रतीक हैं।',
    en: 'Mata Parvati is one of the principal goddesses in Hindu tradition and the divine consort of Lord Shiva. She represents Shakti, divine feminine energy, love, devotion, strength, motherhood and compassion. She is revered in many forms, including Gauri, Durga, Kali and Annapurna, and is especially worshipped for marital harmony, family well-being, strength and spiritual devotion.'
  },
  'shri radha rani': {
    hi: 'श्री राधा रानी भगवान श्री कृष्ण की आह्लादिनी शक्ति तथा निष्काम प्रेम व अनन्य भक्ति की सर्वोच्च अधिष्ठात्री हैं।',
    en: 'Shri Radha Rani is the eternal divine consort of Lord Krishna and the highest embodiment of pure devotion and selfless love.'
  },
  'श्री राधा रानी': {
    hi: 'श्री राधा रानी भगवान श्री कृष्ण की आह्लादिनी शक्ति तथा निष्काम प्रेम व अनन्य भक्ति की सर्वोच्च अधिष्ठात्री हैं।',
    en: 'Shri Radha Rani is the eternal divine consort of Lord Krishna and the highest embodiment of pure devotion and selfless love.'
  },
  'surya dev': {
    hi: 'प्रत्यक्ष देवता भगवान सूर्य देव प्रकाश, ऊर्जा, स्वास्थ्य और जीवन के साक्षात् स्रोत हैं, जो अंधकार का नाश कर ज्ञान का प्रकाश फैलाते हैं।',
    en: 'Surya Dev is the Hindu deity of the Sun and is revered as the divine source of light, energy, life, and vitality. He is worshipped as one of the principal celestial deities and is especially associated with health, prosperity, spiritual illumination, and the removal of darkness. Surya Dev is also the father of several important figures in Hindu tradition, including Yamraj, Yamuna Maiya, and Shani Dev.'
  },
  'सूर्य देव': {
    hi: 'प्रत्यक्ष देवता भगवान सूर्य देव प्रकाश, ऊर्जा, स्वास्थ्य और जीवन के साक्षात् स्रोत हैं, जो अंधकार का नाश कर ज्ञान का प्रकाश फैलाते हैं।',
    en: 'Surya Dev is the Hindu deity of the Sun and is revered as the divine source of light, energy, life, and vitality. He is worshipped as one of the principal celestial deities and is especially associated with health, prosperity, spiritual illumination, and the removal of darkness. Surya Dev is also the father of several important figures in Hindu tradition, including Yamraj, Yamuna Maiya, and Shani Dev.'
  },
  'yamuna maiya': {
    hi: 'पावन यमुना मैया ब्रज की परम पवित्र जीवनदायिनी नदी तथा भगवान श्री कृष्ण की बाल-लीलाओं की साक्षी पावन देवी हैं।',
    en: "Yamuna Maiya is the divine personification of the sacred Yamuna River, revered as a goddess in Hindu tradition. She holds a special place in the devotional traditions of Braj and is deeply associated with Lord Krishna's childhood pastimes, Vrindavan, and the sacred festival of Yama Dwitiya."
  },
  'यमुना मैया': {
    hi: 'पावन यमुना मैया ब्रज की परम पवित्र जीवनदायिनी नदी तथा भगवान श्री कृष्ण की बाल-लीलाओं की साक्षी पावन देवी हैं।',
    en: "Yamuna Maiya is the divine personification of the sacred Yamuna River, revered as a goddess in Hindu tradition. She holds a special place in the devotional traditions of Braj and is deeply associated with Lord Krishna's childhood pastimes, Vrindavan, and the sacred festival of Yama Dwitiya."
  },
  'chhathi maiya': {
    hi: 'छठी मैया संतान सुख, परिवार के कल्याण, पवित्रता और आरोग्य की लोक-पूज्य देवी हैं, जिनकी छठ महापर्व पर भगवान सूर्य के साथ श्रद्धापूर्वक पूजा की जाती है।',
    en: 'Chhathi Maiya is a revered folk deity worshipped primarily in Bihar, Jharkhand, eastern Uttar Pradesh and parts of Nepal. She is traditionally associated with the Sun God, purity, family well-being, prosperity, and the protection of children. Devotees worship her with deep devotion during Chhath Puja, observing fasting, offering Arghya to the setting and rising Sun, and praying for the health, happiness and longevity of their families.'
  },
  'छठी मैया': {
    hi: 'छठी मैया संतान सुख, परिवार के कल्याण, पवित्रता और आरोग्य की लोक-पूज्य देवी हैं, जिनकी छठ महापर्व पर भगवान सूर्य के साथ श्रद्धापूर्वक पूजा की जाती है।',
    en: 'Chhathi Maiya is a revered folk deity worshipped primarily in Bihar, Jharkhand, eastern Uttar Pradesh and parts of Nepal. She is traditionally associated with the Sun God, purity, family well-being, prosperity, and the protection of children. Devotees worship her with deep devotion during Chhath Puja, observing fasting, offering Arghya to the setting and rising Sun, and praying for the health, happiness and longevity of their families.'
  }
};

const CATEGORY_DESCRIPTION_MAP: Record<string, { hi: string; en: string }> = {
  'morning bhajans': {
    hi: 'भगवान श्री कृष्ण, शिव, हनुमान, दुर्गा, विष्णु एवं अन्य देवी-देवताओं के पावन प्रातःकालीन भजनों के साथ अपने दिन की शुभ व मंगलमय शुरुआत करें।',
    en: 'Start your day with peaceful morning bhajans dedicated to Lord Krishna, Shiva, Hanuman, Durga, Vishnu, and other Hindu deities to bring positivity and devotion into your life.'
  },
  'प्रातःकालीन भजन': {
    hi: 'भगवान श्री कृष्ण, शिव, हनुमान, दुर्गा, विष्णु एवं अन्य देवी-देवताओं के पावन प्रातःकालीन भजनों के साथ अपने दिन की शुभ व मंगलमय शुरुआत करें।',
    en: 'Start your day with peaceful morning bhajans dedicated to Lord Krishna, Shiva, Hanuman, Durga, Vishnu, and other Hindu deities to bring positivity and devotion into your life.'
  },
  'ec609c2d-6abe-4bd5-b1b9-1410759817b6': {
    hi: 'भगवान श्री कृष्ण, शिव, हनुमान, दुर्गा, विष्णु एवं अन्य देवी-देवताओं के पावन प्रातःकालीन भजनों के साथ अपने दिन की शुभ व मंगलमय शुरुआत करें।',
    en: 'Start your day with peaceful morning bhajans dedicated to Lord Krishna, Shiva, Hanuman, Durga, Vishnu, and other Hindu deities to bring positivity and devotion into your life.'
  },
  'evening bhajans': {
    hi: 'दिन के अवसान पर मन को असीम शांति, कृतज्ञता एवं ईश्वरीय कृपा से परिपूर्ण करने वाले पावन संध्या भजनों व आरतियों का संकलन।',
    en: 'A collection of soothing evening bhajans and devotional songs to help you end your day with peace, gratitude, and divine blessings.'
  },
  'संध्या भजन': {
    hi: 'दिन के अवसान पर मन को असीम शांति, कृतज्ञता एवं ईश्वरीय कृपा से परिपूर्ण करने वाले पावन संध्या भजनों व आरतियों का संकलन।',
    en: 'A collection of soothing evening bhajans and devotional songs to help you end your day with peace, gratitude, and divine blessings.'
  },
  '7fc63afa-a531-4eaa-b2f2-cb7b24eb2d16': {
    hi: 'दिन के अवसान पर मन को असीम शांति, कृतज्ञता एवं ईश्वरीय कृपा से परिपूर्ण करने वाले पावन संध्या भजनों व आरतियों का संकलन।',
    en: 'A collection of soothing evening bhajans and devotional songs to help you end your day with peace, gratitude, and divine blessings.'
  },
  'bhajan collection': {
    hi: 'श्री कृष्ण, भगवान शिव, हनुमान जी, श्री राम, माता रानी व समस्त इष्टदेवों को समर्पित भक्तिमय भजनों, कीर्तनों व पदों का विशाल संग्रह।',
    en: 'Browse a large collection of Hindi devotional bhajans with complete lyrics dedicated to Lord Krishna, Lord Shiva, Hanuman Ji, Shri Ram, Mata Rani and many more.'
  },
  'भजन संग्रह': {
    hi: 'श्री कृष्ण, भगवान शिव, हनुमान जी, श्री राम, माता रानी व समस्त इष्टदेवों को समर्पित भक्तिमय भजनों, कीर्तनों व पदों का विशाल संग्रह।',
    en: 'Browse a large collection of Hindi devotional bhajans with complete lyrics dedicated to Lord Krishna, Lord Shiva, Hanuman Ji, Shri Ram, Mata Rani and many more.'
  },
  'e4610956-2242-435d-8708-3006a6cbebf7': {
    hi: 'श्री कृष्ण, भगवान शिव, हनुमान जी, श्री राम, माता रानी व समस्त इष्टदेवों को समर्पित भक्तिमय भजनों, कीर्तनों व पदों का विशाल संग्रह।',
    en: 'Browse a large collection of Hindi devotional bhajans with complete lyrics dedicated to Lord Krishna, Lord Shiva, Hanuman Ji, Shri Ram, Mata Rani and many more.'
  },
  'aarti collection': {
    hi: 'समस्त प्रमुख देवी-देवताओं की पावन आरतियों का संपूर्ण संग्रह—श्री गणेश, हनुमान, शिव, दुर्गा, लक्ष्मी आरती सहित पूर्ण बोल व भावार्थ।',
    en: 'Complete collection of Hindu aartis with lyrics including Ganesh Aarti, Hanuman Aarti, Shiva Aarti, Durga Aarti, Lakshmi Aarti and many more.'
  },
  'आरती संग्रह': {
    hi: 'समस्त प्रमुख देवी-देवताओं की पावन आरतियों का संपूर्ण संग्रह—श्री गणेश, हनुमान, शिव, दुर्गा, लक्ष्मी आरती सहित पूर्ण बोल व भावार्थ।',
    en: 'Complete collection of Hindu aartis with lyrics including Ganesh Aarti, Hanuman Aarti, Shiva Aarti, Durga Aarti, Lakshmi Aarti and many more.'
  },
  '85696164-e375-4d41-be4c-d44543f9264d': {
    hi: 'समस्त प्रमुख देवी-देवताओं की पावन आरतियों का संपूर्ण संग्रह—श्री गणेश, हनुमान, शिव, दुर्गा, लक्ष्मी आरती सहित पूर्ण बोल व भावार्थ।',
    en: 'Complete collection of Hindu aartis with lyrics including Ganesh Aarti, Hanuman Aarti, Shiva Aarti, Durga Aarti, Lakshmi Aarti and many more.'
  },
  'chalisa collection': {
    hi: 'श्री हनुमान चालीसा, शिव चालीसा, दुर्गा चालीसा, गणेश चालीसा सहित समस्त दिव्य चालीसाओं का प्रामाणिक व सुगम पाठ संग्रह।',
    en: 'Read complete Chalisa lyrics including Hanuman Chalisa, Shiv Chalisa, Durga Chalisa, Ganesh Chalisa and many more with easy-to-read formatting.'
  },
  'चालीसा संग्रह': {
    hi: 'श्री हनुमान चालीसा, शिव चालीसा, दुर्गा चालीसा, गणेश चालीसा सहित समस्त दिव्य चालीसाओं का प्रामाणिक व सुगम पाठ संग्रह।',
    en: 'Read complete Chalisa lyrics including Hanuman Chalisa, Shiv Chalisa, Durga Chalisa, Ganesh Chalisa and many more with easy-to-read formatting.'
  },
  '909a120e-3b97-4280-8158-8c276e505c15': {
    hi: 'श्री हनुमान चालीसा, शिव चालीसा, दुर्गा चालीसा, गणेश चालीसा सहित समस्त दिव्य चालीसाओं का प्रामाणिक व सुगम पाठ संग्रह।',
    en: 'Read complete Chalisa lyrics including Hanuman Chalisa, Shiv Chalisa, Durga Chalisa, Ganesh Chalisa and many more with easy-to-read formatting.'
  },
  mantras: {
    hi: 'दैनिक नित्य पूजा, साधना एवं ध्यान हेतु कल्याणकारी वैदिक महामंत्रों, स्तुतियों व जपों का पावन संग्रह।',
    en: 'Sacred Hindu mantras with their lyrics and chanting text for meditation, spiritual practice, and daily worship.'
  },
  मंत्र: {
    hi: 'दैनिक नित्य पूजा, साधना एवं ध्यान हेतु कल्याणकारी वैदिक महामंत्रों, स्तुतियों व जपों का पावन संग्रह।',
    en: 'Sacred Hindu mantras with their lyrics and chanting text for meditation, spiritual practice, and daily worship.'
  },
  'cca6684a-8755-4e79-b726-9f414358b21e': {
    hi: 'दैनिक नित्य पूजा, साधना एवं ध्यान हेतु कल्याणकारी वैदिक महामंत्रों, स्तुतियों व जपों का पावन संग्रह।',
    en: 'Sacred Hindu mantras with their lyrics and chanting text for meditation, spiritual practice, and daily worship.'
  },
  'stotra collection': {
    hi: 'शिव तांडव स्तोत्र, विष्णु सहस्रनाम, महालक्ष्मी अष्टकम सहित फलदायी एवं दिव्य संस्कृत स्तोत्रों का संपूर्ण संग्रह।',
    en: 'Collection of powerful Hindu stotras including Shiva Tandava Stotram, Vishnu Sahasranamam, Mahalakshmi Stotram and many more.'
  },
  'स्तोत्र संग्रह': {
    hi: 'शिव तांडव स्तोत्र, विष्णु सहस्रनाम, महालक्ष्मी अष्टकम सहित फलदायी एवं दिव्य संस्कृत स्तोत्रों का संपूर्ण संग्रह।',
    en: 'Collection of powerful Hindu stotras including Shiva Tandava Stotram, Vishnu Sahasranamam, Mahalakshmi Stotram and many more.'
  },
  '9171a857-b844-488c-8d42-d4d27d2c6a99': {
    hi: 'शिव तांडव स्तोत्र, विष्णु सहस्रनाम, महालक्ष्मी अष्टकम सहित फलदायी एवं दिव्य संस्कृत स्तोत्रों का संपूर्ण संग्रह।',
    en: 'Collection of powerful Hindu stotras including Shiva Tandava Stotram, Vishnu Sahasranamam, Mahalakshmi Stotram and many more.'
  },
  'spiritual articles': {
    hi: 'सनातन धर्म, दर्शन, संस्कृति, साधना, ग्रंथों व जीवन मूल्यों पर आधारित ज्ञानवर्धक एवं प्रेरणादायी आध्यात्मिक लेख।',
    en: 'Read informative articles on Sanatan Dharma, Hindu traditions, festivals, scriptures, devotional practices, and spiritual knowledge.'
  },
  'आध्यात्मिक लेख': {
    hi: 'सनातन धर्म, दर्शन, संस्कृति, साधना, ग्रंथों व जीवन मूल्यों पर आधारित ज्ञानवर्धक एवं प्रेरणादायी आध्यात्मिक लेख।',
    en: 'Read informative articles on Sanatan Dharma, Hindu traditions, festivals, scriptures, devotional practices, and spiritual knowledge.'
  },
  'f3f04594-7115-4e41-8c39-d02ffff780a8': {
    hi: 'सनातन धर्म, दर्शन, संस्कृति, साधना, ग्रंथों व जीवन मूल्यों पर आधारित ज्ञानवर्धक एवं प्रेरणादायी आध्यात्मिक लेख।',
    en: 'Read informative articles on Sanatan Dharma, Hindu traditions, festivals, scriptures, devotional practices, and spiritual knowledge.'
  },
  'festival special': {
    hi: 'वर्षभर के सनातन पर्वों, व्रत-त्योहारों, पूजन विधियों, पावन कथाओं व उत्सव भजनों का विशेष धार्मिक संकलन।',
    en: 'Special devotional content, bhajans, stories, mantras, and articles dedicated to Hindu festivals throughout the year.'
  },
  'त्योहार विशेष': {
    hi: 'वर्षभर के सनातन पर्वों, व्रत-त्योहारों, पूजन विधियों, पावन कथाओं व उत्सव भजनों का विशेष धार्मिक संकलन।',
    en: 'Special devotional content, bhajans, stories, mantras, and articles dedicated to Hindu festivals throughout the year.'
  },
  'bf8dae30-a711-4d3e-b1ae-3bb5d2285044': {
    hi: 'वर्षभर के सनातन पर्वों, व्रत-त्योहारों, पूजन विधियों, पावन कथाओं व उत्सव भजनों का विशेष धार्मिक संकलन।',
    en: 'Special devotional content, bhajans, stories, mantras, and articles dedicated to Hindu festivals throughout the year.'
  },
  puranas: {
    hi: 'अठारह महापुराणों, उपनिषदों व सनातन धर्मग्रंथों के पावन प्रसंगों, कथाओं, उपदेशों एवं आध्यात्मिक रहस्यों का संकलन।',
    en: 'Explore the eighteen Mahapuranas and other important Hindu scriptures with summaries, stories, teachings, and historical significance.'
  },
  पुराण: {
    hi: 'अठारह महापुराणों, उपनिषदों व सनातन धर्मग्रंथों के पावन प्रसंगों, कथाओं, उपदेशों एवं आध्यात्मिक रहस्यों का संकलन।',
    en: 'Explore the eighteen Mahapuranas and other important Hindu scriptures with summaries, stories, teachings, and historical significance.'
  },
  'cc154633-27b9-441a-a69f-3bf9852073a5': {
    hi: 'अठारह महापुराणों, उपनिषदों व सनातन धर्मग्रंथों के पावन प्रसंगों, कथाओं, उपदेशों एवं आध्यात्मिक रहस्यों का संकलन।',
    en: 'Explore the eighteen Mahapuranas and other important Hindu scriptures with summaries, stories, teachings, and historical significance.'
  }
};

function parseBilingualString(val: any, lang: LanguageMode): string {
  if (!val || typeof val !== 'string') return typeof val === 'string' ? val : '';
  const trimmed = val.trim();

  // Format: "English (Hindi)" e.g. "Morning Bhajans (प्रातःकालीन भजन)"
  const enWithHiMatch = trimmed.match(/^([^()]+?)\s*\(([\u0900-\u097F\s.,-]+)\)$/);
  if (enWithHiMatch) {
    return lang === 'en' ? enWithHiMatch[1].trim() : enWithHiMatch[2].trim();
  }

  // Format: "Hindi (English)" e.g. "प्रातःकालीन भजन (Morning Bhajans)"
  const hiWithEnMatch = trimmed.match(/^([\u0900-\u097F\s.,-]+?)\s*\(([A-Za-z0-9\s.,-]+)\)$/);
  if (hiWithEnMatch) {
    return lang === 'en' ? hiWithEnMatch[2].trim() : hiWithEnMatch[1].trim();
  }

  // Check known deity / religious terms dictionary
  const lower = trimmed.toLowerCase();
  if (DEITY_NAME_MAP[lower]) {
    return DEITY_NAME_MAP[lower][lang];
  }

  // Check known category description dictionary
  for (const item of Object.values(CATEGORY_DESCRIPTION_MAP)) {
    if (item.en.toLowerCase() === lower || item.hi === trimmed) {
      return item[lang];
    }
  }

  // Check known deity description dictionary
  for (const item of Object.values(DEITY_DESCRIPTION_MAP)) {
    if (item.en.toLowerCase() === lower || item.hi === trimmed) {
      return item[lang];
    }
  }

  return trimmed;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
      // Intelligently detect browser language
      if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('hi')) {
        return 'hi';
      }
    } catch {
      // Fallback
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('dir', 'ltr');
  }, [language]);

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.error('Failed to save language choice:', err);
    }
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let currentObj: any = locales[language] || locales.en;

    for (const k of keys) {
      if (currentObj && typeof currentObj === 'object' && k in currentObj) {
        currentObj = currentObj[k];
      } else {
        // Fallback to alternate locale
        let fallbackObj: any = locales[language === 'en' ? 'hi' : 'en'];
        for (const fk of keys) {
          if (fallbackObj && typeof fallbackObj === 'object' && fk in fallbackObj) {
            fallbackObj = fallbackObj[fk];
          } else {
            return path;
          }
        }
        return typeof fallbackObj === 'string' ? fallbackObj : path;
      }
    }

    return typeof currentObj === 'string' ? currentObj : path;
  };

  const getLocalizedField = (item: any, fieldName: string): string => {
    if (!item) return '';
    const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

    // Known category or deity description dictionary check
    if (fieldName === 'short_description' || fieldName === 'description') {
      const rawKey = (item.name || item.slug || '').toLowerCase();
      const parsedEn = parseBilingualString(item.name || '', 'en').toLowerCase();
      const parsedHi = parseBilingualString(item.name || '', 'hi');
      const slugKey = (item.slug || '').toLowerCase();

      if (CATEGORY_DESCRIPTION_MAP[rawKey]) return CATEGORY_DESCRIPTION_MAP[rawKey][language];
      if (CATEGORY_DESCRIPTION_MAP[parsedEn]) return CATEGORY_DESCRIPTION_MAP[parsedEn][language];
      if (CATEGORY_DESCRIPTION_MAP[parsedHi]) return CATEGORY_DESCRIPTION_MAP[parsedHi][language];
      if (CATEGORY_DESCRIPTION_MAP[slugKey]) return CATEGORY_DESCRIPTION_MAP[slugKey][language];

      if (DEITY_DESCRIPTION_MAP[rawKey]) return DEITY_DESCRIPTION_MAP[rawKey][language];
      if (DEITY_DESCRIPTION_MAP[parsedEn]) return DEITY_DESCRIPTION_MAP[parsedEn][language];
      if (DEITY_DESCRIPTION_MAP[parsedHi]) return DEITY_DESCRIPTION_MAP[parsedHi][language];
    }

    if (language === 'en') {
      const enVal =
        item[`${fieldName}_en`] ||
        item[`en_${fieldName}`] ||
        item[`${fieldName}En`] ||
        (fieldName === 'short_description'
          ? item['description_en'] ||
            item['short_description_en'] ||
            item['shortDescription_en'] ||
            item['displayDescription']
          : undefined) ||
        (fieldName === 'description'
          ? item['description_en'] ||
            item['short_description_en'] ||
            item['shortDescription_en'] ||
            item['displayDescription']
          : undefined) ||
        (fieldName === 'title' ? item['title_en'] || item['english_title'] || item['displayTitle'] : undefined) ||
        (fieldName === 'name' ? item['name_en'] || item['displayName'] : undefined) ||
        (fieldName === 'content' ? item['content_en'] || item['displayContent'] : undefined) ||
        (fieldName === 'excerpt' ? item['excerpt_en'] || item['displayExcerpt'] : undefined);

      if (enVal && typeof enVal === 'string' && enVal.trim() !== '') {
        return parseBilingualString(enVal, 'en');
      }

      // Check display field fallback only for matching field types
      let displayVal: any = item[`display${capitalized}`];
      if (!displayVal) {
        if (fieldName === 'title' || fieldName === 'name') {
          displayVal = item.displayTitle || item.displayName;
        } else if (fieldName === 'description' || fieldName === 'short_description' || fieldName === 'excerpt') {
          displayVal = item.displayDescription || item.displayExcerpt;
        } else if (fieldName === 'content') {
          displayVal = item.displayContent;
        }
      }

      if (displayVal && typeof displayVal === 'string' && displayVal.trim() !== '') {
        return parseBilingualString(displayVal, 'en');
      }

      const defaultRaw = item[fieldName] || item[`${fieldName}_en`] || '';
      return parseBilingualString(defaultRaw, 'en');
    }

    let hiVal = item[`${fieldName}_hi`] || item[`hi_${fieldName}`] || item[fieldName];

    if (!hiVal) {
      if (fieldName === 'title' || fieldName === 'name') {
        hiVal = item.displayTitle || item.displayName;
      } else if (fieldName === 'description' || fieldName === 'short_description' || fieldName === 'excerpt') {
        hiVal = item.displayDescription || item.displayExcerpt;
      } else if (fieldName === 'content') {
        hiVal = item.displayContent;
      }
    }

    return parseBilingualString(hiVal || '', 'hi');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedField }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
