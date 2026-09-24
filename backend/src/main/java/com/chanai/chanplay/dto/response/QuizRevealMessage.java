package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuizRevealMessage {
    private String type = "REVEAL";
    private String correctAnswer;
    private List<QuizResultEntry> results;
    private int round;
    private int totalRounds;
    private boolean lastRound;
}
