import React, { useState } from "react";
import Header from "../components/Header";
import "./LiarGame.css"; // CSS 파일 임포트

const LiarGame = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="liar-game-container">
      <Header />

      <main className="main-content">
        {/* 모달 토글 버튼 */}
        <button className="modal-toggle-btn" onClick={toggleModal}>?</button>

        {/* 1. 채팅 영역 */}
        <section className="chat-section card-panel">
          <h3>CHATTING</h3>
          <div className="chat-content">
            <p><b>System:</b> 게임이 시작되었습니다.</p>
          </div>
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
          <h3 style={{ borderBottom: "2px solid black", marginBottom: "15px" }}>ORDER</h3>
          <div className="order-list">
            <div className="order-item">1. 김철수</div>
            <div className="order-item">2. 이영희</div>
            <div className="order-item">3. 박지민</div>
          </div>
        </section>
      </main>

      {/* 모달 창 */}
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