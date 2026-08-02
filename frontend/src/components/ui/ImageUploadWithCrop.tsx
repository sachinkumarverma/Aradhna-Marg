import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@utils/cropImage';
import { createPortal } from 'react-dom';
import { ImageIcon, Check, X, Crop as CropIcon, Eye } from 'lucide-react';

interface ImageUploadWithCropProps {
  value?: string;
  onChange: (value: string, file: File) => void;
  onRemove?: () => void;
  aspectRatio?: number;
  shape?: 'rect' | 'round';
  className?: string;
  placeholder?: string;
}

export function ImageUploadWithCrop({
  value,
  onChange,
  onRemove,
  aspectRatio = 1,
  shape = 'rect',
  className = '',
  placeholder = 'Upload'
}: ImageUploadWithCropProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropping(true);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedImageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string, croppedImageFile as File);
          setIsCropping(false);
          setImageSrc(null);
        };
        reader.readAsDataURL(croppedImageFile);
      }
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels, onChange]);

  const cancelCrop = () => {
    setIsCropping(false);
    setImageSrc(null);
  };

  const defaultClassName = className || "w-full h-48 rounded-md border-2 border-dashed border-gray-300 hover:border-saffron transition-colors";

  return (
    <>
      <div className={`relative group overflow-hidden ${defaultClassName} ${!value ? 'cursor-pointer' : ''}`}>
        {!value && (
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={onFileChange}
            title=""
          />
        )}
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 gap-3 pointer-events-none">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  if (value.startsWith('data:')) {
                    const w = window.open('');
                    if (w) w.document.write(`<img src="${value}" style="max-width: 100%; max-height: 100%; display: block; margin: auto;" />`);
                  } else {
                    window.open(value, '_blank');
                  }
                }}
                className="p-2.5 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100 cursor-pointer pointer-events-auto transform hover:scale-105 transition-transform" title="Preview"
              >
                <Eye className="w-5 h-5" />
              </button>
              {onRemove && (
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }} 
                  className="p-2.5 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100 cursor-pointer pointer-events-auto transform hover:scale-105 transition-transform" title="Discard"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 group-hover:text-saffron transition-colors z-0">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs font-medium">{placeholder}</span>
          </div>
        )}
      </div>

      {isCropping && imageSrc && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <CropIcon className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Crop Image</h3>
              </div>
              <button onClick={cancelCrop} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full bg-gray-900" style={{ height: '50vh', minHeight: '400px' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                cropShape={shape}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 bg-white flex items-center justify-between border-t border-gray-100">
              <div className="flex-1 mr-8">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-saffron"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={cancelCrop}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showCroppedImage}
                  className="px-6 py-2 bg-saffron text-white rounded-md font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.readAsDataURL(file);
  });
}
