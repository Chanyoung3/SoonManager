package com.chanai.chanplay.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TextChatMessage {
    private String senderId;
    private String senderName;
    private String content;
}
