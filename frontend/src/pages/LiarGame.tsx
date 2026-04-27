import React, { useState } from "react";
import Header from "../components/Header";
import "./LiarGame.css";

interface LiarGameProps {
  roomId: string | undefined;
  userList: { userId: string; userName: string }[];
}

const LiarGame: React.FC<LiarGameProps> = ({ roomId, userList }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="liar-game-container">
      <Header />

      <main className="main-content">
        <button className="modal-toggle-btn" onClick={toggleModal}>?</button>

        {/* 1. 채팅 영역 */}
        <section className="chat-section card-panel">
          <h3>CHATTING</h3>
          <div className="chat-content">
            
          </div>
        </section>

        {/* 2. 중앙 입력 및 이름 영역 */}
        <section className="input-section">
          <div className="input-box card-panel">
            <textarea placeholder="설명을 입력하세요..."></textarea>
          </div>
          <div className="user-name-tag card-panel">
            {/* 현재 내 이름을 표시하고 싶다면 추가 로직이 필요할 수 있습니다 */}
            USER NAME
          </div>
        </section>

        {/* 3. 발언 순서 영역 - 부모가 준 userList를 실제로 출력 */}
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

      {/* 모달 창 (생략) */}
    </div>
  );
};

export default LiarGame;