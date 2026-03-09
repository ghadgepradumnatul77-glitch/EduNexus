import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { BookOpen, Calendar, Plus, UploadCloud } from 'lucide-react';

const AcademicHubPage = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('courses');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [coursesRes, assignmentsRes] = await Promise.all([
                api.get('/academic/courses'),
                api.get('/academic/assignments')
            ]);
            setCourses(coursesRes.data.data);
            setAssignments(assignmentsRes.data.data);

            if (user.role === 'Student') {
                const subRes = await api.get('/academic/submissions/student');
                setSubmissions(subRes.data.data);
            }
        } catch (error) {
            console.error('Failed to load academic data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmission = async (assignment_id, url) => {
        if (!url) return alert('Please provide a submission URL');
        try {
            await api.post('/academic/submissions', { assignment_id, submission_url: url });
            alert('Submitted successfully!');
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4 bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20">
                <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                    <BookOpen className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-primary">Academic Hub</h1>
                    <p className="text-text-secondary font-medium">Manage your courses, assignments, and submissions in one place.</p>
                </div>
            </div>

            <div className="flex gap-4 border-b border-edu-border">
                <button onClick={() => setActiveTab('courses')} className={`p-4 font-bold transition-all border-b-2 ${activeTab === 'courses' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                    Courses
                </button>
                <button onClick={() => setActiveTab('assignments')} className={`p-4 font-bold transition-all border-b-2 ${activeTab === 'assignments' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                    Assignments
                </button>
                {user.role === 'Student' && (
                    <button onClick={() => setActiveTab('submissions')} className={`p-4 font-bold transition-all border-b-2 ${activeTab === 'submissions' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                        My Submissions
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center p-8 text-text-muted">Loading academic data...</div>
            ) : (
                <div className="mt-6">
                    {activeTab === 'courses' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map(course => (
                                <div key={course.id} className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-xs font-black tracking-widest text-primary-500 uppercase mb-2">{course.course_code}</div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1">{course.course_name}</h3>
                                    <p className="text-sm text-text-secondary">Instructor: {course.faculty_first_name} {course.faculty_last_name}</p>
                                    <div className="mt-4 pt-4 border-t border-edu-border flex justify-between items-center text-xs text-text-muted font-semibold">
                                        <span>Semester: {course.semester}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="space-y-4">
                            {assignments.map(assignment => (
                                <div key={assignment.id} className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-surface-main rounded-md text-xs font-bold text-text-muted">{assignment.course_code}</span>
                                            <h3 className="text-lg font-bold text-text-primary">{assignment.title}</h3>
                                        </div>
                                        <p className="text-sm text-text-secondary">{assignment.description}</p>
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg w-fit">
                                            <Calendar className="w-4 h-4" />
                                            Due: {new Date(assignment.due_date).toLocaleString()}
                                        </div>
                                    </div>
                                    {user.role === 'Student' && (
                                        <div className="flex items-center gap-3 w-full md:w-1/3">
                                            <input
                                                id={`url-${assignment.id}`}
                                                type="url"
                                                placeholder="Enter submission Document URL"
                                                className="flex-1 bg-surface-main border border-edu-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    const url = document.getElementById(`url-${assignment.id}`).value;
                                                    handleSubmission(assignment.id, url);
                                                }}
                                                className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-lg"
                                            >
                                                <UploadCloud className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="space-y-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm">
                                    <h3 className="text-lg font-bold text-text-primary mb-1">{sub.assignment_title}</h3>
                                    <p className="text-sm text-text-muted mb-4">{sub.course_name}</p>
                                    <div className="flex items-center justify-between">
                                        <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline text-sm font-semibold flex items-center gap-1">
                                            View Submission Document ↗
                                        </a>
                                        <span className="text-xs text-text-muted font-medium bg-surface-main px-3 py-1 rounded-lg">
                                            Submitted: {new Date(sub.submitted_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AcademicHubPage;
