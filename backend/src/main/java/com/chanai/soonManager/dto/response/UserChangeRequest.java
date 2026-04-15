package com.chanai.soonManager.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserChangeRequest {
    private String roomId;
    private int maxUser;
}
