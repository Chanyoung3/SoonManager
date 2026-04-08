import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const createRoom = async () => {
    try {
      const response = await fetch('http://localhost:8080/room/create', { method: 'POST' });
      const code = await response.text();
      navigate(`/room/${code}`);
    } catch (error) {
      alert("방 생성 실패");
    }
  };

  const enterRoom = async () => {
    if (!roomCode.trim()) return alert("코드를 입력하세요");

    try {
      const response = await fetch(`http://localhost:8080/room/check/${roomCode}`);
      const isExist = await response.json();

      if (isExist) {
        navigate(`/room/${roomCode}`);
      } else {
        alert("방이 존재하지 않습니다.");
      }
    } catch (error) {
      alert("서버 연결 오류");
    }
  };

  return (
    <>
      <Header />
      <div className="button-wrapper">
        <button className="createRoom" onClick={createRoom}>방 만들기</button>
        <div className="input-group">
          <input 
            type="text" value={roomCode} maxLength={6}
            onChange={(e) => setRoomCode(e.target.value)} 
            placeholder="방 코드 입력" className="entercode" 
          />
          <button className="enterroom" onClick={enterRoom}>참여</button>
        </div>
      </div>
    </>
  );
};

export default Index;