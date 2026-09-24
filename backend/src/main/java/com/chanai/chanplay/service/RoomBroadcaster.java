package com.chanai.chanplay.service;

import com.chanai.chanplay.dto.response.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

// 방 관련 소켓 브로드캐스트 (명시적 나가기 / 연결 끊김 퇴장 공용)
@Component
@RequiredArgsConstructor
public class RoomBroadcaster {

    // 메인 화면 방 목록 구독 경로
    public static final String ROOM_LIST_TOPIC = "/sub/room-list";

    private final RoomService roomService;
    private final SimpMessageSendingOperations messagingTemplate;

    // 방 목록에 영향을 주는 변경이 생기면 최신 목록을 구독자에게 전송
    public void publishRoomList() {
        messagingTemplate.convertAndSend(ROOM_LIST_TOPIC, roomService.findOpenRooms());
    }

    // 퇴장 후 남은 참가자들에게 최신 참가자 목록 / 방장 정보 전송 (방이 삭제됐으면 생략)
    public void publishLeave(String roomCode, String userId, String userName) {
        roomService.findByRoomcode(roomCode).ifPresent(latestRoom -> {
            ChatMessage leaveMessage = new ChatMessage();
            leaveMessage.setType("LEAVE");
            leaveMessage.setSender(userName);
            leaveMessage.setUserId(userId);
            leaveMessage.setUserList(latestRoom.getUserList());
            leaveMessage.setRoomMaster(latestRoom.getRoommaster());
            leaveMessage.setMasterName(latestRoom.getMasterName());

            messagingTemplate.convertAndSend("/sub/room/" + roomCode, leaveMessage);
        });
    }
}
