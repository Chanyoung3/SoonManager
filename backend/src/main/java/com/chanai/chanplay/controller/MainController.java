package com.chanai.chanplay.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.chanai.chanplay.dto.entity.Room;
import com.chanai.chanplay.dto.response.*;
import com.chanai.chanplay.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/room")
public class MainController {

    private final RoomService roomService; // Service 주입
    private final SimpMessageSendingOperations messagingTemplate;

    public MainController(RoomService roomService, SimpMessageSendingOperations messagingTemplate) {
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
    }

    // 메인 화면 방 목록 구독 경로
    private static final String ROOM_LIST_TOPIC = "/sub/room-list";

    // 방 목록에 영향을 주는 변경이 생기면 최신 목록을 구독자에게 전송
    private void publishRoomList() {
        messagingTemplate.convertAndSend(ROOM_LIST_TOPIC, roomService.findOpenRooms());
    }

    @PostMapping("/create")
    public String createRoom(@RequestBody(required = false) RoomCreateRequest request) {
        return roomService.createRoom(request == null ? null : request.getTitle());
    }

    // 메인 화면 방 목록
    @GetMapping("/list")
    public List<RoomSummary> listRooms() {
        return roomService.findOpenRooms();
    }

    // 방 화면 상단 정보 (방 이름 등)
    @GetMapping("/info/{code}")
    public ResponseEntity<RoomSummary> roomInfo(@PathVariable String code) {
        return roomService.findSummary(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
        publishRoomList();

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
        publishRoomList();
    }

    @MessageMapping("/room/update-name/{code}")
    public void updateName(@DestinationVariable String code, UpdateNameMessage message) {
        roomService.updateName(code, message.getUserId(), message.getNewName());
        publishRoomList();
    }

    @PatchMapping("/update-settings")
    public ResponseEntity<?> updateRoom(@RequestBody UserChangeRequest request) {
        String code = request.getRoomId();
        Room room = roomService.updateRoom(code, request.getMaxUser());
        UpdateMessage message = new UpdateMessage();
        message.setMaxUser(room.getMaxmember());

        messagingTemplate.convertAndSend("/sub/room/" + code, message);
        publishRoomList();
        return ResponseEntity.ok(true);
    }

    @MessageMapping("/room/update-settings/{code}")
    public void setGameMode(@DestinationVariable String code, SetGameMode message) {
        Room room = roomService.setMode(code, message.getSelectedMode(), message.getSubRole());

        message.setSelectedMode(room.getGamemode());
        messagingTemplate.convertAndSend("/sub/room/" + code, message);
        publishRoomList();
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

            publishRoomList();
            return ResponseEntity.ok(true);
        } else {
            return ResponseEntity.badRequest().body(false);
        }
    }
}
