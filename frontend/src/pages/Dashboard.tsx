import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardHeader, CardBody, Button } from '../components/common';

export function Dashboard() {
    // Mock data for dashboard
    const stats = {
        totalSessions: 12,
        questionsAnswered: 48,
        accuracy: 72,
        streak: 5,
    };

    const recentCategories = [
        { name: 'Lysosomal Storage Disorders', accuracy: 80, count: 10 },
        { name: 'Chromosomal Abnormalities', accuracy: 65, count: 8 },
        { name: 'Inherited Metabolic Disorders', accuracy: 75, count: 12 },
    ];

    return (
        <Layout title="Dashboard">
            <div className="max-w-6xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                    <p className="text-gray-600">Ready to practice some medical genetics questions?</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card variant="elevated" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                        <CardBody className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Start Practice Session</h3>
                                <p className="text-primary-100 text-sm">Begin a new set of questions</p>
                            </div>
                            <Link to="/practice">
                                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                    Start Now
                                </Button>
                            </Link>
                        </CardBody>
                    </Card>

                    <Card variant="elevated" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardBody className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Review Past Sessions</h3>
                                <p className="text-blue-100 text-sm">Analyze your performance</p>
                            </div>
                            <Link to="/history">
                                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                    View History
                                </Button>
                            </Link>
                        </CardBody>
                    </Card>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-primary-600">{stats.totalSessions}</p>
                            <p className="text-sm text-gray-500 mt-1">Sessions</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{stats.questionsAnswered}</p>
                            <p className="text-sm text-gray-500 mt-1">Questions</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-green-600">{stats.accuracy}%</p>
                            <p className="text-sm text-gray-500 mt-1">Accuracy</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-orange-500">{stats.streak}</p>
                            <p className="text-sm text-gray-500 mt-1">Day Streak</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Category Performance */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Category Performance</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {recentCategories.map((category) => (
                                <div key={category.name} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">{category.name}</p>
                                        <p className="text-xs text-gray-500">{category.count} questions</p>
                                    </div>
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${category.accuracy >= 70 ? 'bg-green-500' : category.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${category.accuracy}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                        {category.accuracy}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Layout>
    );
}
