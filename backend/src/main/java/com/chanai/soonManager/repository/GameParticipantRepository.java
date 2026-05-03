package com.chanai.soonManager.repository;

import com.chanai.soonManager.dto.entity.GameParticipant;
import com.chanai.soonManager.dto.entity.LiarGame;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface GameParticipantRepository extends CrudRepository<GameParticipant, Long> {
    GameParticipant findByUserId(String userId);
    GameParticipant findByRoomId(String roomId);
    GameParticipant findUserIdByRoomIdAndRole(String roomId, String role);
}
