package com.chanai.chanplay.controller;

import com.chanai.chanplay.dto.response.TextChatMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {
    private final SimpMessageSendingOperations messagingTemplate;

    public ChatController(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat/{code}")
    public void chat(@DestinationVariable String code, TextChatMessage message) {
        messagingTemplate.convertAndSend("/sub/chat/" + code, message);
    }
}
