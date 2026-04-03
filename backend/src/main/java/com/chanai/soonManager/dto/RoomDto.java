package com.chanai.soonManager.dto;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
public class RoomDto {
    private String roomcode;
    private String roommaster;
    private String gamemode;
    private int maxmember;
    private int currentmember;
}