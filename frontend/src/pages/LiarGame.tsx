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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);

        if (countdown === 3) {
          // 예: socket.emit("get_game_info", roomId);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const startTimer = setTimeout(() => {
        setIsGameStarting(false);
      }, 500);
      return () => clearTimeout(startTimer);
    }
  }, [countdown]);

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
            USER NAME
          </div>
        </section>

        {/* 3. 발언 순서 영역 */}
        <section className="order-section card-panel">
          <h3 style={{ borderBottom: "2px solid black", marginBottom: "15px" }}>순서</h3>
          <div className="order-list">
            {userList && userList.length > 0 ? (
              userList.map((user, index) => (
                <div key={user.userId || index} className="order-item">
                  {index + 1}. {user.userName}
                </div>
              ))
            ) : (
              <div className="order-item">참가자 정보를 불러오는 중...</div>
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