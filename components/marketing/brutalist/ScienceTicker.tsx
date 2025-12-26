'use client';

export default function ScienceTicker() {
    const journals = [
        'Nature',
        'The Lancet',
        'Cell',
        'NEJM',
        'JAMA',
        'Science',
        'PNAS',
        'BMJ',
    ];

    // Duplicate for seamless loop
    const allJournals = [...journals, ...journals];

    return (
        <section className="brutalist-section-compact overflow-hidden">
            <div className="mb-6 text-center">
                <span className="brutalist-body uppercase tracking-[0.3em] text-[#888]">
                    Powered by peer-reviewed research from
                </span>
            </div>

            <div className="brutalist-marquee">
                <div className="brutalist-marquee-content">
                    {allJournals.map((journal, index) => (
                        <span
                            key={index}
                            className="brutalist-serif text-2xl md:text-3xl text-[#555] hover:text-white transition-colors px-8 cursor-default"
                        >
                            {journal}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
