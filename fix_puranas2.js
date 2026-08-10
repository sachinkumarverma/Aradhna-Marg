const fs = require('fs');

function rewritePuran() {
  let file = fs.readFileSync('frontend/src/pages/admin/puranas/form.tsx', 'utf8');

  file = file.replace(/const \[isUploading, setIsUploading\] = useState\(false\);/, "const [isUploading, setIsUploading] = useState(false);\n  const [activeLanguage, setActiveLanguage] = useState<'original' | 'translation'>('original');");
  file = file.replace(/const \{ register, handleSubmit, control, watch, setValue, reset, formState: \{ errors, isValid, isDirty, defaultValues \} \} = useForm\(\{/, `const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid, isDirty, defaultValues, dirtyFields } } = useForm({`);
  
  file = file.replace(/description: '',\n\s*seo_title: '',/, `description: '',\n      title_en: '',\n      description_en: '',\n      seo_title_en: '',\n      seo_description_en: '',\n      seo_title: '',`);

  const leftColRegex = /(<div className="lg:col-span-2 space-y-6">)\s*(<div className="bg-gradient-to-br from-blue-50 to-indigo-50)/;
  const replacement = `$1
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

                <div className={activeLanguage === 'original' ? 'block space-y-6' : 'hidden'}>
                  $2`;

  file = file.replace(leftColRegex, replacement);

  const searchStr = `                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Settings & Metadata */}`;

  const replaceStr = `                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={activeLanguage === 'translation' ? 'block space-y-6' : 'hidden'}>
                  <TranslationPanel
                    contentType="PURAN"
                    contentId={id || 'new'}
                    sourceLang="hi"
                    targetLang="en"
                    hasTranslation={!!watch('title_en' as any) || !!watch('description_en' as any)}
                    isOutdated={!!(dirtyFields.title || dirtyFields.description)}
                    originalContent={{
                      title: watch('title'),
                      description: watch('description'),
                      seo_title: watch('seo_title'),
                      seo_description: watch('seo_description')
                    }}
                    onGenerateLive={(t) => {
                      setValue('title_en' as any, t.title || '');
                      setValue('description_en' as any, t.description || '');
                      setValue('seo_title_en' as any, t.seo_title || '');
                      setValue('seo_description_en' as any, t.seo_description || '');
                    }}
                  />

                  {!(!!watch('title_en' as any) || !!watch('description_en' as any)) ? (
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
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Puran Title *</label>
                          <input 
                            {...register('title_en' as any, { required: 'Translated Name is required' })}
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
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Settings & Metadata */}`;

  file = file.replace(searchStr, replaceStr);

  if (!file.includes('TranslationPanel')) {
    file = file.replace(/(import .* from 'lucide-react';)/, "$1\nimport { TranslationPanel } from '../../../features/translations/TranslationPanel';");
  }

  fs.writeFileSync('frontend/src/pages/admin/puranas/form.tsx', file);
}

rewritePuran();
