const fs = require('fs');

function processFile(path, contentType, defaultVals, engFieldsHtml, updateValsCode, hasTranslationCheck) {
  let file = fs.readFileSync(path, 'utf8');

  // 1. Add TranslationPanel import
  if (!file.includes('TranslationPanel')) {
    file = file.replace(/(import .* from 'lucide-react';)/, "$1\nimport { TranslationPanel } from '../../features/translations/TranslationPanel';");
  }

  // 2. Add activeLanguage state
  file = file.replace(/const \[isUploading, setIsUploading\] = useState\(false\);/g, "const [isUploading, setIsUploading] = useState(false);\n  const [activeLanguage, setActiveLanguage] = useState<'original' | 'translation'>('original');");
  if (!file.includes('setActiveLanguage')) {
    file = file.replace(/const \[showPreview, setShowPreview\] = useState\(false\);/, "const [showPreview, setShowPreview] = useState(false);\n  const [activeLanguage, setActiveLanguage] = useState<'original' | 'translation'>('original');");
  }

  // 3. Add defaultValues to useForm
  file = file.replace(/const \{ register, handleSubmit, control, watch, setValue, reset, setError, formState: \{ errors, isValid, isDirty, defaultValues \} \} = useForm\(\{/g, `const { register, handleSubmit, control, watch, setValue, reset, setError, formState: { errors, isValid, isDirty, defaultValues, dirtyFields } } = useForm({`);
  file = file.replace(/const \{ register, handleSubmit, control, watch, setValue, reset, formState: \{ errors, isValid, isDirty, defaultValues \} \} = useForm\(\{/g, `const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid, isDirty, defaultValues, dirtyFields } } = useForm({`);
  file = file.replace(/const \{ register, handleSubmit, watch, control, setValue, reset, formState: \{ errors, isDirty, isValid, defaultValues \} \} = useForm\(\{/g, `const { register, handleSubmit, watch, control, setValue, reset, formState: { errors, isDirty, isValid, defaultValues, dirtyFields } } = useForm({`);
  
  if (contentType === 'FESTIVAL') {
    file = file.replace(/content: '',\n\s*status: 'Draft',/, `content: '',\n      name_en: '',\n      shortDescription_en: '',\n      content_en: '',\n      seoTitle_en: '',\n      seoDescription_en: '',\n      status: 'Draft',`);
  } else if (contentType === 'ARTICLE') {
    file = file.replace(/content: '',\n\s*seo_title: '',/, `content: '',\n      title_en: '',\n      excerpt_en: '',\n      content_en: '',\n      seo_title_en: '',\n      seo_description_en: '',\n      seo_title: '',`);
  } else if (contentType === 'PURAN') {
    file = file.replace(/description: '',\n\s*seo_title: '',/, `description: '',\n      title_en: '',\n      description_en: '',\n      seo_title_en: '',\n      seo_description_en: '',\n      seo_title: '',`);
  }

  // 4. Wrap left column in activeLanguage === 'original'
  const leftColRegex = /(<div className="lg:col-span-2 space-y-6">)/;
  const replacement1 = `$1
                {/* Language Switcher Tabs */}
                <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                  <button
                      type="button"
                      onClick={() => setActiveLanguage('original')}
                      className={\`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all \${
                        activeLanguage === 'original'
                          ? 'bg-white text-saffron shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }\`}
                    >
                      Hindi (Original)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLanguage('translation')}
                      className={\`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all flex justify-center items-center gap-2 \${
                        activeLanguage === 'translation'
                          ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }\`}
                    >
                      English (Translation)
                  </button>
                </div>

                <div className={activeLanguage === 'original' ? 'block space-y-6' : 'hidden'}>`;
  
  file = file.replace(leftColRegex, replacement1);

  // 5. Find RIGHT COLUMN and insert engBlock before the </div> that precedes it.
  const rightColIndex = file.indexOf('{/* RIGHT COLUMN: Settings & Metadata */}');
  const beforeRightCol = file.slice(0, rightColIndex);
  const afterRightCol = file.slice(rightColIndex);
  
  // Find the LAST </div> before rightColIndex
  const lastDivIndex = beforeRightCol.lastIndexOf('</div>');
  
  const beforeLastDiv = beforeRightCol.slice(0, lastDivIndex);
  // The '</div>' that we are replacing is the one that closed `lg:col-span-2 space-y-6`.
  // Wait! The `lg:col-span-2` is closed by the LAST </div>!
  // So we just need to close our `activeLanguage === 'original'` div right BEFORE it.
  // Then we open our `activeLanguage === 'translation'` div right after it.
  // Then we close our `activeLanguage === 'translation'` div.
  // THEN the original LAST </div> will close `lg:col-span-2`.
  
  const engBlock = `</div>

                <div className={activeLanguage === 'translation' ? 'block space-y-6' : 'hidden'}>
                  <TranslationPanel
                    contentType="${contentType}"
                    contentId={id || 'new'}
                    sourceLang="hi"
                    targetLang="en"
                    hasTranslation={${hasTranslationCheck}}
                    isOutdated={${contentType === 'FESTIVAL' ? '!!(dirtyFields.name || dirtyFields.shortDescription || dirtyFields.content)' : contentType === 'ARTICLE' ? '!!(dirtyFields.title || dirtyFields.excerpt || dirtyFields.content)' : '!!(dirtyFields.title || dirtyFields.description)'}}
                    originalContent={{
                      ${contentType === 'FESTIVAL' ? 'name: watch("name"), short_description: watch("shortDescription"), content: watch("content"), seo_title: watch("seoTitle"), seo_description: watch("seoDescription")' : contentType === 'ARTICLE' ? 'title: watch("title"), excerpt: watch("excerpt"), content: watch("content"), seo_title: watch("seo_title"), seo_description: watch("seo_description")' : 'title: watch("title"), description: watch("description"), seo_title: watch("seo_title"), seo_description: watch("seo_description")'}
                    }}
                    onGenerateLive={(t) => {
                      ${updateValsCode}
                    }}
                  />

                  {!(${hasTranslationCheck}) ? (
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-12 text-center">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">English Translation</h3>
                      <p className="text-gray-500 max-w-md mx-auto">No English translation has been generated yet.<br/>Click "Generate English Translation" above to start.</p>
                    </div>
                  ) : (
                    <>
                      ${engFieldsHtml}
                    </>
                  )}
                </div>
              `;
              
  file = beforeLastDiv + engBlock + '\n</div>\n              ' + afterRightCol;

  fs.writeFileSync(path, file);
}

// FESTIVAL
const festivalEngFields = `<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Festival Name *</label>
                          <input 
                            {...register('name_en' as any, { required: 'Name is required' })}
                            className={\`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium \${(errors as any).name_en ? 'border-red-500' : 'border-blue-100'}\`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Short Description</label>
                          <textarea 
                            {...register('shortDescription_en' as any)}
                            rows={2}
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Festival Details</h3>
                        <Controller
                          name={"content_en" as any}
                          control={control}
                          render={({ field }) => (
                            <div>
                              <ReactQuill 
                                theme="snow"
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="bg-white rounded-b-md"
                                modules={{
                                  toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                    [{'list': 'ordered'}, {'list': 'bullet'}],
                                    ['link', 'image'],
                                    ['clean']
                                  ],
                                }}
                              />
                            </div>
                          )}
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b border-blue-100">
                          Advanced SEO
                        </div>
                        
                        <div className="p-6 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                            <input 
                              {...register('seoTitle_en' as any)}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Meta Description</label>
                            <textarea 
                              {...register('seoDescription_en' as any)}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                        </div>
                      </div>`;
const festivalUpdateVals = `setValue('name_en' as any, t.name || '');
                      setValue('shortDescription_en' as any, t.short_description || '');
                      setValue('content_en' as any, t.content || '');
                      setValue('seoTitle_en' as any, t.seo_title || '');
                      setValue('seoDescription_en' as any, t.seo_description || '');`;
const festivalCheck = `!!watch('name_en' as any) || !!watch('shortDescription_en' as any) || !!watch('content_en' as any)`;
processFile('frontend/src/pages/admin/festivals/form.tsx', 'FESTIVAL', null, festivalEngFields, festivalUpdateVals, festivalCheck);


// ARTICLE
const articleEngFields = `<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Article Title *</label>
                          <input 
                            {...register('title_en' as any, { required: 'Title is required' })}
                            className={\`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium \${(errors as any).title_en ? 'border-red-500' : 'border-blue-100'}\`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Excerpt</label>
                          <textarea 
                            {...register('excerpt_en' as any)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Content</h3>
                        <Controller
                          name={"content_en" as any}
                          control={control}
                          render={({ field }) => (
                            <div>
                              <ReactQuill 
                                theme="snow"
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="bg-white rounded-b-md"
                                modules={{
                                  toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                    [{'list': 'ordered'}, {'list': 'bullet'}],
                                    ['link', 'image'],
                                    ['clean']
                                  ],
                                }}
                              />
                            </div>
                          )}
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b border-blue-100">
                          Advanced SEO
                        </div>
                        
                        <div className="p-6 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                            <input 
                              {...register('seo_title_en' as any)}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Description</label>
                            <textarea 
                              {...register('seo_description_en' as any)}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                        </div>
                      </div>`;
const articleUpdateVals = `setValue('title_en' as any, t.title || '');
                      setValue('excerpt_en' as any, t.excerpt || '');
                      setValue('content_en' as any, t.content || '');
                      setValue('seo_title_en' as any, t.seo_title || '');
                      setValue('seo_description_en' as any, t.seo_description || '');`;
const articleCheck = `!!watch('title_en' as any) || !!watch('excerpt_en' as any) || !!watch('content_en' as any)`;
processFile('frontend/src/pages/admin/articles/form.tsx', 'ARTICLE', null, articleEngFields, articleUpdateVals, articleCheck);


// PURAN
const puranEngFields = `<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Puran Title *</label>
                          <input 
                            {...register('title_en' as any, { required: 'Title is required' })}
                            className={\`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium \${(errors as any).title_en ? 'border-red-500' : 'border-blue-100'}\`}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Puran Description</h3>
                        <Controller
                          name={"description_en" as any}
                          control={control}
                          render={({ field }) => (
                            <div>
                              <ReactQuill 
                                theme="snow"
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="bg-white rounded-b-md"
                                modules={{
                                  toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                    [{'list': 'ordered'}, {'list': 'bullet'}],
                                    ['link', 'image'],
                                    ['clean']
                                  ],
                                }}
                              />
                            </div>
                          )}
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b border-blue-100">
                          Advanced SEO
                        </div>
                        
                        <div className="p-6 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                            <input 
                              {...register('seo_title_en' as any)}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Meta Description</label>
                            <textarea 
                              {...register('seo_description_en' as any)}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                        </div>
                      </div>`;
const puranUpdateVals = `setValue('title_en' as any, t.title || '');
                      setValue('description_en' as any, t.description || '');
                      setValue('seo_title_en' as any, t.seo_title || '');
                      setValue('seo_description_en' as any, t.seo_description || '');`;
const puranCheck = `!!watch('title_en' as any) || !!watch('description_en' as any)`;
processFile('frontend/src/pages/admin/puranas/form.tsx', 'PURAN', null, puranEngFields, puranUpdateVals, puranCheck);

