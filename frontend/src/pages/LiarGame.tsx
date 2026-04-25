import React from "react";
import Header from "../components/Header";

const LiarGame = () => {
    return (
        <>
            <Header />
            <textarea placeholder="설명을 입력하세요"></textarea>
            <h1>이름</h1>

            <div className="ex_list">

            </div>
        </>

    );
};

export default LiarGame;