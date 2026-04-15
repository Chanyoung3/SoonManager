package com.chanai.soonManager.dto.response;

import com.chanai.soonManager.dto.entity.RoomUser;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatMessage {
    private String sender;
    private String type;
    private List<RoomUser> userList;
    private String roomMaster;
    private String masterName;
    private String userId;
}
