package com.chanai.chanplay.repository;

import com.chanai.chanplay.dto.entity.LiarGame;
import com.chanai.chanplay.dto.entity.Room;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface LiarGameRepository extends CrudRepository<LiarGame, Long> {
    LiarGame findByRoomId(String roomId);
}
