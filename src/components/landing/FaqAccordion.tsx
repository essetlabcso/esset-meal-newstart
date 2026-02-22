"use client";

import { useState } from "react";
import type { FaqItem } from "@/components/landing/content";

type FaqAccordionProps = {
    items: FaqItem[];
};

export default function FaqAccordion({ items }: FaqAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number>(0);

    return (
        <div className="space-y-3">
            {items.map((item, index) => {
                const isOpen = openIndex === index;
                const triggerId = `faq-trigger-${index}`;
                const panelId = `faq-panel-${index}`;

                return (
                    <article key={item.question} className="rounded-2xl border border-esset-border bg-white">
                        <h3>
                            <button
                                id={triggerId}
                                type="button"
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-base font-semibold text-esset-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esset-focus"
                            >
                                <span>{item.question}</span>
                                <span
                                    aria-hidden
                                    className={`text-esset-teal-800 transition-transform ${isOpen ? "rotate-45" : ""}`}
                                >
                                    +
                                </span>
                            </button>
                        </h3>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={triggerId}
                            className={`grid transition-all ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                        >
                            <div className="overflow-hidden">
                                <p className="px-4 pb-4 text-sm leading-relaxed text-esset-muted">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
