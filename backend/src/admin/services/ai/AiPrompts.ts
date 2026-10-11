export interface PromptPayload {
  systemPrompt: string;
  prompt: string;
  maxTokens?: number;
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
3. उत्तर केवल शुद्ध, विनम्र एवं प्रेरणादायी हिंदी में दें (लगभग 150-250 शब्द)। केवल भावार्थ लिखें, कोई अतिरिक्त अभिवादन या भूमिका न जोड़ें।`,
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
   * Improves grammar and readability of article content while strictly preserving meaning and terminology.
   */
  static articleGrammar(article: { title: string; content: string }): PromptPayload {
    return {
      systemPrompt:
        'You are a senior proofreader and copy editor specializing in Sanatan Dharma and philosophical literature. Improve grammar, spelling, punctuation, and flow while strictly preserving authentic devotional terminology, scriptural names, and original theological meaning.',
      prompt: `Please proofread and improve the grammar and readability of the following article excerpt/content:

Title: "${article.title}"

Content:
${article.content.slice(0, 3000)}

Instructions:
1. Fix any spelling or grammatical errors.
2. Smooth out awkward sentences while strictly maintaining the spiritual tone and terms.
3. If HTML tags are present (like <p>, <strong>), preserve them cleanly.
4. Output ONLY the polished content directly.`,
      maxTokens: 1500
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
   */
  static seoMetadata(
    contentType: string,
    item: { title?: string; name?: string; content?: string; description?: string; lyrics?: string }
  ): PromptPayload {
    const title = item.title || item.name || '';
    const bodyContext = (item.content || item.description || item.lyrics || '').replace(/<[^>]*>/g, '').slice(0, 1500);

    return {
      systemPrompt:
        'You are an SEO metadata specialist for a sacred Sanatan Dharma portal (Aradhna Marg). You output strictly valid JSON with "seo_title" and "seo_description" properties.',
      prompt: `Generate an SEO title and meta description for this ${contentType}:

Title/Name: "${title}"
Context:
${bodyContext}

Requirements:
1. "seo_title": Compelling and accurate, between 40 and 60 characters long. Include key devotional keywords naturally.
2. "seo_description": Clear, high-click-through summary between 120 and 155 characters long. No keyword stuffing.
3. Language must match the content (Hindi if context is Hindi, English if context is English).
4. Output strictly a JSON object in this exact format:
{
  "seo_title": "your generated title",
  "seo_description": "your generated meta description"
}`,
      maxTokens: 250,
      responseFormatJson: true
    };
  }

  /**
   * Improves content quality, grammar, flow, and devotional eloquence for supported website content.
   * Safety rules:
   * 1. Strictly preserves sacred scriptural terminology, mantras, and traditional reverence.
   * 2. Preserves HTML structure and tags (<p>, <strong>, <em>, etc.) if present in the source text.
   * 3. NEVER modifies sacred verses or lyrics.
   */
  static contentQualityImprovement(item: {
    entityType: string;
    field: string;
    title: string;
    currentContent?: string;
  }): PromptPayload {
    const rawContent = item.currentContent || '';
    const isEnglish = item.field.endsWith('_en');

    if (isEnglish) {
      return {
        systemPrompt:
          'You are a senior proofreader and copy editor specializing in Sanatan Dharma, spiritual literature, and sacred philosophy in English. Improve grammar, punctuation, flow, and clarity while preserving authentic Sanskrit terminology, deity names, and traditional theological reverence.',
        prompt: `Please improve the quality, grammar, and readability of this ${item.entityType} ${item.field}:

Title: "${item.title}"

Current Content:
${rawContent.slice(0, 3500)}

Instructions:
1. Fix any spelling, punctuation, or grammatical errors.
2. Enhance sentence flow and readability while maintaining authentic devotional tone.
3. If HTML tags (such as <p>, <strong>, <h3>, <ul>, <li>) are present in the text, preserve them cleanly.
4. Output ONLY the polished content directly without meta comments or intro labels.`,
        maxTokens: 1500
      };
    }

    return {
      systemPrompt:
        'आप सनातन धर्म, वैदिक साहित्य और आध्यात्मिक दर्शन के वरिष्ठ संपादक व शोधार्थी हैं। आपका कार्य सामग्री की व्याकरणिक शुद्धता, भाषा प्रवाह, और भक्तिमय गरिमा को निखारना है। पारंपरिक देव-नाम, श्लोक व आध्यात्मिक पारिभाषिक शब्दों की पवित्रता को अक्षुण्ण रखें।',
      prompt: `कृपया निम्नलिखित ${item.entityType} के "${item.field}" की गुणवत्ता, व्याकरण और भक्तिमय भाषा-प्रवाह को परिष्कृत कीजिए:

शीर्षक: "${item.title}"

वर्तमान सामग्री:
${rawContent.slice(0, 3500)}

आवश्यक निर्देश:
1. वर्तनी (spelling), व्याकरण और विराम-चिह्नों की त्रुटियाँ सुधारें।
2. भाषा को सरल, शुद्ध, गरिमापूर्ण और भक्तिमय बनाएं।
3. यदि मूल पाठ में HTML टैग्स (जैसे <p>, <strong>, <h3> आदि) विद्यमान हैं, तो उन्हें यथावत सुरक्षित रखें।
4. उत्तर में केवल परिष्कृत सामग्री ही प्रस्तुत करें, कोई अतिरिक्त भूमिका या टिप्पणी न जोड़ें।`,
      maxTokens: 1500
    };
  }
}
