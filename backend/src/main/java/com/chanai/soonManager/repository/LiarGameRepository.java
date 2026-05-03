package com.chanai.soonManager.repository;

import com.chanai.soonManager.dto.entity.LiarGame;
import com.chanai.soonManager.dto.entity.Room;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface LiarGameRepository extends CrudRepository<LiarGame, Long> {
    LiarGame findByRoomId(String roomId);
}
