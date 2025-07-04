package com.example.onlinequeuesystem.controller;

import com.example.onlinequeuesystem.dto.QueueRequestDTO;
import com.example.onlinequeuesystem.dto.QueueResponseDTO;
import com.example.onlinequeuesystem.enumeration.ServiceType;
import com.example.onlinequeuesystem.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queues")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @PostMapping("/create")
    public ResponseEntity<QueueResponseDTO> createQueue(@Valid @RequestBody QueueRequestDTO request) {
        QueueResponseDTO response = queueService.createQueue(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public ResponseEntity<List<QueueResponseDTO>> getAllQueues() {
        return ResponseEntity.ok(queueService.getAllQueues());
    }

    @GetMapping("/{queueNumber}")
    public ResponseEntity<QueueResponseDTO> getQueueByNumber(@PathVariable String queueNumber) {
        QueueResponseDTO response = queueService.getQueueByNumber(queueNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/service-type/{type}")
    public ResponseEntity<List<QueueResponseDTO>> getQueuesByServiceType(@PathVariable ServiceType type) {
        return ResponseEntity.ok(queueService.getQueuesByServiceType(type));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQueue(@PathVariable Long id) {
        queueService.deleteQueue(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Void> markQueueAsCompleted(@PathVariable Long id) {
        queueService.markQueueAsCompleted(id);
        return ResponseEntity.ok().build(); // 200 OK
    }

    @GetMapping("/statistics")
    public ResponseEntity<String> getStatistics() {
        return ResponseEntity.ok(queueService.getStatistics());
    }
}