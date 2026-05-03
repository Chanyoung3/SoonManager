package com.chanai.soonManager.dto.response;

import com.chanai.soonManager.dto.entity.RoomUser;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LiarMessage {
    private List<RoomUser> userList;
    private String mode;
    private String target_ward;
    private String fake_ward;
    private String category;
    private String liar;
}
