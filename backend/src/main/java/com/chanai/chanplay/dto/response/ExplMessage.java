package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExplMessage {
    private String userId;
    private String content;
    private int turnIndex;
    private int nextIndex;
    private int LastIndex;
    private String type;
}
