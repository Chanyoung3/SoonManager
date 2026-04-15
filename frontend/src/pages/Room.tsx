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
    const [userList, setUserList] = useState<{ userId: string, userName: string }[]>([]);
    const [roomMaster, setRoomMaster] = useState<string>("");
    const [roomUserId, setRoomUserId] = useState<string>("");

    const [userName, setUserName] = useState<string>("");
    const [masterName, setMasterName] = useState<string>("");

    const [tempName, setTempName] = useState<string>("");
    const [showNameModal, setShowNameModal] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedName = sessionStorage.getItem(`room_userName_${roomId}`);
            return !savedName;
        }
        return true;
    });

    const [maxUser, setMaxUser] = useState<number>(8);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeModal, setActiveModal] = useState<"main" | "detail" | null>(null);
    const inviteUrl = `${window.location.origin}/room/${roomId}`;

    const [isLoading, setIsLoading] = useState(true); // 로딩여부

    useEffect(() => {
        const checkSavedName = async () => {
            const savedName = sessionStorage.getItem(`room_userName_${roomId}`);
            if (savedName) {
                await autoJoin(savedName);
            } else {
                setIsLoading(false);
            }
        };

        if (roomId) {
            checkSavedName();
        }
    }, [roomId]);

    const autoJoin = async (name: string) => {
        try {
            const response = await fetch(`http://localhost:8080/room/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userName: name,
                    userId: crypto.randomUUID()
                })
            });
            const data = await response.json();
            setIsLoading(false);

            const savedId = sessionStorage.getItem(`room_userId_${roomId}`);
            setRoomUserId(savedId || "");

            setUserName(name);
            if (data.isMaster) {
                setRoomMaster(data.userId);
                setRoomMaster(savedId || "");
            }
            setShowNameModal(false);
        } catch (e) {
            console.error("자동 입장 실패", e);
            setIsLoading(false);
        }
    };

    // 이름 확정 및 입장 함수
    const handleNameSubmit = async () => {
        const trimmedName = tempName.trim();
        if (!trimmedName) return alert("이름을 입력해주세요!");
        if (trimmedName.length > 10) return alert("이름은 10자 이내로 입력해주세요.");

        // 1. 고유 ID 생성 (이름 중복 방지용)
        const newUserId = crypto.randomUUID();
        try {
            // 2. 서버에 입장 및 방장 체크 요청
            const response = await fetch(`http://localhost:8080/room/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userName: trimmedName,
                    userId: newUserId
                })
            });

            const data = await response.json();

            // 3. 상태 업데이트
            setUserName(trimmedName);
            setRoomUserId(newUserId);
            sessionStorage.setItem(`room_userName_${roomId}`, trimmedName);
            sessionStorage.setItem(`room_userId_${roomId}`, newUserId);
            if (data.isMaster) {
                setRoomMaster(newUserId);
            }
            setShowNameModal(false);

        } catch (error) {
            console.error("입장 처리 실패:", error);
            alert("입장 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        if (!userName) return;

        const socket = new SockJS('http://localhost:8080/ws-stomp');
        const client = Stomp.over(socket);

        //client.debug = () => {};
        client.connect({}, (frame) => {
            client.subscribe(`/sub/room/${roomId}`, (message) => {
                const data = JSON.parse(message.body);

                if (data.roomMaster) setRoomMaster(data.roomMaster);
                if (data.masterName) setMasterName(data.masterName);
                if (data.userList) setUserList(data.userList);
                if (data.maxUser) setMaxUser(data.maxUser);
            });

            // 입장 알림 전송
            client.send(`/pub/room/enter/${roomId}`, {}, JSON.stringify({
                sender: userName,
                type: "ENTER",
                userId: roomUserId,
            }));
        }, (error) => {
            console.error("소켓 에러:", error);
        });

        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect(() => { });
            }
        };
    }, [roomId, userName]);

    const handleMaxUserChange = async (newMax: number) => {
        if (roomUserId !== roomMaster) return;

        try {
            const response = await fetch(`http://localhost:8080/room/update-settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    maxUser: newMax
                })
            });

            if (!response.ok) throw new Error("설정 변경 실패");
        } catch (error) {
            alert("최대 인원 변경에 실패했습니다.");
        }
    };

    const leaveRoom = async () => {
        if (!window.confirm("방에서 나가시겠습니까?")) return;

        try {
            const response = await fetch(`http://localhost:8080/room/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userId: roomUserId,
                    userName: userName,
                })
            });

            if (!response.ok) {
                throw new Error(`서버 에러: ${response.status}`);
            }
            sessionStorage.clear();
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

    const handleNameUpdate = async () => {
        const trimmedName = tempName.trim();
        if (!trimmedName || trimmedName === userName) {
            setIsEditing(false);
            setTempName(userName);
            return;
        }

        if (trimmedName.length > 10) {
            alert("이름은 10자 이내로 입력해주세요.");
            return;
        }

        try {
            if (stompClient.current && stompClient.current.connected) {
                stompClient.current.send(`/pub/room/update-name/${roomId}`, {}, JSON.stringify({
                    userId: roomUserId,
                    newName: trimmedName
                }));
            }

            setUserName(trimmedName);
            sessionStorage.setItem(`room_userName_${roomId}`, trimmedName);
            if (roomUserId === roomMaster) setMasterName(trimmedName);
            setIsEditing(false);
        } catch (error) {
            console.error("이름 변경 실패:", error);
            alert("이름 변경에 실패했습니다.");
        }
    };

    return (
        <div className="room-page-wrapper">
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

                {activeModal && (
                    <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                        <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{activeModal === "main" ? "게임 모드 선택" : "게임 세부 설정"}</h3>
                                <button className="close-btn" onClick={() => setActiveModal(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {activeModal === "main" ? (
                                    <div className="game-mode-grid">
                                        <button className="mode-item">
                                            <div className="mode-icon">🏆</div>
                                            <div className="mode-text">
                                                <strong>일반 모드</strong>
                                                <p>표준 규칙으로 진행합니다.</p>
                                            </div>
                                        </button>
                                        <button className="mode-item">
                                            <div className="mode-icon">⚡</div>
                                            <div className="mode-text">
                                                <strong>스피드 모드</strong>
                                                <p>제한 시간이 절반으로 줄어듭니다.</p>
                                            </div>
                                        </button>
                                        <button className="mode-item">
                                            <div className="mode-icon">🃏</div>
                                            <div className="mode-text">
                                                <strong>아이템 모드</strong>
                                                <p>특수 아이템을 사용할 수 있습니다.</p>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="detail-settings-list">
                                        <div className="setting-row">
                                            <span>라운드 수</span>
                                            <div className="counter">
                                                <button>-</button>
                                                <span>5</span>
                                                <button>+</button>
                                            </div>
                                        </div>
                                        <div className="setting-row">
                                            <span>제한 시간 (초)</span>
                                            <input type="range" min="10" max="60" step="10" />
                                            <span>30s</span>
                                        </div>
                                        <div className="setting-row">
                                            <span>공개 여부</span>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button className="modal-cancel-btn" onClick={() => setActiveModal(null)}>취소</button>
                                <button className="modal-confirm-btn" onClick={() => {
                                    // 여기에 설정 저장 로직 추가
                                    setActiveModal(null);
                                }}>적용하기</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="user-container">
                    <div className="user-list-header">
                        <p className="role-label">참가자 목록 ({userList.length}/{maxUser}명)</p>
                        <select className="max-user-select"
                            value={maxUser}
                            disabled={roomUserId !== roomMaster}
                            onChange={(e) => handleMaxUserChange(Number(e.target.value))}>
                            {[8, 16, 32, 64, 128, 256].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    <div className="user-card my-profile">
                        <p className="role-label">👑</p>
                        <span className="status-dot"></span>
                        <div className="name-wrapper">
                            {roomUserId === roomMaster && isEditing ? (
                                <input
                                    className="user-name-edit-input"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onBlur={handleNameUpdate}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                                    autoFocus
                                    maxLength={10}
                                />
                            ) : (
                                <div
                                    className="user-name-display"
                                    onClick={() => {
                                        if (roomUserId === roomMaster) {
                                            setTempName(userName);
                                            setIsEditing(true);
                                        }
                                    }}
                                    style={{ cursor: roomUserId === roomMaster ? 'pointer' : 'default' }}
                                >
                                    <span className="user-name">{masterName}</span>
                                    {roomUserId === roomMaster && (
                                        <>
                                            <span className="status-text"> (나)</span>
                                            <Edit2 size={14} className="edit-icon-right" />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="users-card">
                        <div className="users-list-content">
                            {userList.map((user, idx) => {
                                const isMe = user.userId === roomUserId;
                                const isUserMaster = user.userId === roomMaster;
                                if (isUserMaster) return null;

                                return (
                                    <div key={user.userId || idx} className="user-item">
                                        {isMe ? (
                                            <div className="name-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                {isEditing ? (
                                                    <input
                                                        className="user-name-edit-input"
                                                        value={tempName}
                                                        onChange={(e) => setTempName(e.target.value)}
                                                        onBlur={handleNameUpdate}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                                                        autoFocus
                                                        maxLength={10}
                                                    />
                                                ) : (
                                                    <div
                                                        className="user-name-display me"
                                                        onClick={() => {
                                                            setTempName(userName);
                                                            setIsEditing(true);
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span className="user-name">{user.userName}</span>
                                                        <span className="status-text"> (나)</span>
                                                        <Edit2 size={12} className="edit-icon-right" style={{ marginLeft: '4px' }} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="user-name">{user.userName}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
    );
};

export default Room;