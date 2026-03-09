import { Megaphone, Calendar, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

const AnnouncementCard = ({ announcement, currentUserId, onDelete }) => {
    const isOwner = announcement.created_by === currentUserId;

    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 'critical': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert };
            case 'high': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle };
            case 'normal': return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: CheckCircle2 };
            case 'low': return { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: CheckCircle2 };
            default: return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Megaphone };
        }
    };

    const config = getPriorityConfig(announcement.priority_level);
    const Icon = config.icon;

    return (
        <div className="bg-surface-card border border-edu-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{announcement.title}</h3>
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(announcement.created_at).toLocaleDateString()}
                            <span className="mx-2">•</span>
                            Posted by {announcement.first_name} {announcement.last_name}
                        </p>
                    </div>
                </div>
                {isOwner && onDelete && (
                    <button
                        onClick={() => onDelete(announcement.id)}
                        className="text-xs text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-colors font-bold"
                    >
                        Delete
                    </button>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{announcement.content}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-edu-border flex justify-between items-center text-xs">
                <span className="px-2 py-1 bg-surface-main rounded-md text-text-muted font-semibold uppercase tracking-wider">
                    {announcement.visibility_scope.replace('_', ' ')}
                </span>
                {announcement.expires_at && (
                    <span className="text-orange-500 flex items-center gap-1">
                        Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
};

export default AnnouncementCard;
