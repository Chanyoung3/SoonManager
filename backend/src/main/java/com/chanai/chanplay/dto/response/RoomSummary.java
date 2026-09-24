package com.chanai.chanplay.dto.response;

import com.chanai.chanplay.dto.entity.Room;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 메인 화면 방 목록 / 방 정보 응답
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RoomSummary {
    private String code;
    private String title;
    private String masterName;
    private String gameMode;
    private int currentMember;
    private int maxMember;

    public static RoomSummary from(Room room) {
        return new RoomSummary(
                room.getRoomcode(),
                room.getTitle(),
                room.getMasterName(),
                room.getGamemode(),
                room.getUserList().size(),
                room.getMaxmember()
        );
    }
}
