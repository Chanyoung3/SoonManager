package com.chanai.soonManager.controller;

import java.security.SecureRandom;

import com.chanai.soonManager.dto.entity.Room;
import com.chanai.soonManager.dto.response.ChatMessage;
import com.chanai.soonManager.repository.RoomRepository;
import com.chanai.soonManager.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/room")
public class maincontroller {

    private final RoomService roomService; // Service 주입
    private final SimpMessageSendingOperations messagingTemplate;

    public maincontroller(RoomService roomService, SimpMessageSendingOperations messagingTemplate) {
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/create")
    public String createRoom() {
        return roomService.createRoom();
    }

    @GetMapping("/check/{code}")
    public ResponseEntity<Boolean> checkRoom(@PathVariable String code) {
        boolean exists = roomService.existsByCode(code);
        return ResponseEntity.ok(exists);
    }

    @MessageMapping("/enter/{code}")
    public void enterRoom(@DestinationVariable String code, ChatMessage message) {
        // 1. DB에 유저 추가 및 최신 방 정보 가져오기
        Room room = roomService.enterRoom(code, message.getSender());

        // 2. 응답 메시지에 최신 유저 리스트를 담음
        message.setRoommaster(room.getRoommaster());
        message.setUserList(room.getUserList());
        message.setType("ENTER");

        // 3. /sub/room/{code} 를 구독 중인 모든 유저에게 메시지 뿌리기
        // 이걸 받아야 프론트의 setUserList()가 작동함
        messagingTemplate.convertAndSend("/sub/room/" + code, message);
    }

    @PostMapping("/leave")
    public ResponseEntity<Boolean> leaveRoom(
            @RequestParam("roomId") String roomId,
            @RequestParam("username") String username) {

        try {
            System.out.println("퇴장 요청 - 방 번호: " + roomId + ", 유저명: " + username);

            return ResponseEntity.ok(true); // 성공 시 200 OK와 함께 true 반환
        } catch (Exception e) {
            // 서버 내부 로직 실패 시 500 에러 반환 -> 프론트의 catch 블록으로 이동
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }
}
