import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fileToDataUrl, compressImageIfNeeded, extractOrderFromImage, ExtractedOrderData } from '../utils/geminiOrderExtractor';

interface AIOrderImageUploadProps {
  onExtractionSuccess: (data: ExtractedOrderData, imagePreviewUrl?: string) => void;
  authHeader?: string;
  className?: string;
}

export const AIOrderImageUpload: React.FC<AIOrderImageUploadProps> = ({
  onExtractionSuccess,
  authHeader,
  className = '',
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<string>('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setExtractError('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    setExtractError(null);
    setExtractSuccess(false);
    setImageFileName(file.name);

    try {
      setExtractStatus('Preparing image...');
      const rawDataUrl = await fileToDataUrl(file);
      const optimizedDataUrl = await compressImageIfNeeded(rawDataUrl);
      setSelectedImage(optimizedDataUrl);
      
      // Automatically trigger extraction once image is selected
      triggerExtraction(optimizedDataUrl);
    } catch (err: any) {
      console.error('Image loading error:', err);
      setExtractError('Failed to read image. Please select another file.');
    }
  }, []);

  const triggerExtraction = async (imageDataUrl: string) => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);

    try {
      setExtractStatus('Analyzing order with Gemini AI (3.6 Flash)...');
      const data = await extractOrderFromImage(imageDataUrl, authHeader);
      
      setExtractStatus('Order details extracted successfully!');
      setExtractSuccess(true);
      
      // Short delay for visual feedback before notifying parent
      setTimeout(() => {
        onExtractionSuccess(data, imageDataUrl);
      }, 500);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractError(err.message || 'Could not extract details. You can retry or switch to manual entry.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) handleProcessFile(file);
          break;
        }
      }
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageFileName('');
    setExtractError(null);
    setExtractSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onPaste={handlePaste}
      className={`space-y-3 ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {!selectedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Upload Order Photo or WhatsApp Screenshot
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Drag and drop from local storage, click to browse, or paste (Ctrl + V)
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Auto-extracts Name, Phone, Address, Plants & Prices with Gemini AI</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          {/* Image header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800 truncate">
                {imageFileName || 'Order Screenshot'}
              </span>
            </div>
            {!isExtracting && (
              <button
                type="button"
                onClick={handleClearImage}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 p-1 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
                <span>Change Image</span>
              </button>
            )}
          </div>

          {/* Image preview & scan status overlay */}
          <div className="relative rounded-xl overflow-hidden max-h-56 bg-slate-900/5 border border-slate-200 flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Uploaded Order"
              className={`max-h-56 w-auto object-contain transition-opacity duration-300 ${
                isExtracting ? 'opacity-40 blur-[1px]' : 'opacity-100'
              }`}
            />

            {/* Scanning radar line animation */}
            {isExtracting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
                <div className="w-10 h-10 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin mb-3" />
                <p className="text-white text-xs font-black drop-shadow-md text-center">
                  {extractStatus || 'Analyzing with Gemini AI...'}
                </p>
                <p className="text-emerald-200 text-[10.5px] mt-1 font-medium">
                  Extracting customer details, plants and prices...
                </p>
              </div>
            )}

            {extractSuccess && (
              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Details Extracted</span>
              </div>
            )}
          </div>

          {/* Manual Re-trigger if error occurred */}
          {extractError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
              <div className="flex items-start gap-2 text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{extractError}</span>
              </div>
              <button
                type="button"
                onClick={() => selectedImage && triggerExtraction(selectedImage)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Gemini Extraction</span>
              </button>
            </div>
          )}

          {!isExtracting && !extractError && (
            <button
              type="button"
              onClick={() => selectedImage && triggerExtraction(selectedImage)}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Re-scan this Image with Gemini AI</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
