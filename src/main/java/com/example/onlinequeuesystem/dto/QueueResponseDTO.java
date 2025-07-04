package com.example.onlinequeuesystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor; // Ekledik

@Data
@AllArgsConstructor
@NoArgsConstructor // Lombok constructor
public class QueueResponseDTO {
    private String queueNumber;
    private String message;
    private String serviceType; // Hangi servis tipi olduğunu göstermek için eklenebilir
    private String userFullName; // Kimin növbəyə düşdüğünü göstermek için eklenebilir
    private boolean completed; // Növbənin tamamlanıb-tamamlanmadığını göstermek için eklenebilir
}