"use client";

import { useEffect, useMemo, useState } from "react";
import { REALITY_CHECK_QUESTIONS } from "@/components/landing/content";

export const REALITY_CHECK_STORAGE_KEY = "esset_reality_check_v1";

type StoredAssessmentState = {
    version: 1;
    answers: Array<number | null>;
    currentIndex: number;
    updatedAt: string;
};

type AssessmentState = {
    answers: Array<number | null>;
    currentIndex: number;
};

const OPTION_SET = [
    { value: 0, label: "Never true" },
    { value: 1, label: "Sometimes true" },
    { value: 2, label: "Often true" },
    { value: 3, label: "Almost always true" },
] as const;

function createDefaultState(): AssessmentState {
    return {
        answers: Array(REALITY_CHECK_QUESTIONS.length).fill(null),
        currentIndex: 0,
    };
}

function normalizeAnswers(value: unknown): Array<number | null> | null {
    if (!Array.isArray(value) || value.length !== REALITY_CHECK_QUESTIONS.length) {
        return null;
    }

    return value.map((item) => {
        if (item === null) {
            return null;
        }
        if (typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 3) {
            return item;
        }
        return null;
    });
}

function readStoredState(): AssessmentState {
    if (typeof window === "undefined") {
        return createDefaultState();
    }

    try {
        const raw = window.localStorage.getItem(REALITY_CHECK_STORAGE_KEY);
        if (!raw) {
            return createDefaultState();
        }
        const parsed = JSON.parse(raw) as Partial<StoredAssessmentState>;
        const restoredAnswers = normalizeAnswers(parsed.answers);
        const restoredIndex =
            typeof parsed.currentIndex === "number"
                ? Math.min(Math.max(parsed.currentIndex, 0), REALITY_CHECK_QUESTIONS.length)
                : 0;

        return {
            answers: restoredAnswers ?? createDefaultState().answers,
            currentIndex: restoredIndex,
        };
    } catch {
        return createDefaultState();
    }
}

function scoreToCategory(score: number) {
    if (score <= 11) {
        return {
            label: "Calm",
            toneClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
            summary: "You already have a stable baseline. Focus on keeping consistency.",
            nextSteps: [
                "Keep weekly evidence capture routines and role ownership clear.",
                "Track assumptions and decisions so adaptation stays explainable.",
                "Use reporting packs monthly to avoid deadline pressure.",
            ],
        };
    }

    if (score <= 23) {
        return {
            label: "Needs structure",
            toneClass: "bg-amber-50 text-amber-900 border-amber-200",
            summary: "Your team has good foundations, but workflows are still fragmented.",
            nextSteps: [
                "Create one shared project map and link indicators to each outcome.",
                "Standardize partner submission templates and review cadence.",
                "Document decisions with evidence references after each review.",
            ],
        };
    }

    return {
        label: "High risk",
        toneClass: "bg-red-50 text-red-800 border-red-200",
        summary: "Reporting pressure is likely masking learning and adaptation opportunities.",
        nextSteps: [
            "Start with one pilot project and move evidence capture to weekly rhythm.",
            "Assign clear roles for data entry, review, and reporting sign-off.",
            "Use one shared workspace to replace fragmented reporting files.",
        ],
    };
}

export default function RealityCheckTool() {
    const [state, setState] = useState<AssessmentState>(() => readStoredState());
    const answers = state.answers;
    const currentIndex = state.currentIndex;

    const isComplete = currentIndex >= REALITY_CHECK_QUESTIONS.length;
    const currentQuestion = REALITY_CHECK_QUESTIONS[currentIndex] ?? null;
    const answeredCount = answers.filter((answer) => answer !== null).length;

    const totalScore = useMemo(
        () => answers.reduce<number>((sum, value) => sum + (value ?? 0), 0),
        [answers],
    );
    const category = scoreToCategory(totalScore);

    useEffect(() => {
        const payload: StoredAssessmentState = {
            version: 1,
            answers,
            currentIndex,
            updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(REALITY_CHECK_STORAGE_KEY, JSON.stringify(payload));
    }, [answers, currentIndex]);

    function selectAnswer(value: number) {
        setState((current) => {
            const nextAnswers = [...current.answers];
            nextAnswers[current.currentIndex] = value;
            return { ...current, answers: nextAnswers };
        });
    }

    function goNext() {
        if (isComplete) {
            return;
        }
        setState((current) => ({
            ...current,
            currentIndex: Math.min(current.currentIndex + 1, REALITY_CHECK_QUESTIONS.length),
        }));
    }

    function goBack() {
        setState((current) => ({
            ...current,
            currentIndex: Math.max(current.currentIndex - 1, 0),
        }));
    }

    function resetAssessment() {
        const nextState = createDefaultState();
        setState(nextState);
        window.localStorage.removeItem(REALITY_CHECK_STORAGE_KEY);
    }

    const currentAnswer = currentQuestion ? answers[currentIndex] : null;
    const progressPercent = Math.round((answeredCount / REALITY_CHECK_QUESTIONS.length) * 100);

    return (
        <section className="esset-card space-y-5 p-5 sm:p-7">
            <header className="space-y-2">
                <h3 className="text-2xl font-extrabold text-esset-ink">
                    Take the 5-minute Reality Check
                </h3>
                <p className="text-sm text-esset-muted">
                    12 questions. Around 4–6 minutes. Saved only in your browser. Nothing is
                    uploaded.
                </p>
            </header>

            <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-esset-border">
                <div
                    className="h-full rounded-full bg-esset-teal-800 transition-all"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <p className="text-sm font-semibold text-esset-muted">
                {isComplete
                    ? `Assessment complete (${answeredCount}/${REALITY_CHECK_QUESTIONS.length})`
                    : `Question ${currentIndex + 1}/${REALITY_CHECK_QUESTIONS.length}`}
            </p>

            {!isComplete && currentQuestion ? (
                <div className="space-y-4">
                    <fieldset className="space-y-3">
                        <legend className="text-base font-semibold text-esset-ink">
                            {currentQuestion.prompt}
                        </legend>
                        <div className="space-y-2">
                            {OPTION_SET.map((option) => {
                                const checked = currentAnswer === option.value;
                                return (
                                    <label
                                        key={option.value}
                                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-esset-focus ${
                                            checked
                                                ? "border-esset-teal-800 bg-esset-bg text-esset-teal-800"
                                                : "border-esset-border bg-white text-esset-ink hover:bg-esset-bg"
                                        }`}
                                    >
                                        <span>{option.label}</span>
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestion.id}`}
                                            value={option.value}
                                            checked={checked}
                                            onChange={() => selectAnswer(option.value)}
                                            className="h-4 w-4 accent-esset-teal-800"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={currentIndex === 0}
                            className="rounded-[14px] border border-esset-border bg-white px-4 py-2 text-sm font-semibold text-esset-ink hover:bg-esset-bg disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={currentAnswer === null}
                            className="esset-btn-primary rounded-[14px] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {currentIndex === REALITY_CHECK_QUESTIONS.length - 1
                                ? "See results"
                                : "Next"}
                        </button>
                        <button
                            type="button"
                            onClick={resetAssessment}
                            className="ml-auto rounded-[14px] border border-esset-border bg-white px-4 py-2 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                        >
                            Reset assessment
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 rounded-2xl border border-esset-border bg-esset-bg p-4">
                    <p
                        className={`w-fit rounded-full border px-3 py-1 text-sm font-bold ${category.toneClass}`}
                    >
                        {category.label}
                    </p>
                    <p className="text-sm font-semibold text-esset-ink">
                        Score: {totalScore} / {REALITY_CHECK_QUESTIONS.length * 3}
                    </p>
                    <p className="text-sm text-esset-muted">{category.summary}</p>

                    <div>
                        <p className="text-sm font-bold text-esset-ink">Recommended next steps</p>
                        <ul className="mt-2 space-y-1 text-sm text-esset-muted">
                            {category.nextSteps.map((step) => (
                                <li key={step}>- {step}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setState((current) => ({
                                    ...current,
                                    currentIndex: Math.max(
                                        Math.min(current.currentIndex, REALITY_CHECK_QUESTIONS.length - 1),
                                        0,
                                    ),
                                }))
                            }
                            className="rounded-[14px] border border-esset-border bg-white px-4 py-2 text-sm font-semibold text-esset-ink hover:bg-esset-bg"
                        >
                            Back to last question
                        </button>
                        <button
                            type="button"
                            onClick={resetAssessment}
                            className="esset-btn-primary rounded-[14px] px-4 py-2 text-sm"
                        >
                            Reset assessment
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
