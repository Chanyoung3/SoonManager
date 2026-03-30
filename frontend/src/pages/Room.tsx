import React, { useState } from "react";
import Header from "../components/Header";
import { Copy, Check } from 'lucide-react'; // 체크 아이콘 추가
import { QRCodeSVG } from 'qrcode.react';
import "./Room.css";

const Room = () => {
    const [copied, setCopied] = useState(false);
    const roomCode = "86XFVK"; // 나중에 서버에서 받아올 방 코드
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
        <>
            <Header />
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
                            size={100} 
                            bgColor="transparent" 
                            fgColor="white"
                            includeMargin={false}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Room;