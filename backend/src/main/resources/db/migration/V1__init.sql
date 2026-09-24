-- 초기 스키마 (Hibernate 엔티티 기준)

CREATE TABLE room (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    roomcode      VARCHAR(6),
    roommaster    VARCHAR(255),
    master_name   VARCHAR(255),
    gamemode      VARCHAR(255),
    maxmember     INT          NOT NULL,
    currentmember INT          NOT NULL,
    is_active     BIT          NOT NULL,
    is_start      BIT          NOT NULL,
    created_at    DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_room_roomcode UNIQUE (roomcode)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE room_users (
    room_id   BIGINT NOT NULL,
    user_id   VARCHAR(255),
    user_name VARCHAR(255),
    CONSTRAINT fk_room_users_room FOREIGN KEY (room_id) REFERENCES room (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE game_participant (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    room_id     VARCHAR(255),
    user_id     VARCHAR(255),
    role        VARCHAR(255),
    expl        VARCHAR(255),
    seq         INT    NOT NULL,
    score       INT    NOT NULL,
    is_selected INT    NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE liar_game (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    room_id     VARCHAR(255),
    category    VARCHAR(255),
    mode        VARCHAR(255),
    target_ward VARCHAR(255),
    fake_ward   VARCHAR(255),
    is_finish   BIT    NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE quiz_game (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    room_id       VARCHAR(255),
    round_count   INT    NOT NULL,
    current_index INT    NOT NULL,
    finished      BIT    NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE quiz_categories (
    quiz_game_id BIGINT NOT NULL,
    category     VARCHAR(255),
    CONSTRAINT fk_quiz_categories_game FOREIGN KEY (quiz_game_id) REFERENCES quiz_game (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE quiz_question_ids (
    quiz_game_id   BIGINT NOT NULL,
    question_order INT    NOT NULL,
    question_id    VARCHAR(255),
    PRIMARY KEY (question_order, quiz_game_id),
    CONSTRAINT fk_quiz_question_ids_game FOREIGN KEY (quiz_game_id) REFERENCES quiz_game (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE quiz_participant (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    room_id        VARCHAR(255),
    user_id        VARCHAR(255),
    user_name      VARCHAR(255),
    current_answer VARCHAR(255),
    answered       BIT    NOT NULL,
    score          INT    NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
