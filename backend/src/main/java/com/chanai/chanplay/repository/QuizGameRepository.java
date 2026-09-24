package com.chanai.chanplay.repository;

import com.chanai.chanplay.dto.entity.QuizGame;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface QuizGameRepository extends CrudRepository<QuizGame, Long> {
    QuizGame findByRoomId(String roomId);
    void deleteByRoomId(String roomId);
}
