export interface PromptPayload {
  systemPrompt: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  responseFormatJson?: boolean;
}

export class AiPrompts {
  /**
   * Explains devotional and spiritual meaning of a Bhajan.
   * Safety rule: NEVER modifies lyrics.
   */
  static bhajanMeaning(bhajan: { title: string; lyrics?: string; description?: string }): PromptPayload {
    const lyricsContext = bhajan.lyrics
      ? `\n\nभजन के बोल (Lyrics):\n${bhajan.lyrics.replace(/<[^>]*>/g, '').slice(0, 2000)}`
      : '';

    return {
      systemPrompt:
        'आप सनातन धर्म, वैदिक भक्ति परंपरा और आध्यात्मिक भजनों के एक प्रबुद्ध विद्वान हैं। आपका कार्य भजन का पावन आध्यात्मिक व भक्तिमय भावार्थ सरल, शुद्ध और भक्तिमय हिंदी में प्रस्तुत करना है। किसी काल्पनिक ग्रंथ या श्लोक का मनगढ़ंत संदर्भ न जोड़ें और मूल बोल को कभी न बदलें।',
      prompt: `कृपया निम्नलिखित भजन का पावन भावार्थ (Devotional & Spiritual Meaning) विस्तार से समझाइए।

भजन का शीर्षक: "${bhajan.title}"${lyricsContext}

आवश्यक निर्देश:
1. इस भजन का मुख्य भक्ति भाव (जैसे कृष्ण प्रेम, शिव भक्ति, राम नाम महिमा, शरणागति आदि) स्पष्ट करें।
2. इसके आध्यात्मिक संदेश और साधक के जीवन में इसके महत्व का वर्णन करें।
3. उत्तर केवल शुद्ध, विनम्र एवं प्रेरणादायी हिंदी में दें (लगभग 150-250 शब्द)।
4. मुख्य भक्ति भावों, आध्यात्मिक सिद्धांतों एवं पावन शब्दों को रेखांकित करने के लिए आवश्यकतानुसार बोल्ड (**महत्वपूर्ण शब्द**) का सुरुचिपूर्ण प्रयोग करें। केवल भावार्थ लिखें, कोई अतिरिक्त अभिवादन या भूमिका न जोड़ें।`,
      maxTokens: 600
    };
  }

  /**
   * Generates a concise summary / excerpt for an article.
   */
  static articleSummary(article: { title: string; content: string }): PromptPayload {
    const rawContent = article.content.replace(/<[^>]*>/g, '').slice(0, 3000);

    return {
      systemPrompt:
        'You are an expert editor for Sanatan Dharma literature, spiritual articles, and cultural scriptures. Your task is to craft an accurate, engaging, and concise summary of the provided text without introducing facts or claims not present in the article.',
      prompt: `Please generate a concise summary/excerpt for the following article:

Title: "${article.title}"

Article Content:
${rawContent}

Instructions:
1. Capture the core spiritual insight and message in 2 to 3 clear sentences (approx 50-80 words).
2. Write in the same language as the article (if the article is in Hindi, output pure Hindi; if in English, output pure English).
3. Output ONLY the summary text directly without introductory labels or quotes.`,
      maxTokens: 250
    };
  }

  /**
   * Improves grammar and readability of article content while strictly preserving meaning, length, and terminology.
   */
  static articleGrammar(article: { title: string; content: string }): PromptPayload {
    const rawContent = article.content || '';
    const tokenLimit = Math.min(8192, Math.max(3000, Math.ceil(rawContent.length / 2.5)));

    return {
      systemPrompt:
        'You are a senior proofreader and copy editor specializing in Sanatan Dharma, Vedic philosophy, and spiritual literature. Your role is strictly to polish grammar, spelling, punctuation, and sentence flow. YOU MUST NEVER summarize, shorten, condense, or omit sections of the original text.',
      prompt: `Please proofread and improve the grammar and readability of the following full article while preserving its complete length and substance:

Title: "${article.title}"

Full Content:
${rawContent.slice(0, 50000)}

MANDATORY EDITORIAL PRESERVATION RULES:
1. FULL SUBSTANCE PRESERVATION: Do NOT summarize, condense, or shorten this article. Maintain the full informational depth, every section, and all sacred explanations.
2. PRESERVE STRUCTURE & HEADINGS: Keep all HTML headings (<h2>, <h3>), paragraphs (<p>), emphasis (<strong>, <em>), and lists (<ul>, <li>) intact.
3. GRAMMAR & FLOW ONLY: Polish syntax, fix typos and grammatical imperfections, and enhance readability while keeping authentic Sanskrit and devotional terminology.
4. Output ONLY the polished full content directly without introductory remarks or conclusion labels.`,
      maxTokens: tokenLimit
    };
  }

  /**
   * Generates authentic festival description and significance.
   */
  static festivalDescription(festival: { name: string; content?: string }): PromptPayload {
    return {
      systemPrompt:
        'आप वैदिक पंचांग, सनातन धर्म के पावन पर्वों, व्रतों और तिथियों के प्रामाणिक मर्मज्ञ हैं। आपका उद्देश्य पर्व का धार्मिक महत्व, पूजा-विधि का सार और आध्यात्मिक फल प्रामाणिक रूप से व्यक्त करना है।',
      prompt: `कृपया निम्नलिखित पावन त्यौहार/व्रत का प्रामाणिक एवं विस्तृत विवरण (Description & Significance) तैयार करें:

त्यौहार का नाम: "${festival.name}"
${festival.content ? `उपलब्ध संदर्भ:\n${festival.content.replace(/<[^>]*>/g, '').slice(0, 1000)}` : ''}

निर्देश:
1. इस पर्व की पौराणिक पृष्ठभूमि, महत्व और पूजा के मुख्य नियमों का संक्षेप में उल्लेख करें।
2. भाषा शुद्ध, भक्तिमय और सरल हिंदी होनी चाहिए।
3. केवल तथ्यपरक एवं पारंपरिक जानकारी दें (लगभग 120-200 शब्द)। कोई मनगढ़ंत परंपरा न जोड़ें।`,
      maxTokens: 500
    };
  }

  /**
   * Generates short description for a Purana based on traditional authenticity.
   */
  static puranShortDescription(puran: { title: string; author?: string; short_description?: string }): PromptPayload {
    return {
      systemPrompt:
        'You are a scholar of the 18 Mahapuranas and Hindu scriptures. Describe the essence of the Purana faithfully according to Vedic tradition.',
      prompt: `Please provide an authentic, informative short description for:

Purana: "${puran.title}"
${puran.author ? `Tradition/Rishi: ${puran.author}` : ''}

Instructions:
1. Summarize which supreme deity is primarily extolled, the central narratives, and the spiritual wisdom contained in this Purana.
2. Write in concise, dignified Hindi (approx 80-120 words).
3. Output ONLY the short description.`,
      maxTokens: 350
    };
  }

  /**
   * Generates concise, optimal SEO Title (max 60 chars) and Meta Description (max 155 chars).
   * Enforces strict theological fidelity to the primary deity and prevents cross-deity hallucinations.
   */
  static seoMetadata(
    contentType: string,
    item: {
      title?: string;
      name?: string;
      content?: string;
      description?: string;
      lyrics?: string;
      deity?: string;
      category?: string;
      currentSeoTitle?: string;
      currentSeoDescription?: string;
      auditIssue?: string;
    }
  ): PromptPayload {
    const title = (item.title || item.name || '').trim();
    const bodyContext = (item.content || item.description || item.lyrics || '').replace(/<[^>]*>/g, '').slice(0, 1500);
    const deityInfo = item.deity ? `\nPrimary Deity / Aradhya: "${item.deity}"` : '';
    const categoryInfo = item.category ? `\nCategory: "${item.category}"` : '';

    let taskSpecificGuidance = '';
    if (item.currentSeoDescription) {
      taskSpecificGuidance += `\nExisting Meta Description (${item.currentSeoDescription.length} chars):
"${item.currentSeoDescription}"`;

      if (item.auditIssue?.includes('LONG') || item.currentSeoDescription.length > 160) {
        taskSpecificGuidance += `
CRITICAL TASK FOR DESCRIPTION:
The current meta description is too long (${item.currentSeoDescription.length} characters).
You MUST CONDENSE this existing description down to between 120 and 155 characters.
Preserve the EXACT same deity, topic, devotional tone, and meaning as the existing description.
Do NOT invent new storylines or mention different deities!`;
      } else if (item.auditIssue?.includes('SHORT') || item.currentSeoDescription.length < 40) {
        taskSpecificGuidance += `
CRITICAL TASK FOR DESCRIPTION:
The current meta description is too brief (${item.currentSeoDescription.length} characters).
Expand it to between 120 and 155 characters while strictly preserving the existing topic, deity, and theme.`;
      }
    }

    if (item.currentSeoTitle) {
      taskSpecificGuidance += `\nExisting SEO Title: "${item.currentSeoTitle}"`;
    }

    return {
      systemPrompt:
        'You are a high-precision devotional SEO specialist for a sacred Sanatan Dharma web platform (Aradhna Marg). You output strictly valid JSON with "seo_title" and "seo_description" properties. You maintain absolute theological accuracy and NEVER mix or confuse Hindu deities or traditions.',
      prompt: `Generate an optimized SEO Title and Meta Description for this ${contentType}:

Title/Name: "${title}"${deityInfo}${categoryInfo}
Context:
${bodyContext}
${taskSpecificGuidance}

MANDATORY SANATAN DHARMA ACCURACY & THEOLOGICAL FIDELITY RULES:
1. STRICT DEITY FIDELITY: Maintain total theological consistency with the specific deity, leela, or tradition of this content.
   - If dedicated to Shri Krishna / Radha / Vrindavan / Gokul, focus strictly on Krishna, Radha, Vrindavan, and Krishna-bhakti. NEVER mention Shri Ram, Lord Shiva, or other deities.
   - If dedicated to Shri Ram / Sita / Ayodhya, focus strictly on Ram, Sita, and Ram-bhakti.
   - If dedicated to Lord Shiva / Mahadev, focus strictly on Shiva, Bholenath, and Shaivism.
   - If dedicated to Hanuman, Durga, Ganesha, etc., focus strictly on that deity.
   - NEVER hallucinate or substitute unrelated deities!
2. FIDELITY TO CONTENT: The description must accurately reflect this specific composition, its emotional rasa (e.g. viraha, shringara, surrender, aarti), and key lyrical themes.
3. PRESERVE EXISTING WORK: If an existing description or title is provided, retain its core phrasing, tone, and deities while adjusting length to fit the target range.
4. TARGET LENGTH LIMITS:
   - "seo_title": Compelling and devotional, between 40 and 60 characters.
   - "seo_description": High-click-through devotional summary, strictly between 120 and 155 characters.
5. LANGUAGE: Match the content language (pure, eloquent Hindi in Devanagari script for Hindi content; English for English content).
6. Output strictly a JSON object in this exact format:
{
  "seo_title": "your generated title",
  "seo_description": "your generated meta description"
}`,
      maxTokens: 250,
      temperature: 0.15,
      responseFormatJson: true
    };
  }

  /**
   * Improves content quality, grammar, flow, and devotional eloquence for supported website content.
   * Safety rules:
   * 1. Long-form content (article.content, festival.content) is protected against summarization or truncation.
   * 2. Short-form fields (excerpts, short_descriptions) are generated to match their concise semantic purpose.
   * 3. Strictly preserves sacred scriptural terminology, mantras, and traditional reverence.
   * 4. Preserves HTML structure and tags (<p>, <strong>, <h3>, <ul>, etc.) cleanly.
   * 5. NEVER modifies sacred verses or lyrics.
   */
  static contentQualityImprovement(item: {
    entityType: string;
    field: string;
    title: string;
    currentContent?: string;
  }): PromptPayload {
    const rawContent = item.currentContent || '';
    const isEnglish = item.field.endsWith('_en');
    const normType = (item.entityType || '').toLowerCase();
    const normField = (item.field || '').toLowerCase();
    const isLongForm =
      (normType === 'article' || normType === 'festival') && (normField === 'content' || normField === 'content_en');

    // 1. Long-Form Content Improvement (Articles & Festivals)
    if (isLongForm) {
      const tokenLimit = Math.min(8192, Math.max(3000, Math.ceil(rawContent.length / 2.5)));

      if (isEnglish) {
        return {
          systemPrompt:
            'You are a senior proofreader and copy editor specializing in Sanatan Dharma, spiritual literature, and sacred philosophy in English. Your sole responsibility is to polish grammar, flow, clarity, and punctuation while preserving authentic Sanskrit terminology, deity names, and traditional theological reverence. YOU MUST NEVER summarize, shorten, condense, or omit sections.',
          prompt: `Please improve the quality, grammar, and readability of this full ${item.entityType} ${item.field} while preserving its complete length and substance:

Title: "${item.title}"

Full Current Content:
${rawContent.slice(0, 50000)}

MANDATORY EDITORIAL PRESERVATION RULES:
1. FULL SUBSTANCE PRESERVATION: Do NOT summarize, condense, or shorten this long-form content. Retain every section, fact, narrative detail, and sacred explanation.
2. PRESERVE STRUCTURE & HEADINGS: Keep all HTML headings (<h2>, <h3>), paragraphs (<p>), bold emphasis (<strong>), and lists (<ul>, <li>) intact.
3. GRAMMAR & CLARITY ONLY: Refine sentence structure, correct spelling/grammar, and improve devotional flow without discarding facts or explanations.
4. DO NOT OMIT SECTIONS: The polished output must match the approximate scope, depth, and length of the original text.
5. Output ONLY the polished full content directly without meta comments or introductory labels.`,
          maxTokens: tokenLimit
        };
      }

      return {
        systemPrompt:
          'आप सनातन धर्म, वैदिक वांग्मय और आध्यात्मिक साहित्य के वरिष्ठ संपादक व शोधार्थी हैं। आपका एकमात्र उद्देश्य सामग्री की व्याकरणिक शुद्धता, भाषा-प्रवाह और भक्तिमय गरिमा को परिष्कृत करना है। आपको आलेख को संक्षेप (summarize) करने, छोटा करने या किसी भी खंड को हटाने की सख्त मनाही है।',
        prompt: `कृपया निम्नलिखित ${item.entityType} के "${item.field}" की गुणवत्ता, व्याकरण और भक्तिमय भाषा-प्रवाह को पूर्ण विस्तार के साथ परिष्कृत कीजिए:

शीर्षक: "${item.title}"

वर्तमान संपूर्ण सामग्री (Full Substance):
${rawContent.slice(0, 50000)}

अनिवार्य संपादकीय व संरक्षण नियम (Mandatory Editorial Preservation Rules):
1. पूर्ण विस्तार व विषय-वस्तु का संरक्षण: यह एक विस्तृत एवं संपूर्ण आलेख है। इसे संक्षेप (summarize) न करें, छोटा (condense) न करें और न ही कुछ वाक्यों का सार बनाएं।
2. संरचना व उप-शीर्षकों का संरक्षण: आलेख के समस्त उप-शीर्षक (Headings जैसे <h2>, <h3>), अनुभाग, बिंदु और पौराणिक/धार्मिक संदर्भों को ज्यों का त्यों बनाए रखें।
3. केवल भाषा व प्रवाह सुधारें: वर्तनी (spelling), व्याकरण, विराम-चिह्न और वाक्य-विन्यास की त्रुटियों को दूर कर भाषा को सरल, शुद्ध, गरिमापूर्ण और प्रवाहपूर्ण बनाएं।
4. HTML संरचना: यदि मूल पाठ में HTML टैग्स (जैसे <p>, <h3>, <strong>, <ul>, <li> आदि) विद्यमान हैं, तो उन्हें यथावत सुरक्षित रखें। पूरे आलेख को एक पैराग्राफ में न बदलें।
5. सामग्री विलोपन निषेध: मूल आलेख की लंबाई और गहराई के पूर्णतः अनुरूप ही परिष्कृत आलेख प्रस्तुत करें।
6. उत्तर में केवल परिष्कृत आलेख ही दें, कोई अतिरिक्त भूमिका, शीर्षक या टिप्पणी न जोड़ें।`,
        maxTokens: tokenLimit
      };
    }

    // 2. Short-Form Content Improvement (Excerpts, Short Descriptions, Bhajan Descriptions)
    if (isEnglish) {
      return {
        systemPrompt:
          'You are a senior proofreader and devotional copy editor specializing in Sanatan Dharma literature in English. Craft concise, reverent, and informative summaries and descriptions without altering sacred names or philosophical truths.',
        prompt: `Please improve the quality, conciseness, and readability of this ${item.entityType} ${item.field}:

Title: "${item.title}"

Current Content:
${rawContent.slice(0, 4000)}

Instructions:
1. Provide a clear, engaging, and devotional ${item.field.includes('excerpt') ? 'excerpt summary (2-3 sentences)' : 'concise description'}.
2. Ensure authentic devotional tone and grammatical precision.
3. Output ONLY the polished text directly without labels or quotes.`,
        maxTokens: 500
      };
    }

    return {
      systemPrompt:
        'आप सनातन धर्म, वैदिक साहित्य और भक्ति साहित्य के वरिष्ठ संपादक हैं। आपका कार्य दिए गए विवरण या सारांश (Summary/Excerpt) को संक्षिप्त, ओजस्वी, और भक्तिमय गरिमा से परिपूर्ण बनाना है।',
      prompt: `कृपया निम्नलिखित ${item.entityType} के "${item.field}" को परिष्कृत एवं प्रभावशाली बनाइए:

शीर्षक: "${item.title}"

वर्तमान विवरण:
${rawContent.slice(0, 4000)}

आवश्यक निर्देश:
1. ${item.field.includes('excerpt') ? 'आलेख का सारगर्भित एवं आकर्षक संक्षेप (2-3 वाक्य, लगभग 40-70 शब्द)' : 'पावन, तथ्यपरक एवं गरिमापूर्ण विवरण'} तैयार करें।
2. भाषा शुद्ध, व्याकरणसम्मत और भक्तिमय होनी चाहिए।
3. उत्तर में केवल परिष्कृत पाठ ही प्रस्तुत करें, कोई अतिरिक्त भूमिका न जोड़ें।`,
      maxTokens: 500
    };
  }
}
