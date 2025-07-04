package com.example.onlinequeuesystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class QueueResponseDTO {
    private String queueNumber;
    private String message;
    private String serviceType;
    private String userFullName;
    private boolean completed;
}