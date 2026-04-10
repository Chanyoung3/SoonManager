package com.chanai.soonManager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserJoinRequest {
    private String roomId;
    private String userName;
    private String userId;
}
