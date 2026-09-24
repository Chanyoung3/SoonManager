package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizQuestionMessage {
    private String type = "QUESTION";
    private String questionId;
    private String qtype; // TEXT, IMAGE, AUDIO
    private String category;
    private String questionText;
    private String media;
    private int round;
    private int totalRounds;
}
