package com.chanai.soonManager.dto.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RoomUser {
    private String userId;
    private String userName;
}
