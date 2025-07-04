package com.example.onlinequeuesystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor // Bütün sahələri əhatə edən constructor-u yeniləyəcək
@NoArgsConstructor
public class QueueResponseDTO {
    private Long id; // Bu sətri əlavə edin!
    private String queueNumber;
    private String message;
    private String serviceType;
    private String userFullName;
    private boolean completed;
}