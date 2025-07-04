package com.example.onlinequeuesystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories; // Bu satırı ekleyebiliriz

@SpringBootApplication
@EnableJpaRepositories // JPA Repositories'i etkinleştirmek için
public class OnlinequeuesystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlinequeuesystemApplication.class, args);
    }
}