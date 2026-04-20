package com.chanai.soonManager.dto.entity;

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
@AllArgsConstructor
@NoArgsConstructor
public class LiarGame {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mode; // 세부 라이어 모드
    private String liar_Id; // 라이어 ID
    private String target_ward; // 맞춰야 하는 단어
    private String fake_ward; // 라이어 단어
    private String category;  // 주제
}
