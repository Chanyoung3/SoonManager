package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateNameMessage {
    private String userId;
    private String newName;
}
