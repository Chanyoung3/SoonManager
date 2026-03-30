import React from "react";
import Header from "../components/Header";
import "./index.css";

function Index() {
  return (
    <>
      <Header />
      <div className="button-wrapper">
        <button className="createRoom">방 만들기</button>
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