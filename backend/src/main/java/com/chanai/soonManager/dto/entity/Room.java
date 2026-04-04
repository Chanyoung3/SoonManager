package com.chanai.soonManager.dto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
public class Room {
    @Column(length = 6)
    private String roomcode; // 방코드
    private String roommaster; // 방장
    private String gamemode; // 게임모드
    private int maxmember; // 최대인원
    private int currentmember; // 현재인원
}