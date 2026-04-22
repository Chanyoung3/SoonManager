package com.chanai.soonManager.service;

import com.chanai.soonManager.repository.LiarGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GameService {
    private LiarGameRepository liarGameRepository;

    public GameService(LiarGameRepository liarGameRepository) {
        this.liarGameRepository = liarGameRepository;
    }


}
