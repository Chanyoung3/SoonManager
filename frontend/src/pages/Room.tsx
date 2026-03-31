import React, { useState } from "react";
import Header from "../components/Header";
import { Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import "./Room.css";

const Room = () => {
    const [copied, setCopied] = useState(false);
    const roomCode = "86XFVK"; 
    const inviteUrl = `https://soonmanager.com/room/${roomCode}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("복사 실패:", err);
        }
    };

    return (
        <div className="room-page-wrapper">
            <Header />
            <div className="room-main-content">
                <div className="room-container">
                    <div className="invite-card copy-section" onClick={handleCopy}>
                        <div className={`icon-box ${copied ? 'copied' : ''}`}>
                            {copied ? <Check size={24} color="#fff" /> : <Copy size={24} color="#6366f1" />}
                        </div>
                        <div className="text-box">
                            <h3>초대 링크 복사</h3>
                            <p>{copied ? "링크가 복사되었습니다!" : "링크를 공유하여 친구를 초대하세요"}</p>
                        </div>
                    </div>

                    <div className="invite-card code-section">
                        <div className="code-info">
                            <span className="label">ROOM CODE</span>
                            <h2 className="display-code">{roomCode}</h2>
                        </div>
                        <div className="qr-box">
                            <QRCodeSVG 
                                value={inviteUrl} 
                                size={60} 
                                bgColor="transparent" 
                                fgColor="#000"
                                includeMargin={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="user-container">
                    <div className="user-card">
                        나 (대기 중)
                    </div>
                    <div className="users-card">
                        <div className="users-list-content">
                            <div className="user-item">친구 1</div>
                            <div className="user-item">친구 2</div>
                            <div className="user-item">친구 3</div>
                            <div className="user-item">친구 4</div>
                            <div className="user-item">친구 5</div>
                            <div className="user-item">친구 6</div>
                            <div className="user-item">친구 7</div>
                            <div className="user-item">친구 8</div>
                        </div>
                    </div>
                    <button className="start-btn">시작하기</button>
                </div>
            </div>
        </div>
    );
};

export default Room;