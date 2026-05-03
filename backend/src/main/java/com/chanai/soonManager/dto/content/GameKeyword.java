package com.chanai.soonManager.dto.content;

import java.util.Arrays;
import java.util.List;
import java.util.Collections;
import java.util.ArrayList;
import java.util.stream.Collectors;

public enum GameKeyword {
    FOOD("음식", Arrays.asList(
            "떡볶이", "삼겹살", "초밥", "파스타", "치킨", "햄버거", "비빔밥", "쌀국수", "스테이크", "마라탕",
            "짜장면", "돈가스", "샌드위치", "타코", "카레", "냉면", "피자", "감자탕", "샤브샤브", "계란말이", "제육볶음"
    )),
    GAME("게임", Arrays.asList(
            "리그오브레전드", "메이플스토리", "오버워치", "발로란트", "마인크래프트", "배틀그라운드", "로스트아크", "스타크래프트", "디아블로", "어몽어스",
            "철권", "애니멀크로싱", "젤다의전설", "포켓몬스터", "던전앤파이터", "카트라이더", "심즈", "원신", "쿠키런", "테일즈런너", "피파온라인"
    )),
    PLACE("장소", Arrays.asList(
            "도서관", "편의점", "놀이공원", "영화관", "아쿠아리움", "제주도", "남산타워", "학교", "공항", "노래방",
            "카페", "백화점", "미술관", "수영장", "지하철역", "캠핑장", "경복궁", "한강공원", "스키장", "호텔", "헬스장"
    )),
    ANIMAL("동물", Arrays.asList(
            "강아지", "고양이", "판다", "사자", "호랑이", "기린", "코끼리", "토끼", "펭귄", "햄스터",
            "다람쥐", "너구리", "독수리", "고래", "상어", "거북이", "악어", "치타", "얼룩말", "캥거루", "쿼카"
    ));

    private final String categoryName;
    private final List<String> keywords;

    GameKeyword(String categoryName, List<String> keywords) {
        this.categoryName = categoryName;
        this.keywords = keywords;
    }

    public String getCategoryName() { return categoryName; }

    public static GameKeyword findByCategoryName(String topic) {
        return Arrays.stream(GameKeyword.values())
                .filter(gk ->
                        // 1. Enum 상수 이름과 비교 (예: "ANIMAL".equalsIgnoreCase("animal"))
                        gk.name().equalsIgnoreCase(topic) ||
                                // 2. 또는 한글 별명과 비교 (예: "동물".equals("동물"))
                                gk.getCategoryName().equals(topic)
                )
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당하는 주제가 없습니다: " + topic));
    }

    public static String getRandomKeyword(String topic) {
        GameKeyword gk = findByCategoryName(topic);
        List<String> copyList = new ArrayList<>(gk.keywords);
        Collections.shuffle(copyList);
        return copyList.get(0);
    }

    public static String getMismatchKeyword(String topic, String keyword) {
        GameKeyword gk = findByCategoryName(topic);

        // 입력받은 keyword를 제외한 새로운 리스트 생성
        List<String> filteredList = gk.keywords.stream()
                .filter(k -> !k.equals(keyword))
                .collect(Collectors.toList());

        Collections.shuffle(filteredList);
        return filteredList.isEmpty() ? null : filteredList.get(0);
    }
}