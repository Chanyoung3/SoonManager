import React, { useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import Header from "../components/Header";
import "./LiarGame.css";

interface LiarGameProps {
  roomId: string | undefined;
  userList: { userId: string; userName: string }[];
  stompClient: Client | null;
}

const LiarGame: React.FC<LiarGameProps> = ({ roomId, userList, stompClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [countdown, setCountdown] = useState(5);
  const [isGameStarting, setIsGameStarting] = useState(true);

  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const [isStarted, setIsStarted] = useState(false); //게임 시작 여부

  // 1. 서버에서 정렬된 유저 리스트나 게임 정보를 담을 state (필요시)
  const [sortedUserList, setSortedUserList] = useState(userList);
  const [targetWord, setTargetWord] = useState<string>("");
  const userName = sessionStorage.getItem(`room_userName_${roomId}`);
  const [myRole, setMyRole] = useState<string>("");

  useEffect(() => {
    // 클라이언트가 연결되어 있지 않으면 구독 불가
    if (!stompClient || !stompClient.connected) return;

    // 2. 백엔드의 convertAndSend 주소와 일치해야 함
    const subscription = stompClient.subscribe(`/sub/game/liar/${roomId}`, (message) => {
      const payload = JSON.parse(message.body);
      console.log("서버로부터 받은 메시지:", payload);
      const myId = sessionStorage.getItem(`room_userId_${roomId}`);

      if (payload.userList) {
        setSortedUserList(payload.userList);
      }
      if (myId === payload.liar) {
        setTargetWord(payload.fake_word);
        setMyRole("LIAR");
      }
      else {
        setTargetWord(payload.target_word);
        setMyRole("CITIZEN");
      }

      // 라운드 정보나 라이어 정보가 들어있다면 여기서 처리
    });

    // 3. 컴포넌트 언마운트 시 구독 해제 (중복 구독 방지)
    return () => {
      subscription.unsubscribe();
    };
  }, [stompClient, roomId]); // roomId가 바뀌거나 client가 처음 연결될 때 실행

  useEffect(() => {
    if (!stompClient || !stompClient.connected) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);

        // countdown이 3일 때 서버로 데이터 전송
        if (countdown === 3) {
          // 'as any'를 사용하여 타입 체크를 일시적으로 우회하고 send 호출
          (stompClient as any).send(
            `/pub/game/info/${roomId}`,
            {},
            JSON.stringify({ userList: userList })
          );
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const startTimer = setTimeout(() => {
        setIsGameStarting(false);
      }, 500);
      return () => clearTimeout(startTimer);
    }
  }, [countdown, stompClient, roomId]); // 필요한 의존성 추가

  return (
    <div className="liar-game-container">
      <Header />

      {/* 카운트다운 오버레이 */}
      {isGameStarting && (
        <div className="countdown-overlay">
          <div className="countdown-content">
            <h2>라이어 선정 중입니다!</h2>
            <div className="countdown-number">{countdown > 0 ? countdown : "START!"}</div>
          </div>
        </div>
      )}

      {!isGameStarting && targetWord && (
        <div className="target-word-display card-panel">
          <span className="target-label">제시어 : </span>
          <span className="target-value">{targetWord}</span>
        </div>
      )}

      {!isGameStarting && (
        <div className="game-info-display">
          <div className={`role-badge ${myRole === "LIAR" ? "liar" : "citizen"}`}>
            당신의 역할: {myRole === "LIAR" ? "🔴 라이어" : "🔵 시민"}
          </div>
        </div>
      )}

      <main className={`main-content ${isGameStarting ? "blur" : ""}`}>
        <button className="modal-toggle-btn" onClick={toggleModal}>?</button>

        {/* 1. 채팅 영역 */}
        <section className="chat-section card-panel">
          <h3>CHATTING</h3>
          <div className="chat-content"></div>
        </section>

        {/* 2. 중앙 입력 및 이름 영역 */}
        <section className="input-section">
          <div className="input-box card-panel">
            <textarea placeholder="설명을 입력하세요..."></textarea>
          </div>
          <div className="user-name-tag card-panel">
            {userName}
          </div>
        </section>

        {/* 3. 발언 순서 영역 */}
        <section className="order-section card-panel">
          <h3 style={{ borderBottom: "2px solid black", marginBottom: "15px" }}>순서</h3>
          <div className="order-list">
            {/* props로 받은 userList가 아니라, 서버에서 받아 업데이트된 sortedUserList를 사용 */}
            {sortedUserList && sortedUserList.length > 0 ? (
              sortedUserList.map((user, index) => (
                <div key={user.userId} className="order-item">
                  {index + 1}. {user.userName}
                </div>
              ))
            ) : (
              <div className="order-item">순서를 정하는 중...</div>
            )}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={toggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>LOG LIST</h2>
              <button onClick={toggleModal} style={{ background: "none", border: "none", fontSize: "30px", cursor: "pointer" }}>×</button>
            </div>
            <hr style={{ border: "2px solid black", margin: "15px 0" }} />
            <div>
              <p>김철수: "사과입니다."</p>
              <p>이영희: "빨갛습니다."</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiarGame;