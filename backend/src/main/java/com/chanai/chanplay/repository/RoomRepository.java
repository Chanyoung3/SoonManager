package com.chanai.chanplay.repository;

import com.chanai.chanplay.dto.entity.Room;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface RoomRepository extends CrudRepository<Room, Long>{
    Optional<Room> findByRoomcode(String roomcode);
    boolean existsByRoomcode(String roomcode);

    // 방장이 입장한(활성) 방, 최신순
    java.util.List<Room> findByIsActiveTrueOrderByCreatedAtDesc();

    @Transactional
    void deleteByIsActiveFalseAndCreatedAtBefore(java.time.LocalDateTime dateTime);
}