import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import Header from "../components/Header";
import Chat from "../components/Chat";
import { API_BASE } from "../config/env";
import "./Quiz.css";

interface QuizProps {
    roomId: string | undefined;
    userList: { userId: string; userName: string }[];
    stompClient: Client | null;
    roomMaster: string;
    onExit: () => void;
}

interface QuestionPayload {
    type: "QUESTION";
    questionId: string;
    qtype: "TEXT" | "IMAGE" | "AUDIO";
    category: string;
    questionText: string;
    media: string | null;
    round: number;
    totalRounds: number;
}

interface ProgressPayload {
    type: "PROGRESS";
    answeredCount: number;
    totalCount: number;
}

interface ResultEntry {
    userId: string;
    userName: string;
    answer: string | null;
    correct: boolean;
    gained: number;
    totalScore: number;
}

interface RevealPayload {
    type: "REVEAL";
    correctAnswer: string;
    results: ResultEntry[];
    round: number;
    totalRounds: number;
    lastRound: boolean;
}

interface FinishedPayload {
    type: "FINISHED";
    finalRanking: ResultEntry[];
}


const Quiz: React.FC<QuizProps> = ({ roomId, userList, stompClient, roomMaster, onExit }) => {
    const myId = sessionStorage.getItem(`room_userId_${roomId}`) || "";
    const myName = sessionStorage.getItem(`room_userName_${roomId}`) || "";
    const isMaster = myId === roomMaster;
    const playerCount = userList.filter((u) => u.userId !== roomMaster).length;

    const [phase, setPhase] = useState<"starting" | "question" | "reveal" | "finished">("starting");
    const [startCountdown, setStartCountdown] = useState(3);

    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [answer, setAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [progress, setProgress] = useState<ProgressPayload>({ type: "PROGRESS", answeredCount: 0, totalCount: playerCount });
    const [reveal, setReveal] = useState<RevealPayload | null>(null);
    const [finalRanking, setFinalRanking] = useState<ResultEntry[] | null>(null);
    const [scoreboard, setScoreboard] = useState<ResultEntry[]>(
        userList
            .filter((u) => u.userId !== roomMaster)
            .map((u) => ({ userId: u.userId, userName: u.userName, answer: null, correct: false, gained: 0, totalScore: 0 }))
    );

    const questionRef = useRef(question);
    questionRef.current = question;

    // 서버 메시지 구독
    useEffect(() => {
        if (!stompClient || !stompClient.connected || !roomId) return;

        const subscription = stompClient.subscribe(`/sub/game/quiz/${roomId}`, (message) => {
            const data = JSON.parse(message.body);

            if (data.type === "QUESTION") {
                const q = data as QuestionPayload;
                setQuestion(q);
                setAnswer("");
                setSubmitted(false);
                setProgress({ type: "PROGRESS", answeredCount: 0, totalCount: playerCount });
                setReveal(null);
                setPhase("question");
            } else if (data.type === "PROGRESS") {
                setProgress(data as ProgressPayload);
            } else if (data.type === "REVEAL") {
                const r = data as RevealPayload;
                setReveal(r);
                setScoreboard(r.results);
                setPhase("reveal");
            } else if (data.type === "FINISHED") {
                const f = data as FinishedPayload;
                setFinalRanking(f.finalRanking);
                setScoreboard(f.finalRanking);
                setPhase("finished");
            }
        });

        return () => subscription.unsubscribe();
    }, [stompClient, roomId, playerCount]);

    // 시작 카운트다운 -> 첫 문제 요청 (모든 클라이언트가 구독을 마칠 시간을 확보)
    useEffect(() => {
        if (phase !== "starting") return;

        if (startCountdown <= 0) return;

        const timer = setTimeout(() => {
            const next = startCountdown - 1;
            setStartCountdown(next);
            if (next === 0 && stompClient?.connected) {
                (stompClient as any).send(`/pub/quiz/info/${roomId}`, {}, JSON.stringify({}));
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [phase, startCountdown, stompClient, roomId]);

    const handleSubmit = () => {
        if (submitted || !questionRef.current || !stompClient?.connected) return;
        setSubmitted(true);

        (stompClient as any).send(`/pub/quiz/answer/${roomId}`, {}, JSON.stringify({
            userId: myId,
            questionId: questionRef.current.questionId,
            answer,
        }));
    };

    const handleReveal = () => {
        if (!stompClient?.connected) return;
        (stompClient as any).send(`/pub/quiz/reveal/${roomId}`, {}, JSON.stringify({}));
    };

    const handleNext = () => {
        if (!stompClient?.connected) return;
        (stompClient as any).send(`/pub/quiz/next/${roomId}`, {}, JSON.stringify({}));
    };

    const sortedScoreboard = [...scoreboard].sort((a, b) => b.totalScore - a.totalScore);
    const medal = (idx: number) => (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`);
    const allAnswered = progress.totalCount > 0 && progress.answeredCount >= progress.totalCount;

    return (
        <div className="quiz-container">
            <Header />

            {phase === "starting" && (
                <div className="quiz-overlay">
                    <div className="quiz-overlay-content">
                        <h2 className="game-title">문제를 준비하고 있어요!</h2>
                        <div className="quiz-countdown-number">{startCountdown > 0 ? startCountdown : "START!"}</div>
                    </div>
                </div>
            )}

            {phase === "finished" && finalRanking && (
                <div className="quiz-overlay">
                    <div className="quiz-overlay-content quiz-final-panel game-fade-in">
                        <h2 className="game-title">🏆 최종 결과</h2>
                        <div className="quiz-final-list">
                            {finalRanking.map((r, idx) => (
                                <div key={r.userId} className={`quiz-final-row rank-${idx + 1}`}>
                                    <span className="quiz-rank">{medal(idx)}</span>
                                    <span className="quiz-final-name">{r.userName}</span>
                                    <span className="quiz-final-score">{r.totalScore}점</span>
                                </div>
                            ))}
                        </div>
                        <button className="quiz-exit-btn game-btn" onClick={onExit}>대기방으로 돌아가기</button>
                    </div>
                </div>
            )}

            {(phase === "question" || phase === "reveal") && question && (
                <main className="quiz-main">
                    <section className="quiz-play-area">
                        <div className="quiz-topbar game-card">
                            <span className="quiz-round">문제 {question.round} / {question.totalRounds}</span>
                            <span className="quiz-category">{question.category}</span>
                            {isMaster && <span className="quiz-host-badge">👑 진행자</span>}
                        </div>

                        <div className="quiz-question-card game-card game-fade-in">
                            <p className="quiz-question-text">{question.questionText}</p>

                            {question.qtype === "IMAGE" && question.media && (
                                <img className="quiz-media-image" src={`${API_BASE}${question.media}`} alt="퀴즈 이미지" />
                            )}
                            {question.qtype === "AUDIO" && question.media && (
                                <audio className="quiz-media-audio" controls src={`${API_BASE}${question.media}`} />
                            )}
                        </div>

                        {phase === "question" && !isMaster && (
                            <div className="quiz-answer-row">
                                <input
                                    className="quiz-answer-input"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    placeholder={submitted ? "제출 완료! 진행자가 정답을 공개할 때까지 기다려주세요" : "정답을 입력하세요"}
                                    disabled={submitted}
                                    autoFocus
                                />
                                <button className="quiz-submit-btn game-btn" onClick={handleSubmit} disabled={submitted}>
                                    {submitted ? "제출됨" : "제출"}
                                </button>
                            </div>
                        )}

                        {phase === "question" && (
                            <div className="quiz-progress">
                                <div className="quiz-progress-bar-bg">
                                    <div
                                        className="quiz-progress-bar"
                                        style={{ width: `${(progress.answeredCount / Math.max(1, progress.totalCount)) * 100}%` }}
                                    />
                                </div>
                                <span>{progress.answeredCount} / {progress.totalCount}명 제출 완료</span>
                            </div>
                        )}

                        {phase === "question" && isMaster && (
                            <div className="quiz-host-controls">
                                <button className="quiz-host-btn game-btn" onClick={handleReveal}>
                                    {allAnswered ? "정답 공개" : "정답 공개 (아직 응답 중인 참가자가 있어요)"}
                                </button>
                            </div>
                        )}

                        {phase === "reveal" && reveal && (
                            <div className="quiz-reveal-panel game-fade-in">
                                <p className="quiz-correct-answer">
                                    정답: <strong>{reveal.correctAnswer}</strong>
                                </p>
                                <div className="quiz-reveal-list">
                                    {reveal.results.map((r) => (
                                        <div key={r.userId} className={`quiz-reveal-row ${r.correct ? "correct" : "wrong"}`}>
                                            <span className="quiz-reveal-name">{r.userName}</span>
                                            <span className="quiz-reveal-answer">{r.answer || "(무응답)"}</span>
                                            <span className="quiz-reveal-mark">{r.correct ? `✅ +${r.gained}` : "❌"}</span>
                                        </div>
                                    ))}
                                </div>

                                {isMaster ? (
                                    <div className="quiz-host-controls">
                                        <button className="quiz-host-btn game-btn" onClick={handleNext}>
                                            {reveal.lastRound ? "최종 결과 보기" : "다음 문제로 이동"}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="quiz-next-hint">진행자가 다음 문제를 준비하고 있어요...</p>
                                )}
                            </div>
                        )}
                    </section>

                    <aside className="quiz-scoreboard game-card">
                        <h3 className="game-title">SCORE</h3>
                        <div className="quiz-scoreboard-list">
                            {sortedScoreboard.map((s, idx) => (
                                <div key={s.userId} className={`quiz-scoreboard-row ${s.userId === myId ? "me" : ""}`}>
                                    <span className="quiz-rank">{medal(idx)}</span>
                                    <span className="quiz-scoreboard-name">{s.userName}</span>
                                    <span className="quiz-scoreboard-score">{s.totalScore}</span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </main>
            )}

            <Chat roomId={roomId} stompClient={stompClient} userId={myId} userName={myName} />
        </div>
    );
};

export default Quiz;
