package com.chanai.chanplay.service;

import com.chanai.chanplay.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.chanai.chanplay.dto.entity.Room;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomClearScheduler {

    private final RoomRepository roomRepository;
    private final RoomPresenceService roomPresenceService;
    private final RoomBroadcaster roomBroadcaster;

    @Scheduled(fixedDelay = 600000) // 600,000ms = 10분
    @Transactional
    public void cleanupAbandonedRooms() {
        // 기준 시간 설정 (예: 생성된 지 30분이 지난 방)
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);

        // 1. 방장이 아직 닉네임을 입력하지 않았거나(is_active = false)
        // 2. 참여 인원이 0명인 방을 찾아 삭제
        // (찬영님의 DB 구조에 맞춰 쿼리를 조정하세요)
        roomRepository.deleteByIsActiveFalseAndCreatedAtBefore(threshold);

        // 3. 소켓 연결이 한 명도 없는 채로 남은 방 삭제 (입장 직후 탭을 닫는 등 끊김 감지를 못 한 경우)
        LocalDateTime orphanThreshold = LocalDateTime.now().minusMinutes(10);
        List<Room> orphanRooms = roomRepository.findByIsActiveTrueAndCreatedAtBefore(orphanThreshold).stream()
                .filter(room -> !roomPresenceService.hasPresence(room.getRoomcode()))
                .toList();
        if (!orphanRooms.isEmpty()) {
            roomRepository.deleteAll(orphanRooms);
            roomBroadcaster.publishRoomList();
            log.info("연결 없는 방 {}개 삭제", orphanRooms.size());
        }

        log.info("사용되지 않는 방 청소가 완료되었습니다.");
    }
}
