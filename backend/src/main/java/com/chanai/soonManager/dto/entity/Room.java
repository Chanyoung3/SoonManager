package com.chanai.soonManager.dto.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 6, unique = true)
    private String roomcode; // 방코드

    private String roommaster; // 방장 ID
    private String masterName; // 방장 이름
    private String gamemode; // 기본값
    private int maxmember;
    private int currentmember;
    private boolean isActive;
    private boolean isStart;

    @Column(updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "room_users",
            joinColumns = @JoinColumn(name = "room_id")
    )
    private List<RoomUser> userList = new ArrayList<>(); // 중복 제거 및 초기화

    public void addUser(String userId, String userName) {
        // 1. 이미 들어와 있는 유저인지 ID로 확인 (중복 체크)
        boolean exists = this.userList.stream()
                .anyMatch(user -> user.getUserId().equals(userId));

        if (exists) return;

        // 2. 정원 확인 및 추가
        if (this.userList.size() < this.maxmember) {
            this.userList.add(new RoomUser(userId, userName)); // 객체 생성 후 추가
            this.currentmember = this.userList.size();
        } else {
            throw new RuntimeException("방이 꽉 찼습니다.");
        }
    }

    public void updateUser(String userId, String userName) {
        RoomUser target = this.userList.stream()
                .filter(user -> user.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("해당 유저가 존재하지 않습니다."));

        target.setUserName(userName);
    }

    public void removeUser(String userId) {
        // ID가 일치하는 객체를 리스트에서 삭제
        this.userList.removeIf(user -> user.getUserId().equals(userId));
        this.currentmember = this.userList.size();
    }
}