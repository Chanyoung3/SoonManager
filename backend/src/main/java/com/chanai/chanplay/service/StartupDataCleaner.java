package com.chanai.chanplay.service;

import com.chanai.chanplay.repository.GameParticipantRepository;
import com.chanai.chanplay.repository.LiarGameRepository;
import com.chanai.chanplay.repository.QuizGameRepository;
import com.chanai.chanplay.repository.QuizParticipantRepository;
import com.chanai.chanplay.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// 서버 재시작 시 이전 방 / 게임 데이터 정리
// 재시작하면 모든 소켓 연결이 끊겨 이전 방은 쓸 수 없으므로 비움 (스키마는 Flyway 가 관리, 데이터만 삭제)
@Slf4j
@Component
@RequiredArgsConstructor
public class StartupDataCleaner {

    private final RoomRepository roomRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final LiarGameRepository liarGameRepository;
    private final QuizGameRepository quizGameRepository;
    private final QuizParticipantRepository quizParticipantRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void clearStaleData() {
        long rooms = roomRepository.count();

        roomRepository.deleteAll();
        gameParticipantRepository.deleteAll();
        liarGameRepository.deleteAll();
        quizGameRepository.deleteAll();
        quizParticipantRepository.deleteAll();

        log.info("재시작 전 방 / 게임 데이터 정리 완료 (방 {}개)", rooms);
    }
}
