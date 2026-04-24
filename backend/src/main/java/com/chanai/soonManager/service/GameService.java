package com.chanai.soonManager.service;

import com.chanai.soonManager.dto.entity.GameParticipant;
import com.chanai.soonManager.dto.entity.LiarGame;
import com.chanai.soonManager.dto.entity.RoomUser;
import com.chanai.soonManager.repository.GameParticipantRepository;
import com.chanai.soonManager.repository.LiarGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameService {
    private GameParticipantRepository gameParticipantRepository;
    private LiarGameRepository liarGameRepository;

    public GameService(LiarGameRepository liarGameRepository, GameParticipantRepository gameParticipantRepository) {
        this.liarGameRepository = liarGameRepository;
        this.gameParticipantRepository = gameParticipantRepository;
    }


    public Boolean liarGameStart(String code, String mode, List<RoomUser> userList) {
        try{
            GameParticipant Gp = new GameParticipant();
            for (RoomUser user : userList) { // 유저 생성
                Gp.setUserId(user.getUserId());
                Gp.setRoomId(code);
                Gp.setScore(0);
            }
            gameParticipantRepository.save(Gp);

            LiarGame liarGame = new LiarGame();
            liarGame.setRoomId(code);
            liarGame.setMode(mode);
            liarGame.setFinish(false);
            liarGameRepository.save(liarGame);

            return true;
        }
        catch(Exception e){
            return false;
        }

    }
}
