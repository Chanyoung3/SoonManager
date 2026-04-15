package com.chanai.soonManager.service;

import com.chanai.soonManager.dto.entity.Room;
import com.chanai.soonManager.dto.entity.RoomUser;
import com.chanai.soonManager.dto.response.UserJoinRequest;
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
        room.setCurrentmember(0);
        room.setActive(false);

        // 3. DB 저장
        roomRepository.save(room);

        return generatedCode;
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

    public Optional<Room> findByRoomcode(String roomcode) {
        return roomRepository.findByRoomcode(roomcode);
    }

    public boolean isRoomMaster(String roomCode, String userName, String userid) {
        Optional<Room> roomOpt = roomRepository.findByRoomcode(roomCode);

        if (roomOpt.isEmpty()) {
            return true;
        }

        Room room = roomOpt.get();
        String master = room.getRoommaster();
        room.addUser(userid, userName);
        if(!room.isActive()){
            room.setActive(true);
        }

        if (master == null) {
            room.setMasterName(userName);
            room.setRoommaster(userid);
            roomRepository.save(room);
            return true;
        }

        return false;
    }

    @Transactional
    public Room updateRoom(String roomCode, int maxUser) {
        Optional<Room> roomOpt = roomRepository.findByRoomcode(roomCode);

        Room room = roomOpt.get();
        room.setMaxmember(maxUser);

        return roomRepository.save(room);
    }

    @Transactional
    public Room enterRoom(String roomcode, String userId, String userName) {
        Room room = roomRepository.findByRoomcode(roomcode)
                .orElseThrow(() -> new RuntimeException("방 없음"));

        room.addUser(userId, userName);

        return roomRepository.save(room);
    }

    @Transactional
    public void updateName(String roomCode, String userId, String newName) {
            Room room = roomRepository.findByRoomcode(roomCode)
                    .orElseThrow(() -> new RuntimeException("방 없음"));
            room.updateUser(userId, newName);
            room.setMasterName(newName);
            roomRepository.save(room);
    }

    @Transactional
    public Boolean leaveRoom(String roomCode, String userName, String userId) {
        try{
            Room room = roomRepository.findByRoomcode(roomCode).orElse(null);
            if (room == null) return false;

            // 1. 유저 삭제 전, 이 사람이 방장인지 확인 (ID로 비교)
            boolean isMasterLeaving = userId.equals(room.getRoommaster());

            // 2. 유저 삭제
            room.removeUser(userId);

            // 3. 방장 위임 로직
            if (isMasterLeaving) {
                if (!room.getUserList().isEmpty()) {
                    // 첫 번째 남은 유저를 새 방장으로 위임
                    RoomUser nextMaster = room.getUserList().get(0);
                    room.setRoommaster(nextMaster.getUserId());
                    room.setMasterName(nextMaster.getUserName());
                    roomRepository.save(room);
                } else {
                    roomRepository.delete(room);
                }
                return true;
            }

            roomRepository.save(room);
            return true;
        }catch (Exception e){
            return false;
        }
    }
}
