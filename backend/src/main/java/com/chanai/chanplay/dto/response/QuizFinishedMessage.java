package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuizFinishedMessage {
    private String type = "FINISHED";
    private List<QuizResultEntry> finalRanking;
}
