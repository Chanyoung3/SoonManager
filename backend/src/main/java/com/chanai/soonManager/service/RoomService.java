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
        room.setRoommaster("Anonymous"); // 추후 로그인 사용자 정보로 변경 가능
        room.setGamemode("Lobby");
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
}
