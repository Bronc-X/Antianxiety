'use client';

import * as React from 'react';
import { Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

interface ImageUploadProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    disabled?: boolean;
}

export function ImageUploadButton({
    onFilesSelected,
    maxFiles = 4,
    disabled
}: ImageUploadProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            // Simple validation: check if image
            const validFiles = files.filter(f => f.type.startsWith('image/'));
            if (validFiles.length > 0) {
                onFilesSelected(validFiles.slice(0, maxFiles));
            }
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={disabled}
            />
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                type="button"
            >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Upload images</span>
            </Button>
        </>
    );
}

interface ImagePreviewListProps {
    files: File[];
    onRemove: (index: number) => void;
}

export function ImagePreviewList({ files, onRemove }: ImagePreviewListProps) {
    if (files.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto py-2 px-1 max-w-full no-scrollbar">
            <AnimatePresence initial={false}>
                {files.map((file, index) => (
                    <PreviewItem key={`${file.name}-${index}`} file={file} onRemove={() => onRemove(index)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function PreviewItem({ file, onRemove }: { file: File; onRemove: () => void }) {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative flex-shrink-0 group"
        >
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/20 bg-black/20">
                {previewUrl ? (
                    <Image
                        src={previewUrl}
                        alt={file.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-white/40" />
                    </div>
                )}
                <button
                    onClick={onRemove}
                    className="absolute -top-1 -right-1 rounded-full bg-red-500/90 p-0.5 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    type="button"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        </motion.div>
    );
}
