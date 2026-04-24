package com.chanai.soonManager.controller;

import com.chanai.soonManager.dto.entity.RoomUser;
import com.chanai.soonManager.dto.response.GameStartMessage;
import com.chanai.soonManager.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/game")
public class GameController {
    private final GameService gameService;
    private final SimpMessageSendingOperations messagingTemplate;

    public GameController(GameService gameService, SimpMessageSendingOperations messagingTemplate) {
        this.gameService = gameService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/game/start/{code}")
    public void startGame(@DestinationVariable String code, GameStartMessage gameStartMessage) {
        String gameType = gameStartMessage.getGameType();
        List<RoomUser> userList = gameStartMessage.getUserList();
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
            Map<String, String> response = new HashMap<>();

            if(gameService.liarGameStart(code, mode, userList)){
                response.put("type" , "success");
                messagingTemplate.convertAndSend("/sub/room/" + code, response);
            }
            else{ // 실패시
                // 별도의 응답용 DTO를 만들거나 Map을 활용
                response.put("type", "ERROR");
                messagingTemplate.convertAndSend("/sub/room/" + code, response);
            }
        }
    }
}