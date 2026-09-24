package com.chanai.chanplay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultEntry {
    private String userId;
    private String userName;
    private String answer;
    private boolean correct;
    private int gained;
    private int totalScore;
}
