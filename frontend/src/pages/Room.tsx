import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { Client } from "@stomp/stompjs";
import AppShell, { type NavItem } from "../components/AppShell";
import { NICKNAME_KEY } from "../components/useTheme";
import { avatarFor, GAME_ICONS } from "../components/avatar";
import { Edit2, X, User, ArrowRight, ArrowLeft, Gamepad2, Users, Check, Settings, LogOut, Copy, PlusCircle, MessageCircle, Sparkles, Plus, Minus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LiarGame from "./LiarGame";
import Quiz from "./Quiz";
import Chat from "../components/Chat";
import { useAlert } from "../components/AlertProvider";
import { API_BASE, WS_URL } from "../config/env";
import "./Room.css";

const QUIZ_TOPICS = [
    { id: '상식', label: '상식', emoji: '📚' },
    { id: '이미지', label: '그림', emoji: '🖼️' },
    { id: '사운드', label: '소리', emoji: '🔊' },
];

const LIAR_TOPICS = [
    { id: 'FOOD', label: '음식', emoji: '🍱' },
    { id: 'GAME', label: '게임', emoji: '🎮' },
    { id: 'PLACE', label: '장소', emoji: '📍' },
    { id: 'ANIMAL', label: '동물', emoji: '🐶' },
];

const LIAR_MODES = [
    { id: 'normal', label: '일반', desc: '라이어만 제시어를 모르고, 나머지는 같은 제시어를 받아요.' },
    { id: 'mismatch', label: '미스매치', desc: '라이어도 같은 주제의 다른 제시어를 받아요. 시민인 척하기가 더 쉬워져요.' },
];

const ROUND_MIN = 1;
const ROUND_MAX = 30;
const ROUND_PRESETS = [5, 10, 15, 20];

const Room = () => {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const { alert, confirm } = useAlert();
    const stompClient = useRef<Stomp.Client | null>(null);

    // 상태 관리
    const [userList, setUserList] = useState<{ userId: string, userName: string }[]>([]);
    const [roomMaster, setRoomMaster] = useState<string>("");
    const [roomUserId, setRoomUserId] = useState<string>("");

    const [userName, setUserName] = useState<string>("");
    const [masterName, setMasterName] = useState<string>("");

    const [tempName, setTempName] = useState<string>(() => localStorage.getItem(NICKNAME_KEY) || "");
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
    const [activeTab, setActiveTab] = useState<"chat" | "users">("chat");
    const [roomTitle, setRoomTitle] = useState<string>("");

    // 방 이름 조회
    useEffect(() => {
        if (!roomId) return;
        fetch(`${API_BASE}/room/info/${roomId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((info) => { if (info?.title) setRoomTitle(info.title); })
            .catch((e) => console.error("방 정보 조회 실패", e));
    }, [roomId]);
    const [activeModal, setActiveModal] = useState<"detail" | null>(null);
    const inviteUrl = `${window.location.origin}/room/${roomId}`;
    const isMaster = roomUserId === roomMaster;

    const [selectedMode, setSelectedMode] = useState("who");
    const GAME_NAMES: { [key: string]: string } = {
        who: "주인 찾기",
        what: "퀴즈 대결",
        liar: "라이어 게임"
    };

    const handleModeSelect = (modeId: string) => {
        if (!isMaster) return;

        setSelectedMode(modeId);

        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.send(`/pub/room/update-settings/${roomId}`, {}, JSON.stringify({
                roomId: roomId,
                selectedMode: modeId
            }));
        }
    };

    type GameMode = 'what' | 'liar';
    // 게임별 세부 설정 상태
    const [gameSettings, setGameSettings] = useState({
        what: { topics: ["상식"], round: 5 },
        liar: { topics: ["FOOD"], mode: "normal"}
    });
    const [isGameStarted, setIsGameStarted] = useState(false);

    const updateSetting = (game: 'what' | 'liar', key: string, value: any) => {
        setGameSettings(prev => ({
            ...prev,
            [game]: { ...prev[game], [key]: value }
        }));
    };

    // 3. 주제 다중 선택/해제 핸들러
    const toggleTopic = (game: 'what' | 'liar', topicId: string) => {
        setGameSettings(prev => {
            const currentTopics = prev[game].topics;
            const isSelected = currentTopics.includes(topicId);

            // 이미 선택되어 있으면 제거, 아니면 추가
            const newTopics = isSelected
                ? currentTopics.filter(id => id !== topicId)
                : [...currentTopics, topicId];

            // 최소 한 개는 선택되어 있도록 방어
            if (newTopics.length === 0) return prev;

            return {
                ...prev,
                [game]: { ...prev[game], topics: newTopics }
            };
        });
    };
    const [, setIsLoading] = useState(true);

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
        // 새로고침 시 기존 ID 그대로 재입장 (서버가 같은 사람으로 인식해 퇴장 취소 / 방장 유지)
        const savedId = sessionStorage.getItem(`room_userId_${roomId}`) || crypto.randomUUID();
        sessionStorage.setItem(`room_userId_${roomId}`, savedId);
        try {
            const response = await fetch(`${API_BASE}/room/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userName: name,
                    userId: savedId
                })
            });
            const data = await response.json();
            setIsLoading(false);

            setRoomUserId(savedId);

            setUserName(name);
            if (roomId) localStorage.setItem('last_room_code', roomId);
            if (data.isMaster) {
                setRoomMaster(savedId);
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
        if (!trimmedName) { await alert("이름을 입력해주세요!"); return; }
        if (trimmedName.length > 10) { await alert("이름은 10자 이내로 입력해주세요."); return; }

        // 1. 고유 ID 생성 (이름 중복 방지용)
        const newUserId = crypto.randomUUID();
        try {
            // 2. 서버에 입장 및 방장 체크 요청
            const response = await fetch(`${API_BASE}/room/join`, {
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
            localStorage.setItem(NICKNAME_KEY, trimmedName);
            if (roomId) localStorage.setItem('last_room_code', roomId);
            if (data.isMaster) {
                setRoomMaster(newUserId);
            }
            setShowNameModal(false);

        } catch (error) {
            console.error("입장 처리 실패:", error);
            await alert("입장 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        if (!userName) return;

        const socket = new SockJS(WS_URL);
        const client = Stomp.over(socket);

        client.debug = () => {};
        client.connect({}, () => {
            client.subscribe(`/sub/room/${roomId}`, async (message) => {
                const data = JSON.parse(message.body);

                if (data.roomMaster) setRoomMaster(data.roomMaster);
                if (data.masterName) setMasterName(data.masterName);
                if (data.userList) setUserList(data.userList);
                if (data.maxUser) setMaxUser(data.maxUser);

                if (data.selectedMode) setSelectedMode(data.selectedMode);

                if(data.type == "success") {
                    if (data.gameType) setSelectedMode(data.gameType);
                    setIsGameStarted(true);
                }
                else if(data.type == "ERROR") await alert("게임 시작 실패!");
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
        if (!isMaster) return;

        try {
            const response = await fetch(`${API_BASE}/room/update-settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    maxUser: newMax
                })
            });

            if (!response.ok) throw new Error("설정 변경 실패");
        } catch (error) {
            await alert("최대 인원 변경에 실패했습니다.");
        }
    };

    // 확인 후 방 나가기 (나가기 버튼 / 뒤로 / 홈 / 브라우저 뒤로가기 공용)
    // 반환값: 실제로 나갔는지
    const leaveRoom = async (): Promise<boolean> => {
        // 아직 입장 전(이름 설정 중)이면 확인 없이 나감
        if (showNameModal) {
            navigate("/", { replace: true });
            return true;
        }

        if (!(await confirm("방에서 나가시겠습니까?"))) return false;

        try {
            const response = await fetch(`${API_BASE}/room/leave`, {
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
            if (localStorage.getItem('last_room_code') === roomId) {
                localStorage.removeItem('last_room_code');
            }
            navigate("/", { replace: true });
            return true;

        } catch {
            await alert("방 나가기에 실패했습니다. 다시 시도해주세요.");
            return false;
        }
    };

    // 브라우저 뒤로가기도 나가기 확인
    // (BrowserRouter 에서는 useBlocker 를 쓸 수 없어서 기록을 한 칸 더 쌓아두고 popstate 로 가로챔)
    const leaveRoomRef = useRef(leaveRoom);
    leaveRoomRef.current = leaveRoom;

    useEffect(() => {
        window.history.pushState({ roomGuard: true }, "", window.location.href);

        const handlePopState = async () => {
            const left = await leaveRoomRef.current();
            if (!left) {
                // 취소: 다시 가드 기록을 쌓아 방에 머무름
                window.history.pushState({ roomGuard: true }, "", window.location.href);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [roomId]);

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
            await alert("이름은 10자 이내로 입력해주세요.");
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
            localStorage.setItem(NICKNAME_KEY, trimmedName);
            if (isMaster) setMasterName(trimmedName);
            setIsEditing(false);
        } catch (error) {
            console.error("이름 변경 실패:", error);
            await alert("이름 변경에 실패했습니다.");
        }
    };

    const handleGameStart = async (gameType: GameMode) => { // 'what' 또는 'liar'를 인자로 받음
        if(userList.length < 3) {
            await alert("인원이 부족합니다!");
            return;
        }

        if (stompClient.current?.connected) {
            // 선택된 게임 모드의 설정값만 추출
            const selectedSettings = gameSettings[gameType];

            const payload = {
                gameType: gameType,
                userList: userList,
                settings: selectedSettings
            };

            stompClient.current.send(
                `/pub/game/start/${roomId}`,
                {},
                JSON.stringify(payload)
            );
        }
    };

    if (isGameStarted) {
        if (selectedMode === "liar") {
            return <LiarGame roomId={roomId} userList={userList} stompClient={stompClient.current as Client | null} />;
        }
        if (selectedMode === "what") {
            return <Quiz roomId={roomId} userList={userList} stompClient={stompClient.current as Client | null} roomMaster={roomMaster} onExit={() => setIsGameStarted(false)} />;
        }

        return <div>다른 게임 로딩 중...</div>;
    }

    const navItems: NavItem[] = [
        { key: "home", label: "홈", iconSrc: "/images/room/nav-home.png", onClick: leaveRoom },
        { key: "copy", label: copied ? "복사됨" : "링크 복사", iconSrc: "/images/room/nav-link.png", onClick: handleCopy },
        ...(isMaster ? [{ key: "settings", label: "설정", iconSrc: "/images/room/nav-settings.png", onClick: () => setActiveModal("detail") }] : []),
        { key: "users", label: "참가자", iconSrc: "/images/room/nav-users.png", onClick: () => setActiveTab("users"), active: activeTab === "users" },
        { key: "leave", label: "나가기", iconSrc: "/images/room/nav-exit.png", onClick: leaveRoom, danger: true },
    ];

    // 사이드바 하단 내 프로필 카드
    const profileCard = (
        <div className="rm-profile-card">
            <div className="rm-profile-avatar-wrap">
                <img className="rm-profile-avatar" src={avatarFor(userName)} alt="" />
                {isMaster && <span className="rm-profile-crown">👑</span>}
            </div>
            <strong className="rm-profile-name">{userName || "게스트"}</strong>
            <span className="rm-profile-status"><i /> 온라인</span>
        </div>
    );

    const renderUserName = (user: { userId: string, userName: string }) => {
        const isMe = user.userId === roomUserId;
        if (isMe && isEditing) {
            return (
                <input
                    className="user-name-edit-input"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameUpdate}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                    autoFocus
                    maxLength={10}
                />
            );
        }
        return (
            <div
                className={`user-name-display ${isMe ? "me" : ""}`}
                onClick={() => {
                    if (!isMe) return;
                    setTempName(userName);
                    setIsEditing(true);
                }}
                style={{ cursor: isMe ? 'pointer' : 'default' }}
            >
                <span className="user-name">{user.userName}</span>
                {isMe && (
                    <>
                        <span className="status-text">(나)</span>
                        <Edit2 size={13} className="edit-icon-right" />
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="room-page-wrapper">
            {showNameModal && (
                <div className="name-setup-overlay">
                    <div className="name-setup-modal">
                        <button className="name-setup-close" onClick={() => navigate("/")} title="나가기">
                            <X size={18} />
                        </button>
                        <div className="name-setup-mascot"><img src="/images/room/avatar-1.png" alt="" /></div>
                        <h2>이름 설정</h2>
                        <p>사용하실 이름을 입력해주세요!</p>
                        <div className="name-setup-input-wrap">
                            <User size={18} className="name-setup-input-icon" />
                            <input
                                type="text"
                                placeholder="이름 입력 (최대 10자)"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                autoFocus
                            />
                        </div>
                        <button onClick={handleNameSubmit} className="name-submit-btn">
                            입장하기 <ArrowRight size={17} />
                        </button>
                        <p className="name-setup-hint"><Gamepad2 size={15} /> 좋은 닉네임으로 더 재밌게!</p>
                    </div>
                </div>
            )}

            <AppShell navItems={navItems} blur={showNameModal} sidebarFooter={profileCard} onLogoClick={leaveRoom}>
                <div className="rm-page">
                    {/* 방 헤더 */}
                    <section className="rm-header">
                        <div className="rm-header-top">
                            <button className="rm-back" onClick={leaveRoom}>
                                <ArrowLeft size={18} /> 방 코드 {roomId}
                            </button>
                            <button className="rm-leave" onClick={leaveRoom}>
                                방 나가기 <LogOut size={15} />
                            </button>
                        </div>

                        <div className="rm-hero">
                            <img className="rm-hero-thumb" src="/images/room/room-thumb.png" alt="" />

                            <div className="rm-hero-info">
                                <span className="rm-hero-crown">👑</span>
                                <h2 className="rm-hero-title">{roomTitle || "즐거운 놀이터"}</h2>
                                <span className="rm-hero-host">방장 {masterName || "-"}</span>
                                <div className="rm-badges">
                                    <span className="rm-badge game">
                                        <img src={GAME_ICONS[selectedMode]} alt="" /> {GAME_NAMES[selectedMode] || "게임 선택"}
                                    </span>
                                    <span className="rm-badge plain">
                                        <Users size={16} /> {userList.length}/{maxUser}
                                    </span>
                                    <img className="rm-status-img" src="/images/room/status-waiting.png" alt="대기중" />
                                </div>
                            </div>

                            <div className="rm-hero-invite">
                                <div className="rm-qr">
                                    <QRCodeSVG value={inviteUrl} size={68} bgColor="#ffffff" />
                                </div>
                                <button className="rm-copy" onClick={handleCopy}>
                                    {copied ? <><Check size={13} /> 복사됨</> : <>링크 복사 <Copy size={13} /></>}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* 플레이어 바 */}
                    <section className="rm-player-bar">
                        <img className="rm-player-avatar" src={avatarFor(userName)} alt="" />
                        <strong className="rm-player-name">{userName}</strong>
                        {isMaster && <img className="rm-status-img" src="/images/room/status-host.png" alt="방장" />}
                        <span className="rm-player-count"><Users size={17} /> {userList.length}/{maxUser}</span>
                        <span className="rm-player-divider" />
                        <button className="rm-player-info" onClick={() => (isMaster ? setActiveModal("detail") : setActiveTab("users"))}>
                            <PlusCircle size={16} /> 방 정보
                        </button>
                        <button className="rm-player-leave" onClick={leaveRoom}>
                            <img src="/images/room/nav-exit.png" alt="" /> 나가기
                        </button>
                    </section>

                    <div className="rm-grid">
                        {/* 채팅 / 참여자 */}
                        <section className="rm-panel rm-social">
                            <div className="rm-tabs">
                                <button className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>
                                    <MessageCircle size={17} /> 채팅
                                </button>
                                <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
                                    <Users size={17} /> 참여자 ({userList.length})
                                </button>
                            </div>

                            {/* 채팅은 탭을 바꿔도 메시지가 유지되도록 항상 마운트 */}
                            <div className="rm-tab-body" hidden={activeTab !== "chat"}>
                                {!showNameModal && (
                                    <Chat inline roomId={roomId} stompClient={stompClient.current as Client | null} userId={roomUserId} userName={userName} />
                                )}
                            </div>

                            <div className="rm-tab-body" hidden={activeTab !== "users"}>
                                <div className="rm-users-head">
                                    <span>참가자 {userList.length}/{maxUser}명</span>
                                    <label className="rm-max-user">
                                        최대 인원
                                        <select
                                            className="max-user-select"
                                            value={maxUser}
                                            disabled={!isMaster}
                                            onChange={(e) => handleMaxUserChange(Number(e.target.value))}
                                        >
                                            {[8, 16, 32, 64, 128, 256].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <ul className="rm-user-list">
                                    {userList.map((user, idx) => (
                                        <li key={user.userId || idx} className="rm-user-item">
                                            <img className="rm-user-avatar" src={avatarFor(user.userName)} alt="" />
                                            {renderUserName(user)}
                                            <img
                                                className="rm-status-img small"
                                                src={user.userId === roomMaster ? "/images/room/status-host.png" : "/images/room/status-waiting.png"}
                                                alt={user.userId === roomMaster ? "방장" : "대기중"}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* 게임 패널 */}
                        <section className="rm-panel rm-game">
                            <div className="rm-panel-head">
                                <img className="rm-panel-head-icon" src="/images/room/badge-gamepad.png" alt="" />
                                게임 패널
                                <Sparkles className="rm-panel-head-spark" size={16} />
                            </div>

                            {isMaster ? (
                                <div className="rm-game-body">
                                    <span className="rm-game-label">게임을 선택해주세요</span>
                                    <div className="rm-game-select">
                                        {(["who", "what", "liar"] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                className={`rm-game-tile ${mode} ${selectedMode === mode ? "active" : ""}`}
                                                onClick={() => handleModeSelect(mode)}
                                            >
                                                <img src={GAME_ICONS[mode]} alt="" />
                                                <span>{GAME_NAMES[mode]}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button className="rm-game-sub" onClick={() => setActiveModal("detail")}>
                                        <Settings size={15} /> 세부 설정
                                    </button>
                                    <button
                                        className="rm-start-img-btn"
                                        onClick={() => handleGameStart(selectedMode as GameMode)}
                                        aria-label="게임 시작하기"
                                    >
                                        <img src="/images/room/game-start.png" alt="게임 시작하기" />
                                    </button>
                                </div>
                            ) : (
                                <div className="rm-game-body waiting">
                                    <img className="rm-waiting-art" src="/images/room/game-panel-art.png" alt="" />
                                    <strong>지금은 채팅 시간!</strong>
                                    <p>방장만 게임을 시작할 수 있어요.<br />조금만 기다려주세요.</p>
                                    <span className="rm-badge game">
                                        <img src={GAME_ICONS[selectedMode]} alt="" /> {GAME_NAMES[selectedMode] || "대기중"}
                                    </span>
                                    <img className="rm-sticker" src="/images/room/sticker-fighting.png" alt="화이팅!" />
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </AppShell>

            {activeModal && (
                <div className="settings-overlay" onClick={() => setActiveModal(null)}>
                    <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-handle" />

                        <header className="settings-head">
                            <img className="settings-game-icon" src={GAME_ICONS[selectedMode]} alt="" />
                            <div className="settings-title">
                                <small>게임 세부 설정</small>
                                <h3>{GAME_NAMES[selectedMode] || "게임"}</h3>
                            </div>
                            <button className="settings-close" onClick={() => setActiveModal(null)} title="닫기">
                                <X size={18} />
                            </button>
                        </header>

                        <div className="settings-body">
                            {selectedMode === "who" && (
                                <div className="settings-empty">
                                    <Sparkles size={28} />
                                    <strong>따로 설정할 게 없어요</strong>
                                    <p>말투만 보고 누가 썼는지 맞히는 게임이에요.<br />바로 시작해보세요!</p>
                                </div>
                            )}

                            {selectedMode === "what" && (
                                <>
                                    <section className="settings-section">
                                        <div className="settings-label">
                                            <strong>문제 주제</strong>
                                            <span>여러 개 선택 가능</span>
                                        </div>
                                        <div className="settings-chips">
                                            {QUIZ_TOPICS.map((topic) => {
                                                const active = gameSettings.what.topics.includes(topic.id);
                                                return (
                                                    <button
                                                        key={topic.id}
                                                        className={`settings-chip ${active ? "active" : ""}`}
                                                        onClick={() => toggleTopic('what', topic.id)}
                                                    >
                                                        <span className="settings-chip-emoji">{topic.emoji}</span>
                                                        {topic.label}
                                                        {active && <Check size={15} className="settings-chip-check" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section className="settings-section">
                                        <div className="settings-label">
                                            <strong>문제 수</strong>
                                            <span>{ROUND_MIN}~{ROUND_MAX}문제</span>
                                        </div>
                                        <div className="settings-stepper">
                                            <button
                                                onClick={() => updateSetting('what', 'round', Math.max(ROUND_MIN, gameSettings.what.round - 1))}
                                                disabled={gameSettings.what.round <= ROUND_MIN}
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <span><strong>{gameSettings.what.round}</strong>문제</span>
                                            <button
                                                onClick={() => updateSetting('what', 'round', Math.min(ROUND_MAX, gameSettings.what.round + 1))}
                                                disabled={gameSettings.what.round >= ROUND_MAX}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="settings-presets">
                                            {ROUND_PRESETS.map((n) => (
                                                <button
                                                    key={n}
                                                    className={gameSettings.what.round === n ? "active" : ""}
                                                    onClick={() => updateSetting('what', 'round', n)}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}

                            {selectedMode === "liar" && (
                                <>
                                    <section className="settings-section">
                                        <div className="settings-label">
                                            <strong>제시어 주제</strong>
                                            <span>여러 개 선택 가능</span>
                                        </div>
                                        <div className="settings-chips">
                                            {LIAR_TOPICS.map((topic) => {
                                                const active = gameSettings.liar.topics.includes(topic.id);
                                                return (
                                                    <button
                                                        key={topic.id}
                                                        className={`settings-chip ${active ? "active" : ""}`}
                                                        onClick={() => toggleTopic('liar', topic.id)}
                                                    >
                                                        <span className="settings-chip-emoji">{topic.emoji}</span>
                                                        {topic.label}
                                                        {active && <Check size={15} className="settings-chip-check" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section className="settings-section">
                                        <div className="settings-label">
                                            <strong>게임 모드</strong>
                                        </div>
                                        <div className="settings-options">
                                            {LIAR_MODES.map((mode) => (
                                                <button
                                                    key={mode.id}
                                                    className={`settings-option ${gameSettings.liar.mode === mode.id ? "active" : ""}`}
                                                    onClick={() => updateSetting('liar', 'mode', mode.id)}
                                                >
                                                    <span className="settings-radio" />
                                                    <span className="settings-option-text">
                                                        <strong>{mode.label}</strong>
                                                        <small>{mode.desc}</small>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>

                        <footer className="settings-foot">
                            <button className="settings-done" onClick={() => setActiveModal(null)}>
                                완료
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Room;
