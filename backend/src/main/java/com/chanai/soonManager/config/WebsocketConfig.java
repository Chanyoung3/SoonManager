package com.chanai.soonManager.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer{
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*") // 모든 도메인 허용 (테스트용)
                .withSockJS(); // 브라우저 호환성을 위해 SockJS 사용
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 2. 메시지를 구독(Subscribe)하는 요청의 접두사
        // 예: /sub/room/123 (123번 방 메시지 받기)
        registry.enableSimpleBroker("/sub");

        // 3. 메시지를 발행(Send)하는 요청의 접두사
        // 예: /pub/message (메시지 보내기)
        registry.setApplicationDestinationPrefixes("/pub");
    }
}
