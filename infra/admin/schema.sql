CREATE TABLE pintrip_admin_user (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    username VARCHAR(64) NOT NULL COMMENT '登录账号',
    email VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
    password_hash VARCHAR(100) NOT NULL COMMENT 'BCrypt 密码摘要',
    display_name VARCHAR(64) NOT NULL COMMENT '显示名称',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1正常，2禁用，3锁定',
    failed_login_count INT NOT NULL DEFAULT 0 COMMENT '连续登录失败次数',
    locked_until DATETIME(6) DEFAULT NULL COMMENT '临时锁定截止时间',
    last_login_at DATETIME(6) DEFAULT NULL COMMENT '最后登录时间',
    password_changed_at DATETIME(6) NOT NULL COMMENT '密码修改时间',
    created_by BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_by BIGINT UNSIGNED DEFAULT NULL COMMENT '最后修改人',
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_user_username (username),
    UNIQUE KEY uk_admin_user_email (email),
    KEY idx_admin_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运营后台账号';

CREATE TABLE pintrip_admin_role (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_code VARCHAR(64) NOT NULL COMMENT '角色编码',
    role_name VARCHAR(64) NOT NULL COMMENT '角色名称',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1正常，2禁用',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运营角色';

CREATE TABLE pintrip_admin_user_role (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, role_id),
    KEY idx_admin_user_role_role_id (role_id),
    CONSTRAINT fk_pintrip_admin_user_role_user FOREIGN KEY (user_id) REFERENCES pintrip_admin_user (id),
    CONSTRAINT fk_pintrip_admin_user_role_role FOREIGN KEY (role_id) REFERENCES pintrip_admin_role (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运营账号角色关系';

INSERT INTO pintrip_admin_role (role_code, role_name) VALUES
    ('SUPER_ADMIN', '超级管理员'),
    ('OPERATOR', '普通运营人员');
