package com.example.onlinequeuesystem.service;

import com.example.onlinequeuesystem.dto.QueueRequestDTO;
import com.example.onlinequeuesystem.dto.QueueResponseDTO;
import com.example.onlinequeuesystem.enumeration.ServiceType;

import java.util.List;

public interface QueueService {
    QueueResponseDTO createQueue(QueueRequestDTO request);
    List<QueueResponseDTO> getAllQueues();
    QueueResponseDTO getQueueByNumber(String queueNumber);
    List<QueueResponseDTO> getQueuesByServiceType(ServiceType type);
    void deleteQueue(Long id);
    void markQueueAsCompleted(Long id);
    String getStatistics();
}//