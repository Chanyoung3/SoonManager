package com.chanai.soonManager.service;

import com.chanai.soonManager.dto.content.GameKeyword;
import com.chanai.soonManager.dto.entity.GameParticipant;
import com.chanai.soonManager.dto.entity.LiarGame;
import com.chanai.soonManager.dto.entity.RoomUser;
import com.chanai.soonManager.repository.GameParticipantRepository;
import com.chanai.soonManager.repository.LiarGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

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

    public LiarGame getLiarGame(String code) {
        return liarGameRepository.findByRoomId(code);
    }

    public void SetGame(String code, String mode, List<RoomUser> userList, List<String> topics) {
        List<RoomUser> seq = new ArrayList<>(userList);
        Collections.shuffle(seq);

        for (int i = 0; i < seq.size(); i++) {
            RoomUser user = seq.get(i);
            String uid = user.getUserId();
            GameParticipant gp = gameParticipantRepository.findByUserId(uid);
            gp.setSeq(i + 1);
            gameParticipantRepository.save(gp);
        }
        SetLiar(userList); // 라이어 선정

        // 주제선정 및 목표 단어 설정
        Collections.sort(topics);
        String topic = topics.get(0);

        SetTopic(code, topic, mode);
    }

    public void SetTopic(String code, String topic, String mode) {
        // 주제 선정
        LiarGame lr = liarGameRepository.findByRoomId(code);
        lr.setCategory(topic);

        // 단어 선정
        String correctWord = GameKeyword.getRandomKeyword(topic);
        lr.setTarget_ward(correctWord);

        // 모드에 맞게 설정
        if(mode.equals("normal")){
            lr.setFake_ward("null");
        }
        else if(mode.equals("mismatch")){
            String liarWord = GameKeyword.getMismatchKeyword(topic, correctWord);
            lr.setFake_ward(liarWord);
        }
        liarGameRepository.save(lr);
    }

    public void SetLiar(List<RoomUser> userList) {
        // 라이어 선정
        Collections.shuffle(userList);
        String liar = userList.get(0).getUserId();
        GameParticipant gp = gameParticipantRepository.findByUserId(liar);
        gp.setRole("liar");
        gameParticipantRepository.save(gp);

        // 라이어가 아닌 사람들 역할 "시민"으로 설정
        for(RoomUser user : userList) {
            if (!user.getUserId().equals(liar)) { // 라이어가 아닌경우
                GameParticipant gp2 = gameParticipantRepository.findByUserId(user.getUserId());
                gp2.setRole("citizen");
                gameParticipantRepository.save(gp2);
            }
        }
    }

    public String findLiarUserId(String code, String liar) {
        GameParticipant gp = gameParticipantRepository.findUserIdByRoomIdAndRole(code, "liar");
        String LiarId = gp.getUserId();
        return LiarId;
    }

    public List<RoomUser> GetLUserList(List<RoomUser> userList) {
        return userList.stream()
                .sorted((u1, u2) -> {
                    // 1. 각 유저의 seq 값을 DB에서 조회
                    GameParticipant gp1 = gameParticipantRepository.findByUserId(u1.getUserId());
                    GameParticipant gp2 = gameParticipantRepository.findByUserId(u2.getUserId());

                    // 2. seq 값 비교 (오름차순)
                    // 만약 gp가 null일 경우를 대비해 0 등으로 기본값을 줄 수 있습니다.
                    int seq1 = (gp1 != null) ? gp1.getSeq() : 0;
                    int seq2 = (gp2 != null) ? gp2.getSeq() : 0;

                    return Integer.compare(seq1, seq2);
                })
                .collect(Collectors.toList());
    }

    public void SetExpl(String userId, String content){
        GameParticipant gp = gameParticipantRepository.findByUserId(userId);
        gp.setExpl(content);
        gameParticipantRepository.save(gp);  
    }
}