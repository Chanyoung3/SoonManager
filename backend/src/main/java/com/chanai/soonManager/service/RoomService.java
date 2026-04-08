package com.chanai.soonManager.service;

import com.chanai.soonManager.dto.entity.Room;
import com.chanai.soonManager.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public String createRoom() {
        String generatedCode;

        // 1. 중복되지 않는 6자리 코드 생성
        do {
            generatedCode = generateCode();
        } while (roomRepository.existsByRoomcode(generatedCode));

        // 2. 방 엔티티 생성 및 초기 설정
        Room room = new Room();
        room.setRoomcode(generatedCode);
        room.setRoommaster(null);
        room.setGamemode("basic");
        room.setMaxmember(8);
        room.setCurrentmember(1);

        // 3. DB 저장
        roomRepository.save(room);

        return generatedCode;
    }

    public Optional<Room> findRoomByCode(String roomcode) {
        return roomRepository.findByRoomcode(roomcode);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }

    public boolean existsByCode(String code) {
        return roomRepository.existsByRoomcode(code);
    }

    @Transactional
    public Room enterRoom(String roomcode, String userName) {
        Room room = roomRepository.findByRoomcode(roomcode)
                .orElseThrow(() -> new RuntimeException("방 없음"));

        // 1. 방장이 "Anonymous"이거나 비어있다면, 현재 들어온 사람을 방장으로 임명
        if (room.getRoommaster() == null) {
            room.setRoommaster(userName);
        }

        // 2. 인원 제한 체크
        if (room.getUserList().size() >= room.getMaxmember()) {
            throw new RuntimeException("방이 꽉 찼습니다.");
        }

        // 3. 유저 리스트에 추가 (중복 방지)
        if (!room.getUserList().contains(userName)) {
            room.addUser(userName);
        }

        return room;
    }

    // RoomService.java (예시)
    @Transactional
    public Room leaveRoom(String roomCode, String userName) { // 반환 타입을 Room으로 변경 (알림 전송용)
        Room room = roomRepository.findByRoomcode(roomCode).orElse(null);
        if (room == null) return null;

        room.removeUser(userName);

        // 6. 방장 위임 로직
        if (userName.equals(room.getRoommaster())) {
            if (!room.getUserList().isEmpty()) {
                // 리스트의 첫 번째 사람(가장 오래된 사람)에게 방장 위임
                String nextMaster = room.getUserList().get(0);
                room.setRoommaster(nextMaster);
            } else {
                // 남은 사람이 없으면 방 삭제
                roomRepository.delete(room);
                return null;
            }
        }
        return room;
    }
}
