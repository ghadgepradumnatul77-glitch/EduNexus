import { query } from '../db/connection.js';

// Simplified AI Assistant Controller using mock responses based on intent mapping
// In a full production scenario, this calls the OpenAI API or an open-source model.

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'No message provided.' });
        }

        const msgString = message.toLowerCase();
        let reply = "I'm your Campus AI Assistant. I can help with timetables, assignments, announcements, and navigating the skill exchange.";

        // Basic intent matching
        if (msgString.includes('assignment') || msgString.includes('due')) {
            // Context query: Find a pending assignment for this student
            const result = await query(
                `SELECT a.title, a.due_date, c.course_name 
                 FROM assignments a
                 JOIN courses c ON a.course_id = c.id
                 WHERE a.tenant_id = $1 
                 ORDER BY a.due_date ASC
                 LIMIT 1`,
                [req.user.orgId]
            );
            if (result.rows.length > 0) {
                const a = result.rows[0];
                reply = `Your next assignment is "${a.title}" for ${a.course_name}. It is due on ${new Date(a.due_date).toLocaleDateString()}.`;
            } else {
                reply = "You don't have any upcoming assignments right now!";
            }
        }
        else if (msgString.includes('notice') || msgString.includes('announcement')) {
            const result = await query(
                `SELECT title FROM announcements WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [req.user.orgId]
            );
            if (result.rows.length > 0) {
                reply = `The latest announcement is: "${result.rows[0].title}". Check the Notice Board for details.`;
            } else {
                reply = "There are no new announcements today.";
            }
        }
        else if (msgString.includes('tutor') || msgString.includes('skill') || msgString.includes('help')) {
            reply = "You can request a tutor or offer your skills in the campus Skill Exchange! Check the left menu.";
        }
        else if (msgString.includes('lost') || msgString.includes('found')) {
            reply = "If you lost or found an item, head over to the Lost & Found section to report it.";
        }

        // Return a simulated structured response compliant with OpenAI format
        res.json({
            success: true,
            data: { reply }
        });
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ success: false, message: 'AI service temporarily unavailable.' });
    }
};
