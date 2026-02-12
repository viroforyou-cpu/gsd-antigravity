import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardBody, Button } from '../components/common';

interface SessionHistoryItem {
    id: string;
    date: string;
    category: string;
    questionsAnswered: number;
    correct: number;
    accuracy: number;
}

// Mock history data
const mockHistory: SessionHistoryItem[] = [
    {
        id: '1',
        date: '2026-02-09T14:30:00',
        category: 'Lysosomal Storage Disorders',
        questionsAnswered: 10,
        correct: 8,
        accuracy: 80,
    },
    {
        id: '2',
        date: '2026-02-08T16:45:00',
        category: 'Chromosomal Abnormalities',
        questionsAnswered: 15,
        correct: 10,
        accuracy: 67,
    },
    {
        id: '3',
        date: '2026-02-07T10:15:00',
        category: 'All Categories',
        questionsAnswered: 20,
        correct: 14,
        accuracy: 70,
    },
    {
        id: '4',
        date: '2026-02-06T09:00:00',
        category: 'Inherited Metabolic Disorders',
        questionsAnswered: 10,
        correct: 7,
        accuracy: 70,
    },
];

export function History() {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Layout title="History">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Session History</h2>
                    <Link to="/practice">
                        <Button>New Session</Button>
                    </Link>
                </div>

                {mockHistory.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-12">
                            <p className="text-gray-600 mb-4">No practice sessions yet.</p>
                            <Link to="/practice">
                                <Button>Start Your First Session</Button>
                            </Link>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {mockHistory.map((session) => (
                            <Card key={session.id} className="hover:shadow-md transition-shadow">
                                <CardBody>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(session.date)}
                                                </span>
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                    {session.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {session.correct}/{session.questionsAnswered}
                                                    </span>
                                                    <span className="text-sm text-gray-500 ml-1">correct</span>
                                                </div>
                                                <div className={`text-lg font-semibold ${session.accuracy >= 70 ? 'text-green-600' : session.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {session.accuracy}%
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View Details
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
