package com.chanai.chanplay.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// React(BrowserRouter) 경로로 직접 접속/새로고침 시 index.html 로 넘겨줌
@Controller
public class SpaController {

    @GetMapping({"/", "/room/{roomId}"})
    public String forward() {
        return "forward:/index.html";
    }
}
