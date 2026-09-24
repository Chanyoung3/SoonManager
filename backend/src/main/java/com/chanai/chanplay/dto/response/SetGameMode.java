package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SetGameMode {
    private String roomId;
    private String selectedMode;
    private String subRole;
}
