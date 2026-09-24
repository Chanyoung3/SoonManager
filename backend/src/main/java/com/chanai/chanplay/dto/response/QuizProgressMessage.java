package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizProgressMessage {
    private String type = "PROGRESS";
    private int answeredCount;
    private int totalCount;
}
