package com.chanai.soonManager.service;

import com.chanai.soonManager.dto.entity.GameParticipant;
import com.chanai.soonManager.dto.entity.LiarGame;
import com.chanai.soonManager.dto.entity.RoomUser;
import com.chanai.soonManager.repository.GameParticipantRepository;
import com.chanai.soonManager.repository.LiarGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameService {
    private final GameParticipantRepository gameParticipantRepository;
    private final LiarGameRepository liarGameRepository;

    public Boolean liarGameStart(String code, String mode, List<RoomUser> userList) {
        try {
            // 1. 유저들을 저장할 리스트 생성
            List<GameParticipant> participants = new ArrayList<>();

            for (RoomUser user : userList) {
                GameParticipant gp = new GameParticipant(); // 루프 안에서 매번 새로 생성!
                gp.setUserId(user.getUserId());
                gp.setRoomId(code);
                gp.setScore(0);
                participants.add(gp); // 리스트에 추가
            }
            // 모든 유저 한꺼번에 저장
            gameParticipantRepository.saveAll(participants);

            // 2. 게임 정보 생성 및 저장
            LiarGame liarGame = new LiarGame();
            liarGame.setRoomId(code);
            liarGame.setMode(mode);
            liarGame.setFinish(false);
            liarGameRepository.save(liarGame);

            return true;
        } catch (Exception e) {
            // 에러 원인을 반드시 콘솔에 찍어보세요!
            e.printStackTrace();
            return false;
        }
    }

    public void SetGame(String mode, List<RoomUser> userList, List<String> topics) {
        List<RoomUser> seq = new ArrayList<>(userList);
        Collections.shuffle(seq);

        for (int i = 0; i < seq.size(); i++) {
            RoomUser user = seq.get(i);
            String uid = user.getUserId();
            GameParticipant gp = gameParticipantRepository.findByUserId(uid);
            gp.setSeq(i + 1);
        }

        if(mode.equals("normal")) {

        }
        else if(mode.equals("mismatch")) {

        }
    }
}