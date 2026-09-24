package com.chanai.chanplay.controller;

import com.chanai.chanplay.dto.response.QuizAnswerRequest;
import com.chanai.chanplay.dto.response.QuizProgressMessage;
import com.chanai.chanplay.service.QuizService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Controller
public class QuizController {
    private final QuizService quizService;
    private final SimpMessageSendingOperations messagingTemplate;

    public QuizController(QuizService quizService, SimpMessageSendingOperations messagingTemplate) {
        this.quizService = quizService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/quiz/info/{code}")
    public void info(@DestinationVariable String code) {
        messagingTemplate.convertAndSend("/sub/game/quiz/" + code, quizService.getCurrentQuestionMessage(code));
    }

    @MessageMapping("/quiz/answer/{code}")
    public void answer(@DestinationVariable String code, QuizAnswerRequest request) {
        QuizProgressMessage progress = quizService.submitAnswer(code, request.getUserId(), request.getAnswer());
        messagingTemplate.convertAndSend("/sub/game/quiz/" + code, progress);
    }

    // 방장이 직접 정답 공개를 트리거한다 (참가자가 다 풀 때까지 자동으로 공개되지 않음)
    @MessageMapping("/quiz/reveal/{code}")
    public void reveal(@DestinationVariable String code) {
        messagingTemplate.convertAndSend("/sub/game/quiz/" + code, quizService.reveal(code));
    }

    @MessageMapping("/quiz/next/{code}")
    public void next(@DestinationVariable String code) {
        boolean hasNext = quizService.advanceIndexOrFinish(code);
        if (hasNext) {
            messagingTemplate.convertAndSend("/sub/game/quiz/" + code, quizService.getCurrentQuestionMessage(code));
        } else {
            messagingTemplate.convertAndSend("/sub/game/quiz/" + code, quizService.getFinalResults(code));
        }
    }
}
