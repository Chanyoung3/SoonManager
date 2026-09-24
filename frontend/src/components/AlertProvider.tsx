import React, { createContext, useContext, useRef, useState } from "react";
import "./AlertProvider.css";

type AlertState = { kind: "alert" | "confirm"; message: string } | null;

interface AlertContextValue {
    alert: (message: string) => Promise<void>;
    confirm: (message: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AlertState>(null);
    const resolverRef = useRef<((result: boolean) => void) | null>(null);

    const alert = (message: string) =>
        new Promise<void>((resolve) => {
            resolverRef.current = () => resolve();
            setState({ kind: "alert", message });
        });

    const confirm = (message: string) =>
        new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
            setState({ kind: "confirm", message });
        });

    const close = (result: boolean) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setState(null);
    };

    return (
        <AlertContext.Provider value={{ alert, confirm }}>
            {children}
            {state && (
                <div className="game-alert-overlay">
                    <div className="game-alert-modal game-fade-in">
                        <span className="game-alert-icon">{state.kind === "confirm" ? "🤔" : "✨"}</span>
                        <p className="game-alert-message">{state.message}</p>
                        <div className="game-alert-actions">
                            {state.kind === "confirm" && (
                                <button className="game-alert-btn cancel" onClick={() => close(false)}>취소</button>
                            )}
                            <button className="game-alert-btn confirm" onClick={() => close(true)}>확인</button>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};

export const useAlert = (): AlertContextValue => {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error("useAlert는 AlertProvider 내부에서만 사용할 수 있습니다.");
    return ctx;
};
