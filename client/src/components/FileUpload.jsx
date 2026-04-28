import React, { useState, useRef } from 'react';
import { Paperclip, X, FileText, Download, Image as ImageIcon, Loader } from 'lucide-react';
import api from '../api';

// ── FILE ATTACHMENT DISPLAY ─────────────────────────────────────────────────
export const FileAttachment = ({ fileUrl, fileType, originalName, mimeType }) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    if (!fileUrl) return null;

    if (fileType === 'image') {
        return (
            <div className="mt-2 max-w-[260px]">
                {!imgLoaded && (
                    <div className="w-full h-40 rounded-xl bg-black/10 flex items-center justify-center">
                        <Loader size={20} className="animate-spin text-gray-400" />
                    </div>
                )}
                <img
                    src={fileUrl}
                    alt={originalName || 'image'}
                    onLoad={() => setImgLoaded(true)}
                    className={`w-full rounded-xl object-cover cursor-pointer transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                    onClick={() => window.open(fileUrl, '_blank')}
                />
            </div>
        );
    }

    // Document
    const ext = originalName?.split('.').pop()?.toUpperCase() || 'FILE';
    const extColors = {
        PDF: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
        DOC: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        DOCX: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        PPT: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        PPTX: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        TXT: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
    };

    return (
        <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-black/10 hover:bg-black/20 transition-colors cursor-pointer max-w-[240px]"
        >
            <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${extColors[ext] || 'bg-gray-100 text-gray-600'}`}>
                {ext}
            </span>
            <span className="text-xs truncate flex-1">{originalName || 'Document'}</span>
            <Download size={13} className="shrink-0 opacity-60" />
        </a>
    );
};

// ── FILE PICKER / UPLOAD BUTTON ──────────────────────────────────────────────
export const FileUploadButton = ({ onFileReady, disabled }) => {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null); // { url, fileType, originalName, mimeType }

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileData = {
                fileUrl: res.data.url,
                fileType: res.data.fileType,
                mimeType: res.data.mimeType,
                originalName: res.data.originalName
            };
            setPreview(fileData);
            onFileReady(fileData);
        } catch (err) {
            console.error('Upload error:', err);
            alert(err.response?.data?.message || 'Upload failed. Max 10MB. Allowed: images, PDF, Word, PPT, TXT');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const clearPreview = () => {
        setPreview(null);
        onFileReady(null);
    };

    return (
        <div className="flex items-center gap-1">
            {/* Preview badge */}
            {preview && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium max-w-[120px]">
                    {preview.fileType === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                    <span className="truncate">{preview.originalName}</span>
                    <button onClick={clearPreview} className="ml-1 shrink-0 hover:text-red-400">
                        <X size={11} />
                    </button>
                </div>
            )}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || uploading}
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors disabled:opacity-40"
                title="Attach image or document"
            >
                {uploading ? <Loader size={18} className="animate-spin" /> : <Paperclip size={18} />}
            </button>

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFile}
            />
        </div>
    );
};
