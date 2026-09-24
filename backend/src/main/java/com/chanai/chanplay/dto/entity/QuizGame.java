package com.chanai.chanplay.dto.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class QuizGame {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomId; // 방 코드

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quiz_categories", joinColumns = @JoinColumn(name = "quiz_game_id"))
    @Column(name = "category")
    private List<String> categories = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quiz_question_ids", joinColumns = @JoinColumn(name = "quiz_game_id"))
    @OrderColumn(name = "question_order")
    @Column(name = "question_id")
    private List<String> questionIds = new ArrayList<>();

    private int roundCount; // 총 문제 수
    private int currentIndex; // 현재 문제 인덱스
    private boolean finished;
}
