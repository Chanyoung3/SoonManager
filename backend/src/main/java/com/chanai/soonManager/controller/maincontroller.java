package com.chanai.soonManager.controller;

import java.security.SecureRandom;

import com.chanai.soonManager.repository.RoomRepository;
import com.chanai.soonManager.service.RoomService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class maincontroller {

    private final RoomService roomService; // Service 주입

    public maincontroller(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping("/room/create")
    public String createRoom() {
        return roomService.createRoom();
    }
}
