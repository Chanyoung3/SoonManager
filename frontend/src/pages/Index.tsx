import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  
  const createRoom = () => {
    navigate("/room");
  }

  return (
    <>
      <Header />
      <div className="button-wrapper">
        <button className="createRoom" onClick={createRoom}>방 만들기</button>
        <div className="input-group">
          <input 
            type="text"
            className="entercode" 
            placeholder="방 코드 입력"
            maxLength={6} 
          />
          <button className="enterroom">참여</button>
        </div>
      </div>
    </>
  );
}

export default Index;