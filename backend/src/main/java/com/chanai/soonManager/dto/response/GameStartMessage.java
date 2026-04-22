package com.chanai.soonManager.dto.response;

import com.chanai.soonManager.dto.entity.RoomUser;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class GameStartMessage {
    private String gameType;
    private String roomId;
    private List<RoomUser> userList;
    private Map<String, Object> settings;
}
