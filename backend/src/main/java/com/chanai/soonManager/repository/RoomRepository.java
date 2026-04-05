package com.chanai.soonManager.repository;

import com.chanai.soonManager.dto.entity.Room;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface RoomRepository extends CrudRepository<Room, Long>{
    Optional<Room> findByRoomcode(String roomcode);

    boolean existsByRoomcode(String roomcode);
}