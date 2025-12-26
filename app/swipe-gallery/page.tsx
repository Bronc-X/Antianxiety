import React from 'react';
import { SwipeDesign1 } from '@/components/marketing/SwipeDesign1';
import { SwipeDesign2 } from '@/components/marketing/SwipeDesign2';
import { SwipeDesign3 } from '@/components/marketing/SwipeDesign3';

export default function SwipeGalleryPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-20">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Viral Swipe Files</h1>
            <p className="mb-12 text-gray-500">Interact to reveal easter eggs. Screenshot to share.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                {/* Card 1 */}
                <div className="flex flex-col items-center gap-4">
                    <div className="shadow-2xl rounded-[40px] overflow-hidden border-8 border-gray-900 bg-black box-content">
                        <SwipeDesign1 />
                    </div>
                    <p className="text-sm font-bold text-gray-400">style: THE INVISIBLE WAR</p>
                </div>

                {/* Card 2 */}
                <div className="flex flex-col items-center gap-4">
                    <div className="shadow-2xl rounded-[40px] overflow-hidden border-8 border-gray-900 bg-[#1A2621] box-content">
                        <SwipeDesign2 />
                    </div>
                    <p className="text-sm font-bold text-gray-400">style: CIRCADIAN EMERALD</p>
                </div>

                {/* Card 3 */}
                <div className="flex flex-col items-center gap-4">
                    <div className="shadow-2xl rounded-[40px] overflow-hidden border-8 border-gray-900 bg-[#E8E9EC] box-content">
                        <SwipeDesign3 />
                    </div>
                    <p className="text-sm font-bold text-gray-400">style: CRYSTAL CLARITY</p>
                </div>
            </div>
        </div>
    );
}
