package com.chanai.chanplay.repository;

import com.chanai.chanplay.dto.entity.QuizParticipant;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface QuizParticipantRepository extends CrudRepository<QuizParticipant, Long> {
    List<QuizParticipant> findByRoomId(String roomId);
    QuizParticipant findByRoomIdAndUserId(String roomId, String userId);
    void deleteByRoomId(String roomId);
}
