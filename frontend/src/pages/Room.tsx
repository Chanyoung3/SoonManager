import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import Header from "../components/Header";
import { Copy, Check, Edit2, X, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import "./Room.css";

const Room = () => {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const stompClient = useRef<Stomp.Client | null>(null);

    // 상태 관리
    const [userList, setUserList] = useState<string[]>([]);
    const [roomMaster, setRoomMaster] = useState<string>("");
    const [userName, setUserName] = useState<string>(() => sessionStorage.getItem(`room_user_${roomId}`) || "");
    const [tempName, setTempName] = useState<string>(""); // 모달 입력용 임시 이름
    const [showNameModal, setShowNameModal] = useState<boolean>(!sessionStorage.getItem(`room_user_${roomId}`));
    
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeModal, setActiveModal] = useState<"main" | "detail" | null>(null);
    const inviteUrl = `${window.location.origin}/room/${roomId}`;

    // 이름 확정 및 입장 함수
    const handleNameSubmit = async () => {
        const trimmedName = tempName.trim();
        if (!trimmedName) return alert("이름을 입력해주세요!");
        if (trimmedName.length > 10) return alert("이름은 10자 이내로 입력해주세요.");
    
        // 1. 고유 ID 생성 (이름 중복 방지용)
        const newUserId = crypto.randomUUID();
        
        try {
            // 2. 서버에 입장 및 방장 체크 요청
            // 서버에서 roomMaster가 null이면 이 유저를 방장으로 설정하고 응답함
            const response = await fetch(`http://localhost:8080/room/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userName: trimmedName,
                    userId: newUserId
                })
            });
    
            const data = await response.json(); // 서버에서 { isMaster: true, masterId: "..." } 등을 반환
    
            // 3. 상태 업데이트
            setUserName(trimmedName);
            if (data.isMaster) {
                setRoomMaster(newUserId); // 내가 방장임을 로컬 상태에 저장
            }
    
            // 4. 세션 저장 및 모달 닫기
            sessionStorage.setItem(`room_user_${roomId}`, trimmedName);
            setShowNameModal(false);
    
            // 이후 useEffect가 userName과 userId의 변화를 감지해 소켓 ENTER 메시지를 보냄
        } catch (error) {
            console.error("입장 처리 실패:", error);
            alert("입장 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        if (!roomId || !userName) return;

        const socket = new SockJS('http://localhost:8080/ws-stomp');
        const client = Stomp.over(socket);

        client.connect({}, (frame) => {
            client.subscribe(`/sub/room/${roomId}`, (message) => {
                const data = JSON.parse(message.body);

                // 서버에서 내려주는 최신 방장 이름 (방장 변경 시에도 반영됨)
                if (data.roommaster) setRoomMaster(data.roommaster);
                // 최신 유저 리스트 업데이트
                if (data.userList) setUserList(data.userList);
            });

            // 입장 알림 전송
            client.send(`/pub/room/enter/${roomId}`, {}, JSON.stringify({
                userId: roomMaster,
                sender: userName,
                type: "ENTER"
            }));
        }, (error) => {
            console.error("소켓 에러:", error);
        });

        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect(() => {});
            }
        };
    }, [roomId, userName]);

    const leaveRoom = async () => {
        if (!window.confirm("방에서 나가시겠습니까?")) return;
    
        try {
            const response = await fetch(`http://localhost:8080/room/leave?roomId=${roomId}&username=${userName}`, {
                method: 'POST'
            });
    
            if (!response.ok) {
                throw new Error(`서버 에러: ${response.status}`);
            }
            navigate("/");
    
        } catch (error) {
            alert("방 나가기에 실패했습니다. 다시 시도해주세요.");
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="room-page-wrapper">
            {/* 1. 이름 입력 모달 (다른 곳 클릭 불가) */}
            {showNameModal && (
                <div className="name-setup-overlay">
                    <div className="name-setup-modal">
                        <User size={40} color="#6366f1" />
                        <h2>이름 설정</h2>
                        <p>사용하실 이름을 입력하세요.</p>
                        <input 
                            type="text" 
                            placeholder="이름 입력 (최대 10자)"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                            autoFocus
                        />
                        <button onClick={handleNameSubmit} className="name-submit-btn">입장하기</button>
                    </div>
                </div>
            )}

            <Header />

            {/* 모달 활성 시 배경 블러 처리 */}
            <div className={`room-main-content ${showNameModal ? "content-blur" : ""}`}>
                <div className="room-container">
                    <div className="invite-card copy-section" onClick={handleCopy}>
                        <div className={`icon-box ${copied ? 'copied' : ''}`}>
                            {copied ? <Check size={24} color="#fff" /> : <Copy size={24} color="#6366f1" />}
                        </div>
                        <div className="text-box">
                            <h3>초대 링크 복사</h3>
                            <p>{copied ? "복사 완료!" : "친구를 초대하세요"}</p>
                        </div>
                    </div>

                    <div className="invite-card code-section">
                        <div className="code-info">
                            <span className="label">ROOM CODE</span>
                            <h2 className="display-code">{roomId}</h2>
                        </div>
                        <div className="qr-box">
                            <QRCodeSVG value={inviteUrl} size={60} bgColor="transparent" />
                        </div>
                    </div>
                </div>

                <div className="mode-content">
                    <button className="game-mode" onClick={() => setActiveModal("main")}>메인선택</button>
                    <button className="game-detail" onClick={() => setActiveModal("detail")}>세부설정</button>
                </div>

                <div className="user-container">
                    <p className="role-label">참가자 목록 ({userList.length}/8명)</p>

                    <div className="user-card my-profile">
                        {userName === roomMaster && <p className="role-label">👑</p>}
                        <span className="status-dot"></span>
                        <div className="name-wrapper">
                            <span className="user-name">{userName}</span>
                            <span className="status-text"> (나)</span>
                        </div>
                    </div>

                    <div className="users-card">
                        <div className="users-list-content">
                            {userList
                                .filter(name => name !== userName)
                                .map((name, idx) => (
                                    <div key={idx} className="user-item">
                                        {/* 다른 유저가 방장일 경우 표시 */}
                                        {name === roomMaster && <span className="mini-host-badge">H</span>}
                                        {name}
                                    </div>
                                ))
                            }
                            {userList.length <= 1 && <div className="user-item empty">기다리는 중...</div>}
                        </div>
                    </div>

                    <div className="btn-container">
                        <button className="back-btn" onClick={leaveRoom}>나가기</button>
                        <button 
                            className="start-btn primary" 
                            disabled={userName !== roomMaster}
                            title={userName !== roomMaster ? "방장만 시작할 수 있습니다" : ""}
                        >
                            시작하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Room;