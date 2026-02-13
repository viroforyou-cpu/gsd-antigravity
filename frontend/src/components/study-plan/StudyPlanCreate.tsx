/**
 * StudyPlanCreate - Multi-step wizard for creating a new study plan.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { studyPlanService } from '../../services/studyPlanService';
import type {
    StudyPlanCreate,
    StudyPlanSettings,
    MilestoneCreate,
} from '../../types/studyPlan';
import { DEFAULT_SETTINGS } from '../../types/studyPlan';

type Step = 'basics' | 'settings' | 'milestones' | 'review';

const STUDY_DAY_LABELS: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun',
};

const CATEGORY_OPTIONS = [
    'Lysosomal Storage Disorders',
    'Mitochondrial Disorders',
    'Connective Tissue Disorders',
    'Chromosomal Abnormalities',
    'Inherited Metabolic Disorders',
    'Neurogenetic Disorders',
    'Cancer Genetics',
    'Pharmacogenomics',
    'Population Genetics',
    'Ethical Issues in Genetics',
];

interface FormData {
    name: string;
    description: string;
    target_date: string;
    settings: StudyPlanSettings;
    milestones: MilestoneCreate[];
}

const initialFormData: FormData = {
    name: '',
    description: '',
    target_date: '',
    settings: { ...DEFAULT_SETTINGS },
    milestones: [],
};

export function StudyPlanCreate() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<Step>('basics');
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const steps: { key: Step; label: string }[] = [
        { key: 'basics', label: 'Basics' },
        { key: 'settings', label: 'Settings' },
        { key: 'milestones', label: 'Milestones' },
        { key: 'review', label: 'Review' },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

    const updateFormData = (updates: Partial<FormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const updateSettings = (updates: Partial<StudyPlanSettings>) => {
        setFormData((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...updates },
        }));
    };

    const addMilestone = () => {
        const newMilestone: MilestoneCreate = {
            title: '',
            description: '',
            target_date: undefined,
            order_index: formData.milestones.length,
        };
        updateFormData({ milestones: [...formData.milestones, newMilestone] });
    };

    const updateMilestone = (index: number, updates: Partial<MilestoneCreate>) => {
        const updated = [...formData.milestones];
        updated[index] = { ...updated[index], ...updates };
        updateFormData({ milestones: updated });
    };

    const removeMilestone = (index: number) => {
        const updated = formData.milestones
            .filter((_, i) => i !== index)
            .map((m, i) => ({ ...m, order_index: i }));
        updateFormData({ milestones: updated });
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 'basics':
                return formData.name.trim().length >= 3;
            case 'settings':
                return formData.settings.daily_question_goal >= 1;
            case 'milestones':
                return true; // Milestones are optional
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].key);
        }
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].key);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const createData: StudyPlanCreate = {
                name: formData.name,
                description: formData.description || undefined,
                target_date: formData.target_date || undefined,
                settings: formData.settings,
                milestones: formData.milestones.filter((m) => m.title.trim()),
            };

            const plan = await studyPlanService.createPlan(createData);

            // Generate tasks for the next 30 days
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 30);

            await studyPlanService.generateTasks(plan.id, {
                start_date: today.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                overwrite_existing: false,
            });

            navigate(`/study-plans/${plan.id}`);
        } catch (err) {
            console.error('Failed to create plan:', err);
            setError('Failed to create study plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudyDay = (day: number) => {
        const currentDays = formData.settings.study_days;
        if (currentDays.includes(day)) {
            updateSettings({
                study_days: currentDays.filter((d) => d !== day),
            });
        } else {
            updateSettings({
                study_days: [...currentDays, day].sort(),
            });
        }
    };

    const toggleCategory = (category: string) => {
        const currentCategories = formData.settings.categories;
        if (currentCategories.includes(category)) {
            updateSettings({
                categories: currentCategories.filter((c) => c !== category),
            });
        } else {
            updateSettings({
                categories: [...currentCategories, category],
            });
        }
    };

    return (
        <Layout title="Create Study Plan">
            <div className="max-w-3xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div
                                key={step.key}
                                className="flex items-center flex-1"
                            >
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${index <= currentStepIndex
                                        ? 'bg-primary-500 border-primary-500 text-white'
                                        : 'border-gray-300 text-gray-500'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <span
                                    className={`ml-2 text-sm font-medium hidden sm:block ${index <= currentStepIndex
                                        ? 'text-primary-600'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    {step.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-4 ${index < currentStepIndex
                                            ? 'bg-primary-500'
                                            : 'bg-gray-300'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <Card className="mb-6 bg-red-50 border-red-200">
                        <CardBody>
                            <p className="text-red-700">{error}</p>
                        </CardBody>
                    </Card>
                )}

                {/* Step Content */}
                <Card>
                    <CardBody className="p-6">
                        {currentStep === 'basics' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Plan Basics
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Give your study plan a name and set your target completion date.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Plan Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            updateFormData({ name: e.target.value })
                                        }
                                        placeholder="e.g., Board Exam Preparation"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        maxLength={200}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.name.length}/200 characters
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="description"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            updateFormData({ description: e.target.value })
                                        }
                                        placeholder="Describe your study goals..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="target_date"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Target Completion Date
                                    </label>
                                    <input
                                        type="date"
                                        id="target_date"
                                        value={formData.target_date}
                                        onChange={(e) =>
                                            updateFormData({ target_date: e.target.value })
                                        }
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 'settings' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Study Settings
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Configure your daily study goals and preferences.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="daily_goal"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Daily Question Goal
                                    </label>
                                    <input
                                        type="number"
                                        id="daily_goal"
                                        value={formData.settings.daily_question_goal}
                                        onChange={(e) =>
                                            updateSettings({
                                                daily_question_goal: parseInt(e.target.value) || 1,
                                            })
                                        }
                                        min={1}
                                        max={100}
                                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Number of questions to practice each day
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Study Days
                                    </label>
                                    <div className="flex gap-2">
                                        {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleStudyDay(day)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.settings.study_days.includes(day)
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {STUDY_DAY_LABELS[day]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Focus Categories
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORY_OPTIONS.map((category) => (
                                            <label
                                                key={category}
                                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.settings.categories.includes(category)}
                                                    onChange={() => toggleCategory(category)}
                                                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {category}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Leave empty to include all categories
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.settings.include_srs_reviews}
                                            onChange={(e) =>
                                                updateSettings({ include_srs_reviews: e.target.checked })
                                            }
                                            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Include spaced repetition reviews
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.settings.include_bookmark_reviews}
                                            onChange={(e) =>
                                                updateSettings({
                                                    include_bookmark_reviews: e.target.checked,
                                                })
                                            }
                                            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Include bookmark reviews
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {currentStep === 'milestones' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Milestones
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Add milestones to track your progress toward your goal.
                                    </p>
                                </div>

                                {formData.milestones.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <p className="text-gray-600 mb-4">
                                            No milestones added yet
                                        </p>
                                        <Button variant="outline" onClick={addMilestone}>
                                            + Add Milestone
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.milestones.map((milestone, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border border-gray-200 rounded-lg"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1 space-y-3">
                                                        <input
                                                            type="text"
                                                            value={milestone.title}
                                                            onChange={(e) =>
                                                                updateMilestone(index, {
                                                                    title: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Milestone title"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                        <textarea
                                                            value={milestone.description || ''}
                                                            onChange={(e) =>
                                                                updateMilestone(index, {
                                                                    description: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Description (optional)"
                                                            rows={2}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={milestone.target_date || ''}
                                                            onChange={(e) =>
                                                                updateMilestone(index, {
                                                                    target_date: e.target.value,
                                                                })
                                                            }
                                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMilestone(index)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <Button variant="outline" onClick={addMilestone}>
                                            + Add Another Milestone
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 'review' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Review Your Plan
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Review your study plan settings before creating.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">
                                            Basic Info
                                        </h3>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Name:</dt>
                                                <dd className="text-gray-900 font-medium">
                                                    {formData.name}
                                                </dd>
                                            </div>
                                            {formData.description && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-500">Description:</dt>
                                                    <dd className="text-gray-900">
                                                        {formData.description}
                                                    </dd>
                                                </div>
                                            )}
                                            {formData.target_date && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-500">Target Date:</dt>
                                                    <dd className="text-gray-900">
                                                        {new Date(formData.target_date).toLocaleDateString()}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">
                                            Study Settings
                                        </h3>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Daily Goal:</dt>
                                                <dd className="text-gray-900">
                                                    {formData.settings.daily_question_goal} questions
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Study Days:</dt>
                                                <dd className="text-gray-900">
                                                    {formData.settings.study_days
                                                        .map((d) => STUDY_DAY_LABELS[d])
                                                        .join(', ')}
                                                </dd>
                                            </div>
                                            {formData.settings.categories.length > 0 && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-500">Categories:</dt>
                                                    <dd className="text-gray-900 text-right max-w-xs">
                                                        {formData.settings.categories.join(', ')}
                                                    </dd>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">SRS Reviews:</dt>
                                                <dd className="text-gray-900">
                                                    {formData.settings.include_srs_reviews ? 'Yes' : 'No'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Bookmark Reviews:</dt>
                                                <dd className="text-gray-900">
                                                    {formData.settings.include_bookmark_reviews
                                                        ? 'Yes'
                                                        : 'No'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>

                                    {formData.milestones.length > 0 && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h3 className="font-medium text-gray-900 mb-2">
                                                Milestones ({formData.milestones.length})
                                            </h3>
                                            <ul className="space-y-2">
                                                {formData.milestones.map((m, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-sm text-gray-700"
                                                    >
                                                        {i + 1}. {m.title || '(Untitled)'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStepIndex === 0}
                            >
                                Back
                            </Button>

                            {currentStep === 'review' ? (
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={!canProceed() || loading}
                                    loading={loading}
                                >
                                    Create Plan
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleNext}
                                    disabled={!canProceed()}
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Layout>
    );
}

export default StudyPlanCreate;
