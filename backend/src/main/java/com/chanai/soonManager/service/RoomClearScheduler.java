package com.chanai.soonManager.service;

import com.chanai.soonManager.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomClearScheduler {

    private final RoomRepository roomRepository;

    @Scheduled(fixedDelay = 600000) // 600,000ms = 10분
    @Transactional
    public void cleanupAbandonedRooms() {
        // 기준 시간 설정 (예: 생성된 지 30분이 지난 방)
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);

        // 1. 방장이 아직 닉네임을 입력하지 않았거나(is_active = false)
        // 2. 참여 인원이 0명인 방을 찾아 삭제
        // (찬영님의 DB 구조에 맞춰 쿼리를 조정하세요)
        roomRepository.deleteByIsActiveFalseAndCreatedAtBefore(threshold);

        log.info("사용되지 않는 방 청소가 완료되었습니다.");
    }
}
