const fs = require('fs');

const file = fs.readFileSync('frontend/src/pages/admin/festivals/form.tsx', 'utf8');

const regex = /<div className=\{activeLanguage === 'translation' \? 'block space-y-6' : 'hidden'\}>[\s\S]*?(?=<\/div>\n\s*\{\/\* RIGHT COLUMN)/;

const newBlock = `<div className={activeLanguage === 'translation' ? 'block space-y-6' : 'hidden'}>
                  <TranslationPanel
                    contentType="FESTIVAL"
                    contentId={id || 'new'}
                    sourceLang="hi"
                    targetLang="en"
                    hasTranslation={!!watch('name_en') || !!watch('shortDescription_en' as any) || !!watch('content_en' as any)}
                    isOutdated={!!(dirtyFields.name || dirtyFields.shortDescription || dirtyFields.content)}
                    originalContent={{
                      name: watch('name'),
                      short_description: watch('shortDescription'),
                      content: watch('content'),
                      seo_title: watch('seoTitle'),
                      seo_description: watch('seoDescription')
                    }}
                    onGenerateLive={(t) => {
                      setValue('name_en' as any, t.name || '');
                      setValue('shortDescription_en' as any, t.short_description || '');
                      setValue('content_en' as any, t.content || '');
                      setValue('seoTitle_en' as any, t.seo_title || '');
                      setValue('seoDescription_en' as any, t.seo_description || '');
                    }}
                  />

                  {!(!!watch('name_en') || !!watch('shortDescription_en' as any) || !!watch('content_en' as any)) ? (
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-12 text-center">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">English Translation</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">No English translation has been generated yet.<br/>Generate an English version of this Festival from the Hindi original.</p>
                      {/* Note: Generate button is in the TranslationPanel header now */}
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Festival Name *</label>
                          <input 
                            {...register('name_en' as any, { required: 'Translated Name is required' })}
                            className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium"
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
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">
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
                      </div>
                    </>
                  )}
                </div>`;

fs.writeFileSync('frontend/src/pages/admin/festivals/form.tsx', file.replace(regex, newBlock));
