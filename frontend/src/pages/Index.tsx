import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, SquarePlus, List, Plus, LogIn, Gamepad2, ArrowRight, RotateCw, Users, Crown, X } from 'lucide-react';
import AppShell, { type NavItem } from "../components/AppShell";
import { useAlert } from "../components/AlertProvider";
import { GAME_ICONS, GAME_NAMES } from "../components/avatar";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { API_BASE, WS_URL } from "../config/env";
import "./Index.css";

interface RoomSummary {
  code: string;
  title: string | null;
  masterName: string | null;
  gameMode: string;
  currentMember: number;
  maxMember: number;
}

const ROOM_LIST_TOPIC = "/sub/room-list";
const TITLE_MAX_LENGTH = 20;

const Index = () => {
  const navigate = useNavigate();
  const { alert } = useAlert();
  const [roomTitle, setRoomTitle] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const listRef = useRef<HTMLElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [listHighlight, setListHighlight] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/room/list`);
      if (response.ok) setRooms(await response.json());
    } catch (error) {
      console.error("방 목록 조회 실패", error);
    } finally {
      setIsListLoading(false);
    }
  }, []);

  // 처음 한 번 조회 후, 방 목록이 바뀔 때마다 서버가 보내주는 목록을 WebSocket 으로 받음
  useEffect(() => {
    fetchRooms();

    const client = Stomp.over(new SockJS(WS_URL));
    client.debug = () => {};
    client.connect({}, () => {
      client.subscribe(ROOM_LIST_TOPIC, (message) => {
        setRooms(JSON.parse(message.body));
      });
    }, (error) => {
      console.error("방 목록 소켓 연결 실패", error);
    });

    return () => {
      if (client.connected) client.disconnect(() => {});
    };
  }, [fetchRooms]);

  const createRoom = async () => {
    try {
      const response = await fetch(`${API_BASE}/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: roomTitle.trim() }),
      });
      const code = await response.text();
      navigate(`/room/${code}`);
    } catch {
      await alert("방 생성 실패");
    }
  };

  const joinRoom = async (code: string) => {
    try {
      const response = await fetch(`${API_BASE}/room/check/${code}`);
      const isExist = await response.json();

      if (isExist) {
        navigate(`/room/${code}`);
      } else {
        await alert("방이 존재하지 않습니다.");
        fetchRooms();
      }
    } catch {
      await alert("서버 연결 오류");
    }
  };

  const enterRoom = async () => {
    if (!roomCode.trim()) return await alert("코드를 입력하세요");
    await joinRoom(roomCode.trim());
  };

  // 방 목록 위치로 이동 + 잠깐 강조
  const scrollToList = () => {
    const el = listRef.current;
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: "smooth" });
    setListHighlight(true);
    setTimeout(() => setListHighlight(false), 1200);
  };

  const navItems: NavItem[] = [
    { key: "home", label: "홈", icon: Home, onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }), active: true },
    { key: "create", label: "방 만들기", icon: SquarePlus, onClick: () => setShowCreateModal(true) },
    { key: "list", label: "방 목록", icon: List, onClick: scrollToList },
  ];

  return (
    <AppShell navItems={navItems}>
      <section className="home-hero">
        <div className="home-hero-text">
          <p className="home-hero-tagline">함께하는 게임, 더 즐거운 시간!</p>
          <h2 className="home-hero-title">
            찬영의 <span className="home-hero-accent">놀이터</span>
            <Gamepad2 className="home-hero-title-icon" size={44} />
          </h2>
          <p className="home-hero-sub">친구들과 함께하는 다양한 게임을 즐겨보세요!</p>
        </div>

        <div className="home-hero-art" aria-hidden="true">
          <span className="home-hero-streak s1" />
          <span className="home-hero-streak s2" />
          <img className="home-hero-character" src="/images/hero-character.png" alt="" />
        </div>
      </section>

      <section className="home-card-grid">
        <article className="home-card purple">
          <span className="home-card-icon"><Plus size={24} /></span>
          <h3>방 만들기</h3>
          <p>방 이름을 정하고<br />친구들을 초대해보세요!</p>
          <div className="home-card-join">
            <input
              type="text"
              value={roomTitle}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) => setRoomTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              placeholder={`방 이름 (최대 ${TITLE_MAX_LENGTH}자)`}
            />
            <button className="solid" onClick={createRoom}>
              만들기 <ArrowRight size={16} />
            </button>
          </div>
          <img className="home-card-deco create" src="/images/card-create.png" alt="" />
        </article>

        <article className="home-card blue">
          <span className="home-card-icon"><LogIn size={24} /></span>
          <h3>방 코드로 참여</h3>
          <p>친구가 공유한 방 코드를 입력해<br />게임에 참여할 수 있어요!</p>
          <div className="home-card-join">
            <input
              type="text"
              value={roomCode}
              maxLength={6}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enterRoom()}
              placeholder="방 코드 입력"
            />
            <button onClick={enterRoom}>참여</button>
          </div>
          <img className="home-card-deco join" src="/images/card-join.png" alt="" />
        </article>
      </section>

      <section className={`home-room-list ${listHighlight ? "highlight" : ""}`} ref={listRef}>
        <div className="home-room-list-head">
          <h3>지금 열린 방 <span>{rooms.length}</span></h3>
          <button className="home-room-refresh" onClick={fetchRooms} title="새로고침">
            <RotateCw size={16} /> 새로고침
          </button>
        </div>

        {isListLoading ? (
          <p className="home-room-empty">방 목록을 불러오는 중...</p>
        ) : rooms.length === 0 ? (
          <p className="home-room-empty">아직 열린 방이 없어요. 첫 번째 방을 만들어보세요!</p>
        ) : (
          <ul className="home-room-rows">
            {rooms.map((room) => {
              const isFull = room.currentMember >= room.maxMember;
              return (
                <li key={room.code}>
                  <button className="home-room-row" onClick={() => joinRoom(room.code)} disabled={isFull}>
                    <img className="home-room-game-icon" src={GAME_ICONS[room.gameMode] || GAME_ICONS.who} alt="" />
                    <div className="home-room-main">
                      <strong className="home-room-title">{room.title || "즐거운 놀이터"}</strong>
                      <span className="home-room-host"><Crown size={13} /> {room.masterName || "방장"}</span>
                    </div>
                    <span className="home-room-game">{GAME_NAMES[room.gameMode] || "게임 선택 중"}</span>
                    <span className={`home-room-count ${isFull ? "full" : ""}`}>
                      <Users size={15} /> {room.currentMember}/{room.maxMember}
                    </span>
                    <span className="home-room-enter">{isFull ? "만석" : "참여"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <img className="home-banner" src="/images/banner.png" alt="같이 놀자! 즐거운 게임, 좋은 사람들과!" />

      {showCreateModal && (
        <div className="home-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="home-modal" onClick={(e) => e.stopPropagation()}>
            <button className="home-modal-close" onClick={() => setShowCreateModal(false)} title="닫기">
              <X size={18} />
            </button>
            <span className="home-card-icon"><Plus size={24} /></span>
            <h3>방 만들기</h3>
            <p>방 이름을 정하고 친구들을 초대해보세요!</p>
            <input
              type="text"
              value={roomTitle}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) => setRoomTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              placeholder={`방 이름 (최대 ${TITLE_MAX_LENGTH}자)`}
              autoFocus
            />
            <button className="home-modal-submit" onClick={createRoom}>
              방 만들기 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Index;
