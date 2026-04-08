package com.chanai.soonManager.dto.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 6, unique = true)
    private String roomcode; // 방코드

    private String roommaster; // 방장
    private String gamemode; // 기본값
    private int maxmember = 8;
    private int currentmember = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_users", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "user_name")
    private List<String> userList = new ArrayList<>(); // 중복 제거 및 초기화

    public void addUser(String userName) {
        // 이미 들어와 있는 유저라면 패스
        if (this.userList.contains(userName)) return;

        // 현재 리스트 크기가 maxmember(8)보다 작을 때만 추가
        if (this.userList.size() < this.maxmember) {
            this.userList.add(userName);
            this.currentmember = this.userList.size();
        } else {
            // 인원 초과 예외 처리 (선택 사항)
            throw new RuntimeException("방이 꽉 찼습니다.");
        }
    }

    public void removeUser(String userName) {
        this.userList.remove(userName);
        this.currentmember = this.userList.size();
    }
}