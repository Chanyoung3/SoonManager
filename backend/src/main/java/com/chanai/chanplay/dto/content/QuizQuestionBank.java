package com.chanai.chanplay.dto.content;

import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// 퀴즈 문제 파일을 읽어들이는 컴포넌트. 문제는 resources/quiz/questions.json 에 정의한다.
@Component
public class QuizQuestionBank {
    private List<QuizQuestion> allQuestions = new ArrayList<>();
    private Map<String, QuizQuestion> questionsById = new HashMap<>();

    @PostConstruct
    public void load() {
        try (InputStream is = new ClassPathResource("quiz/questions.json").getInputStream()) {
            ObjectMapper mapper = new ObjectMapper();
            QuizQuestion[] loaded = mapper.readValue(is, QuizQuestion[].class);
            allQuestions = new ArrayList<>(List.of(loaded));
            questionsById = allQuestions.stream()
                    .collect(Collectors.toMap(QuizQuestion::getId, q -> q));
        } catch (Exception e) {
            throw new IllegalStateException("퀴즈 문제 파일(quiz/questions.json)을 불러오지 못했습니다.", e);
        }
    }

    public QuizQuestion findById(String id) {
        return questionsById.get(id);
    }

    public List<String> getCategories() {
        return allQuestions.stream()
                .map(QuizQuestion::getCategory)
                .distinct()
                .collect(Collectors.toList());
    }

    public List<QuizQuestion> getRandomQuestions(List<String> categories, int count) {
        List<QuizQuestion> pool = allQuestions.stream()
                .filter(q -> categories == null || categories.isEmpty() || categories.contains(q.getCategory()))
                .collect(Collectors.toList());

        Collections.shuffle(pool);
        if (pool.size() > count) {
            pool = pool.subList(0, count);
        }
        return pool;
    }
}
