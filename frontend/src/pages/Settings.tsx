import { useState } from 'react';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader } from '../components/common';

export function Settings() {
    const [settings, setSettings] = useState({
        showTimer: true,
        showImmediateFeedback: true,
        defaultQuestionCount: 10,
        darkMode: false,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Layout title="Settings">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>

                {/* Practice Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Practice Settings</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {/* Show Timer */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-700">Show Timer</p>
                                    <p className="text-sm text-gray-500">Display a timer during practice sessions</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('showTimer')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showTimer ? 'bg-primary-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showTimer ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Immediate Feedback */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-700">Immediate Feedback</p>
                                    <p className="text-sm text-gray-500">Show correct answer immediately after submitting</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('showImmediateFeedback')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showImmediateFeedback ? 'bg-primary-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showImmediateFeedback ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Default Question Count */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-700">Default Question Count</p>
                                    <p className="text-sm text-gray-500">Number of questions per session</p>
                                </div>
                                <select
                                    value={settings.defaultQuestionCount}
                                    onChange={(e) => setSettings(prev => ({ ...prev, defaultQuestionCount: Number(e.target.value) }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Appearance */}
                <Card className="mb-6">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-700">Dark Mode</p>
                                <p className="text-sm text-gray-500">Switch to dark theme (coming soon)</p>
                            </div>
                            <button
                                onClick={() => handleToggle('darkMode')}
                                disabled
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.darkMode ? 'bg-primary-600' : 'bg-gray-200'
                                    } opacity-50 cursor-not-allowed`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </CardBody>
                </Card>

                {/* About */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">About</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-2">
                            <p className="text-gray-600">
                                <span className="font-medium">GeneReason</span> - Medical Genetics MCQ Training App
                            </p>
                            <p className="text-sm text-gray-500">Version 0.1.0</p>
                            <p className="text-sm text-gray-500">
                                Designed for medical genetics residents preparing for board certification.
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Layout>
    );
}
