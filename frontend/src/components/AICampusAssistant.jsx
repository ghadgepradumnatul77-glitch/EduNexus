import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Robot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const AICampusAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: "Hi! I'm your AI Campus Assistant. Ask me about your timetable, assignments, or campus notices." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        const newMsgId = Date.now();
        setMessages(prev => [...prev, { id: newMsgId, type: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg });
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: res.data.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "Sorry, I'm having trouble connecting to the campus brain right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-80 md:w-96 bg-surface-card border border-edu-border rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden"
                        style={{ height: '500px' }}
                    >
                        <div className="bg-primary-500 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <h3 className="font-bold">AI Campus Assistant</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-main">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.type === 'user'
                                            ? 'bg-primary-500 text-white rounded-tr-sm'
                                            : 'bg-surface-card border border-edu-border text-text-primary rounded-tl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-surface-card border border-edu-border p-3 rounded-2xl rounded-tl-sm flex gap-1">
                                        <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-surface-card border-t border-edu-border">
                            <form onSubmit={handleSend} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about assignments, notices..."
                                    className="flex-1 bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 ${isOpen ? 'bg-surface-card border border-edu-border text-text-primary' : 'bg-primary-500 text-white'}`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
};

export default AICampusAssistant;
