package com.chanai.soonManager.controller;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.chanai.soonManager.dto.entity.Room;
import com.chanai.soonManager.dto.response.*;
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

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody UserJoinRequest request) {
        Map<String, Object> response = new HashMap<>();
        if(roomService.isRoomMaster(request.getRoomId(), request.getUserName(), request.getUserId())){
            response.put("isMaster", true);
        }
        else{
            response.put("isMaster", false);
        }

        return ResponseEntity.ok(response);
    }

    @MessageMapping("/room/enter/{code}")
    public void enterRoom(@DestinationVariable String code, ChatMessage message) {
        // 1. DB에 유저 추가 (ID와 이름을 모두 넘김)
        Room room = roomService.enterRoom(code, message.getUserId(), message.getSender());

        // 2. 응답 메시지 설정
        message.setUserList(room.getUserList());
        message.setType("ENTER");
        message.setRoomMaster(room.getRoommaster());
        message.setMasterName(room.getMasterName());

        // 3. 해당 방을 구독 중인 모든 유저에게 브로드캐스팅
        messagingTemplate.convertAndSend("/sub/room/" + code, message);
    }

    @MessageMapping("/room/update-name/{code}")
    public void updateName(@DestinationVariable String code, UpdateNameMessage message) {
        roomService.updateName(code, message.getUserId(), message.getNewName());
    }

    @PatchMapping("/update-settings")
    public ResponseEntity<?> updateRoom(@RequestBody UserChangeRequest request) {
        String code = request.getRoomId();
        Room room = roomService.updateRoom(code, request.getMaxUser());
        UpdateMessage message = new UpdateMessage();
        message.setMaxUser(room.getMaxmember());

        messagingTemplate.convertAndSend("/sub/room/" + code, message);
        return ResponseEntity.ok(true);
    }

    @PostMapping("/leave")
    public ResponseEntity<Boolean> leaveRoom(@RequestBody UserJoinRequest request) {
        // 1. 서비스에서 퇴장 로직 수행 (방장 위임 포함)
        boolean isLeaved = roomService.leaveRoom(request.getRoomId(), request.getUserName(), request.getUserId());

        if (isLeaved) {
            // 2. Optional을 안전하게 처리
            roomService.findByRoomcode(request.getRoomId()).ifPresent(latestRoom -> {
                ChatMessage leaveMessage = new ChatMessage();
                leaveMessage.setType("LEAVE");
                leaveMessage.setSender(request.getUserName());
                leaveMessage.setUserId(request.getUserId()); // 누가 나갔는지 ID도 포함하면 프론트에서 편해요

                // 최신화된 정보 세팅
                leaveMessage.setUserList(latestRoom.getUserList());
                leaveMessage.setRoomMaster(latestRoom.getRoommaster());
                leaveMessage.setMasterName(latestRoom.getMasterName());

                // 3. 브로드캐스팅
                messagingTemplate.convertAndSend("/sub/room/" + request.getRoomId(), leaveMessage);
            });

            return ResponseEntity.ok(true);
        } else {
            return ResponseEntity.badRequest().body(false);
        }
    }
}
