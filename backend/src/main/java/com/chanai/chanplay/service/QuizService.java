package com.chanai.chanplay.service;

import com.chanai.chanplay.dto.content.QuizQuestion;
import com.chanai.chanplay.dto.content.QuizQuestionBank;
import com.chanai.chanplay.dto.entity.QuizGame;
import com.chanai.chanplay.dto.entity.QuizParticipant;
import com.chanai.chanplay.dto.entity.Room;
import com.chanai.chanplay.dto.entity.RoomUser;
import com.chanai.chanplay.dto.response.QuizFinishedMessage;
import com.chanai.chanplay.dto.response.QuizProgressMessage;
import com.chanai.chanplay.dto.response.QuizQuestionMessage;
import com.chanai.chanplay.dto.response.QuizResultEntry;
import com.chanai.chanplay.dto.response.QuizRevealMessage;
import com.chanai.chanplay.repository.QuizGameRepository;
import com.chanai.chanplay.repository.QuizParticipantRepository;
import com.chanai.chanplay.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

// 정답이 맞으면 부여하는 고정 점수 (시간 제한이 없으므로 속도 보너스는 없음)
@Service
@RequiredArgsConstructor
public class QuizService {
    private static final int CORRECT_SCORE = 100;

    private final QuizGameRepository quizGameRepository;
    private final QuizParticipantRepository quizParticipantRepository;
    private final QuizQuestionBank quizQuestionBank;
    private final RoomRepository roomRepository;

    @Transactional
    public boolean startQuiz(String code, List<String> categories, int round, List<RoomUser> userList) {
        try {
            List<QuizQuestion> picked = quizQuestionBank.getRandomQuestions(categories, round);
            if (picked.isEmpty()) {
                return false;
            }

            String masterId = roomRepository.findByRoomcode(code)
                    .map(Room::getRoommaster)
                    .orElse(null);

            quizGameRepository.deleteByRoomId(code);
            quizParticipantRepository.deleteByRoomId(code);

            QuizGame game = new QuizGame();
            game.setRoomId(code);
            game.setCategories(new ArrayList<>(categories));
            game.setQuestionIds(picked.stream().map(QuizQuestion::getId).collect(Collectors.toList()));
            game.setRoundCount(picked.size());
            game.setCurrentIndex(0);
            game.setFinished(false);
            quizGameRepository.save(game);

            // 방장은 문제를 풀지 않고 정답 공개/다음 문제 진행만 담당하므로 참가자 목록에서 제외한다.
            List<QuizParticipant> participants = new ArrayList<>();
            for (RoomUser user : userList) {
                if (user.getUserId().equals(masterId)) {
                    continue;
                }
                QuizParticipant participant = new QuizParticipant();
                participant.setRoomId(code);
                participant.setUserId(user.getUserId());
                participant.setUserName(user.getUserName());
                participant.setScore(0);
                participant.setAnswered(false);
                participants.add(participant);
            }
            quizParticipantRepository.saveAll(participants);

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public QuizQuestionMessage getCurrentQuestionMessage(String code) {
        QuizGame game = quizGameRepository.findByRoomId(code);
        QuizQuestion question = quizQuestionBank.findById(game.getQuestionIds().get(game.getCurrentIndex()));

        QuizQuestionMessage message = new QuizQuestionMessage();
        message.setQuestionId(question.getId());
        message.setQtype(question.getType());
        message.setCategory(question.getCategory());
        message.setQuestionText(question.getQuestion());
        message.setMedia(question.getMedia());
        message.setRound(game.getCurrentIndex() + 1);
        message.setTotalRounds(game.getRoundCount());
        return message;
    }

    @Transactional
    public QuizProgressMessage submitAnswer(String code, String userId, String answer) {
        QuizParticipant participant = quizParticipantRepository.findByRoomIdAndUserId(code, userId);
        if (participant != null && !participant.isAnswered()) {
            participant.setAnswered(true);
            participant.setCurrentAnswer(answer == null ? "" : answer);
            quizParticipantRepository.save(participant);
        }

        List<QuizParticipant> all = quizParticipantRepository.findByRoomId(code);
        long answeredCount = all.stream().filter(QuizParticipant::isAnswered).count();

        QuizProgressMessage message = new QuizProgressMessage();
        message.setAnsweredCount((int) answeredCount);
        message.setTotalCount(all.size());
        return message;
    }

    @Transactional
    public QuizRevealMessage reveal(String code) {
        QuizGame game = quizGameRepository.findByRoomId(code);
        QuizQuestion question = quizQuestionBank.findById(game.getQuestionIds().get(game.getCurrentIndex()));

        List<String> normalizedAnswers = question.getAnswers().stream()
                .map(QuizService::normalize)
                .collect(Collectors.toList());

        List<QuizParticipant> all = quizParticipantRepository.findByRoomId(code);
        List<QuizResultEntry> results = new ArrayList<>();

        for (QuizParticipant participant : all) {
            boolean correct = participant.getCurrentAnswer() != null
                    && normalizedAnswers.contains(normalize(participant.getCurrentAnswer()));

            int gained = 0;
            if (correct) {
                gained = CORRECT_SCORE;
                participant.setScore(participant.getScore() + gained);
            }

            results.add(new QuizResultEntry(
                    participant.getUserId(),
                    participant.getUserName(),
                    participant.getCurrentAnswer(),
                    correct,
                    gained,
                    participant.getScore()
            ));
        }
        quizParticipantRepository.saveAll(all);
        results.sort(Comparator.comparingInt(QuizResultEntry::getTotalScore).reversed());

        QuizRevealMessage message = new QuizRevealMessage();
        message.setCorrectAnswer(question.getAnswers().get(0));
        message.setResults(results);
        message.setRound(game.getCurrentIndex() + 1);
        message.setTotalRounds(game.getRoundCount());
        message.setLastRound(game.getCurrentIndex() + 1 >= game.getRoundCount());
        return message;
    }

    @Transactional
    public boolean advanceIndexOrFinish(String code) {
        QuizGame game = quizGameRepository.findByRoomId(code);
        int next = game.getCurrentIndex() + 1;

        if (next >= game.getRoundCount()) {
            game.setFinished(true);
            quizGameRepository.save(game);
            return false;
        }

        game.setCurrentIndex(next);
        quizGameRepository.save(game);

        List<QuizParticipant> all = quizParticipantRepository.findByRoomId(code);
        for (QuizParticipant participant : all) {
            participant.setAnswered(false);
            participant.setCurrentAnswer(null);
        }
        quizParticipantRepository.saveAll(all);
        return true;
    }

    public QuizFinishedMessage getFinalResults(String code) {
        List<QuizParticipant> all = quizParticipantRepository.findByRoomId(code);
        all.sort(Comparator.comparingInt(QuizParticipant::getScore).reversed());

        List<QuizResultEntry> ranking = all.stream()
                .map(p -> new QuizResultEntry(p.getUserId(), p.getUserName(), null, false, 0, p.getScore()))
                .collect(Collectors.toList());

        QuizFinishedMessage message = new QuizFinishedMessage();
        message.setFinalRanking(ranking);
        return message;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase().replaceAll("\\s+", "");
    }
}
