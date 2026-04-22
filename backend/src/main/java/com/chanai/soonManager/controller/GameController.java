package com.chanai.soonManager.controller;

import com.chanai.soonManager.dto.response.GameStartMessage;
import com.chanai.soonManager.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/game")
public class GameController {
    private GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @MessageMapping("/game/start/{code}")
    public void startGame(@DestinationVariable String code, GameStartMessage gameStartMessage) {
        String gameType = gameStartMessage.getGameType();
        Map<String, Object> settings = gameStartMessage.getSettings();

        if ("what".equals(gameType)) {
            List<String> topics = (List<String>) settings.get("topics");
            Integer round = (Integer) settings.get("round");
            Integer time = (Integer) settings.get("time");

            System.out.println("캐치마인드 시작: " + round + "라운드");
            // 게임 시작 로직 실행...

        } else if ("liar".equals(gameType)) {
            List<String> topics = (List<String>) settings.get("topics");
            String mode = (String) settings.get("mode");

            System.out.println("라이어 게임 시작: " + mode + " 모드");
            // 게임 시작 로직 실행...
        }
    }
}