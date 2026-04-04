package com.chanai.repository;

import com.chanai.soonManager.dto.entity.Room;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource(exported = false)
public class RoomRepository extends CrudRepository<Room, Long>{
    
}
