package com.chanai.chanplay.dto.content;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {
    private String id;
    private String category;
    private String type; // TEXT, IMAGE, AUDIO
    private String question;
    private List<String> answers;
    private String media; // 이미지/오디오 경로 (TEXT는 null)
}
