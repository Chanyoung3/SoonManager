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

  const [sortedUserList, setSortedUserList] = useState(userList);
  const [targetWord, setTargetWord] = useState<string>("");
  const userName = sessionStorage.getItem(`room_userName_${roomId}`);
  const [myRole, setMyRole] = useState<string>("");

  const [turnIndex, setTurnIndex] = useState(0); // 현재 발언 중인 유저의 인덱스
  const [userInputs, setUserInputs] = useState<{ [key: string]: string }>({}); // {userId: "입력내용"}
  const [currentInput, setCurrentInput] = useState(""); // 현재 내가 타이핑 중인 내용

  const myId = sessionStorage.getItem(`room_userId_${roomId}`);
  const isMyTurn = sortedUserList[turnIndex]?.userId === myId;

  const [turnCountdown, setTurnCountdown] = useState(20);
  useEffect(() => {
    if (!stompClient || !stompClient.connected) return;

    const subscription = stompClient.subscribe(`/sub/game/liar/${roomId}`, (message) => {
      const payload = JSON.parse(message.body);
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

      if (payload.type === "TALK") {
        setUserInputs(prev => ({
          ...prev,
          [payload.userId]: payload.content
        }));

        if (turnIndex !== userList.length) {
          setTurnIndex(payload.nextIndex);
        }
        else{
          setIsStarted(false);
          handleSelectLiar();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [stompClient, roomId]);

  useEffect(() => {
    if (!stompClient || !stompClient.connected) return;
    if (!isStarted) setIsStarted(true);

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);

        // countdown이 3일 때 서버로 데이터 전송
        if (countdown === 3) {
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

  const handleSendMessage = () => {
    if (!currentInput.trim() || !isMyTurn) return;

    (stompClient as any).send(
      `/pub/game/talk/${roomId}`,
      {},
      JSON.stringify({
        userId: myId,
        content: currentInput,
        turnIndex: turnIndex,
        LastIndex: userList.length
      })
    );
    setCurrentInput(""); // 입력창 초기화
  };

  useEffect(() => {
    if (isGameStarting) return; // 게임 시작 전엔 작동 X

    setTurnCountdown(20); // 새로운 턴이 시작되면 20초로 초기화

    const timer = setInterval(() => {
      setTurnCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turnIndex, isGameStarting]); // turnIndex가 변경될 때마다 타이머 재시작

  const handleSelectLiar = () => {
    
  }

  useEffect(() => {
    if (turnCountdown === 0 && isMyTurn) {
      handleAutoSkip();
    }
  }, [turnCountdown, isMyTurn]);

  const handleAutoSkip = () => {
    if (!isMyTurn) return;

    const autoMessage = "발언 하지 않음";
    (stompClient as any).send(
      `/pub/game/talk/${roomId}`,
      {},
      JSON.stringify({
        userId: myId,
        content: autoMessage,
        turnIndex: turnIndex,
        LastIndex: userList.length
      })
    );
    setCurrentInput("");
  };

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

      {!isGameStarting && isStarted && (
        <div className="turn-timer-panel card-panel">
          <div className="current-turn-info">
            <strong>{sortedUserList[turnIndex]?.userName}</strong>님의 차례입니다.
          </div>
          <div className={`turn-countdown ${turnCountdown <= 5 ? "urgent" : ""}`}>
            남은 시간: {turnCountdown}초
          </div>
          <div className="timer-progress-bg">
            <div className="timer-progress-bar" style={{ width: `${(turnCountdown / 20) * 100}%` }}></div>
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
          <div className={`input-box card-panel ${isMyTurn ? "active-turn" : "disabled-turn"}`}>
            <textarea
              placeholder={isMyTurn ? "당신의 차례입니다. 설명을 입력하세요!" : "다른 플레이어의 순서를 기다리는 중..."}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              disabled={!isMyTurn}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            {isMyTurn && <button onClick={handleSendMessage} className="send-btn">전송</button>}
          </div>
          <div className="user-name-tag card-panel">
            {userName} {isMyTurn && <span className="my-turn-indicator"> (내 차례)</span>}
          </div>
        </section>

        {/* 3. 발언 순서 영역 */}
        <section className="order-section card-panel">
          <h3 style={{ borderBottom: "2px solid black", marginBottom: "15px" }}>순서</h3>
          <div className="order-list">
            {sortedUserList.map((user, index) => (
              <div key={user.userId} className={`order-item ${index === turnIndex ? "active" : ""}`}>
                <div className="order-user-info">
                  {index + 1}. {user.userName}
                </div>

              </div>
            ))}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={toggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>LOG LIST</h2>
            <hr />
            <div className="log-list-container">
              {sortedUserList.map((user, index) => (
                <p key={user.userId}>
                  <strong>{user.userName}:</strong> {userInputs[user.userId] || "(아직 입력 전입니다)"}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiarGame;