import React, { useState, useEffect, useRef } from "react";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Copy, Check, Edit2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import "./Room.css";

const Room = () => {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState("호스트");
    const [activeModal, setActiveModal] = useState<"main" | "detail" | null>(null);

    const stompClient = useRef<Stomp.Client | null>(null);
    const inviteUrl = `https://localhost:5173/room/${roomCode}`;

    useEffect(() => {
        // 1. 방 생성 API 호출
        fetch('/room/create', { method: 'POST' })
            .then(res => res.text())
            .then(code => {
                setRoomCode(code); // 서버에서 받은 코드로 업데이트

                // 2. 웹소켓 연결
                const socket = new SockJS('http://localhost:8080/ws-stomp');
                stompClient.current = Stomp.over(socket);

                stompClient.current.connect({}, (frame) => {
                    console.log('Connected: ' + frame);

                    // 3. 채널 구독
                    stompClient.current?.subscribe('/sub/room/' + code, (message) => {
                        const data = JSON.parse(message.body);
                        console.log("메시지 수신:", data);
                        // 여기서 유저 목록 상태 업데이트 로직 추가 가능
                    });

                    // 4. 입장 알림 전송
                    stompClient.current?.send("/pub/room/enter/" + code, {}, JSON.stringify({
                        sender: userName,
                        type: "ENTER"
                    }));
                }, (error) => {
                    console.error("소켓 연결 실패:", error);
                });
            });

        // 클린업 함수: 컴포넌트가 사라질 때 소켓 연결 종료
        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect(() => {
                    console.log("Disconnected");
                });
            }
        };
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("복사 실패:", err);
        }
    };

    const goMain = () => navigate("/");

    const closeModal = () => setActiveModal(null);
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

                {activeModal && (
                    <div className="modal-overlay">
                        <div className="modal-content-center">
                            <div className="modaless-header">
                                <span className="modalss-title">{activeModal === "main" ? "메인 모드 설정" : "세부 규칙"}</span>
                                <X size={20} onClick={closeModal} className="close-icon" />
                            </div>

                            <div className="modeless-body">
                                {activeModal === "main" ? (
                                    <>
                                        <button className="option-item" onClick={closeModal}>일반 모드</button>
                                        <button className="option-item" onClick={closeModal}>랭킹 모드</button>
                                        <button className="option-item" onClick={closeModal}>연습 모드</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="setting-row">
                                            <span>제한 시간</span>
                                            <input type="range" />
                                        </div>
                                        <div className="setting-row">
                                            <span>최대 인원</span>
                                            <select><option>8명</option><option>12명</option></select>
                                        </div>
                                        <button className="start-btn" style={{ height: '40px', fontSize: '14px' }} onClick={closeModal}>적용하기</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 기존 .mode-content 부분은 버튼만 남깁니다 */}
                <div className="mode-content">
                    <div className="mode-btn-wrapper">
                        <button className="game-mode" onClick={() => setActiveModal("main")}>메인선택</button>
                    </div>
                    <div className="mode-btn-wrapper">
                        <button className="game-detail" onClick={() => setActiveModal("detail")}>세부설정</button>
                    </div>
                </div>

                <div className="user-container">
                    <p className="role-label">Host</p>

                    <div className="user-card my-profile">
                        <span className="status-dot"></span>

                        {isEditing ? (
                            <input
                                className="name-edit-input"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onBlur={() => setIsEditing(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                                autoFocus
                            />
                        ) : (
                            <div className="name-wrapper" onClick={() => setIsEditing(true)}>
                                <span className="user-name">{userName}</span>
                                <span className="status-text">(나)</span>
                                <Edit2 size={14} className="edit-icon" />
                            </div>
                        )}
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
                    <div className="btn-container">
                        <button className="back-btn" onClick={goMain}>나가기</button>
                        <button className="start-btn">시작하기</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Room;