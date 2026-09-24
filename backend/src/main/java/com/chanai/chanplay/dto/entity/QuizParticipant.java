package com.chanai.chanplay.dto.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomId; // 방 코드
    private String userId;
    private String userName;
    private int score;
    private boolean answered; // 현재 문제에 답을 제출했는지 여부
    private String currentAnswer; // 현재 문제에 제출한 답
}
