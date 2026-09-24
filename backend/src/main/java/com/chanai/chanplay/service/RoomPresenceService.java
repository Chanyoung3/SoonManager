package com.chanai.chanplay.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import jakarta.annotation.PreDestroy;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

// 소켓 연결 기준으로 방 참가 상태를 추적
// 나가기 버튼 없이 홈 이동 / 뒤로가기 / 탭 닫기로 나가도 연결이 끊기면 퇴장 처리
@Slf4j
@Service
@RequiredArgsConstructor
public class RoomPresenceService {

    // 새로고침 등으로 잠깐 끊겼다 다시 들어오는 경우를 위해 퇴장 처리를 미루는 시간
    private static final long LEAVE_GRACE_SECONDS = 8;

    private record Presence(String roomCode, String userId, String userName) {
        String key() {
            return roomCode + ":" + userId;
        }
    }

    private final RoomService roomService;
    private final RoomBroadcaster roomBroadcaster;

    private final Map<String, Presence> sessions = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> pendingLeaves = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    // 방 입장(소켓) 시 연결 등록, 유예 중인 퇴장이 있으면 취소
    public void register(String sessionId, String roomCode, String userId, String userName) {
        if (sessionId == null || roomCode == null || userId == null) return;

        Presence presence = new Presence(roomCode, userId, userName);
        sessions.put(sessionId, presence);

        ScheduledFuture<?> pending = pendingLeaves.remove(presence.key());
        if (pending != null) {
            pending.cancel(false);
            log.info("재접속으로 퇴장 취소: room={}, user={}", roomCode, userId);
        }
    }

    // 해당 방에 연결 중이거나 재접속 대기 중인 사용자가 있는지
    public boolean hasPresence(String roomCode) {
        String prefix = roomCode + ":";
        return sessions.values().stream().anyMatch(p -> p.roomCode().equals(roomCode))
                || pendingLeaves.keySet().stream().anyMatch(k -> k.startsWith(prefix));
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        Presence presence = sessions.remove(event.getSessionId());
        if (presence == null) return;

        ScheduledFuture<?> future = scheduler.schedule(() -> leave(presence), LEAVE_GRACE_SECONDS, TimeUnit.SECONDS);
        ScheduledFuture<?> previous = pendingLeaves.put(presence.key(), future);
        if (previous != null) previous.cancel(false);
    }

    private void leave(Presence presence) {
        pendingLeaves.remove(presence.key());

        // 같은 사용자가 다른 연결로 이미 들어와 있으면 퇴장시키지 않음
        boolean stillConnected = sessions.values().stream()
                .anyMatch(p -> p.key().equals(presence.key()));
        if (stillConnected) return;

        try {
            boolean left = roomService.leaveRoom(presence.roomCode(), presence.userName(), presence.userId());
            if (left) {
                log.info("연결 끊김으로 퇴장: room={}, user={}", presence.roomCode(), presence.userId());
                roomBroadcaster.publishLeave(presence.roomCode(), presence.userId(), presence.userName());
                roomBroadcaster.publishRoomList();
            }
        } catch (Exception e) {
            log.error("연결 끊김 퇴장 처리 실패: room={}, user={}", presence.roomCode(), presence.userId(), e);
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }
}
