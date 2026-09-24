import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { MessageCircle, X, Send } from "lucide-react";
import { avatarFor } from "./avatar";
import "./Chat.css";

interface ChatMsg {
    senderId: string;
    senderName: string;
    content: string;
    receivedAt?: string;
}

interface ChatProps {
    roomId: string | undefined;
    stompClient: Client | null;
    userId: string;
    userName: string;
    // true: 방 화면 탭 안에 항상 펼쳐진 형태 / false: 우측 하단 플로팅 버튼
    inline?: boolean;
}

const Chat: React.FC<ChatProps> = ({ roomId, stompClient, userId, userName, inline = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState("");
    const [unread, setUnread] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen || inline;

    useEffect(() => {
        if (!stompClient || !stompClient.connected || !roomId) return;

        const subscription = stompClient.subscribe(`/sub/chat/${roomId}`, (message) => {
            const data: ChatMsg = JSON.parse(message.body);
            const now = new Date();
            data.receivedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            setMessages((prev) => [...prev, data]);
            if (!isOpenRef.current) {
                setUnread((u) => u + 1);
            }
        });

        return () => subscription.unsubscribe();
    }, [stompClient, roomId]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        setUnread(0);
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || !stompClient || !stompClient.connected || !roomId) return;

        (stompClient as any).send(`/pub/chat/${roomId}`, {}, JSON.stringify({
            senderId: userId,
            senderName: userName,
            content: trimmed,
        }));
        setInput("");
    };

    const messageList = (
        <div className="chat-messages" ref={listRef}>
            {messages.length === 0 && (
                <p className="chat-empty">아직 메시지가 없어요. 첫 인사를 남겨보세요!</p>
            )}
            {messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.senderId === userId ? "mine" : ""}`}>
                    <img className="chat-avatar" src={avatarFor(m.senderName)} alt="" />
                    <div className="chat-message-body">
                        <div className="chat-meta">
                            <span className="chat-sender">{m.senderName}</span>
                            {m.receivedAt && <span className="chat-time">{m.receivedAt}</span>}
                        </div>
                        <span className="chat-bubble">{m.content}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const inputRow = (
        <div className="chat-input-row">
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="메시지를 입력하세요..."
                maxLength={200}
            />
            <button className="chat-send-btn" onClick={handleSend}>
                <Send size={16} />
            </button>
        </div>
    );

    if (inline) {
        return (
            <div className="chat-inline">
                {messageList}
                {inputRow}
            </div>
        );
    }

    return (
        <div className="chat-widget">
            {isOpen && (
                <div className="chat-panel game-fade-in">
                    <div className="chat-panel-header">
                        <span className="game-title">💬 채팅</span>
                        <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                    {messageList}
                    {inputRow}
                </div>
            )}

            <button className="chat-toggle-btn" onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}>
                <MessageCircle size={24} />
                {!isOpen && unread > 0 && <span className="chat-unread-badge badge-pop">{unread}</span>}
            </button>
        </div>
    );
};

export default Chat;
