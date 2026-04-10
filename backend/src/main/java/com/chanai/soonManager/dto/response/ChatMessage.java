package com.chanai.soonManager.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatMessage {
    private String sender;
    private String type;
    private List<String> userList;
    private String roomMaster;
}
