package com.example.onlinequeuesystem.service;

import com.example.onlinequeuesystem.dto.QueueRequestDTO;
import com.example.onlinequeuesystem.dto.QueueResponseDTO;
import com.example.onlinequeuesystem.entity.QueueEntity;
import com.example.onlinequeuesystem.enumeration.ServiceType;
import com.example.onlinequeuesystem.repository.QueueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Transactional yönetim için

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueueServiceImpl implements QueueService {

    private final QueueRepository repository; // Final olarak tanımla

    // Constructor Injection
    public QueueServiceImpl(QueueRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional // İşlemlerin atomik olmasını sağlar
    public QueueResponseDTO createQueue(QueueRequestDTO request) {
        // Son tamamlanmamış növbəni tap. Bu, yeni nömrənin düzgün ardıcıllıqda olmasını təmin edir.
        QueueEntity lastQueue = repository.findTopByServiceTypeAndCompletedFalseOrderByCreatedAtDesc(request.getServiceType());
        String newQueueNumber = generateQueueNumber(lastQueue, request.getServiceType());

        QueueEntity newQueue = new QueueEntity();
        newQueue.setServiceType(request.getServiceType());
        newQueue.setCreatedAt(LocalDateTime.now());
        newQueue.setUserFullName(request.getUserFullName());
        newQueue.setQueueNumber(newQueueNumber);
        newQueue.setCompleted(false); // Yeni növbə tamamlanmamış sayılır

        repository.save(newQueue);

        String message = switch (request.getServiceType()) {
            case URGENT_MONEY_TRANSFER, URGENT_MONEY_WITHDRAWAL ->
                    "Təcili xidmət üçün növbəniz təyin edildi.";
            default -> "Xidmət nömrəniz: " + newQueueNumber + ". Zəhmət olmasa gözləyin.";
        };

        return convertToDto(newQueue, message); // Yeni convertToDto metodunu kullan
    }

    @Override
    public List<QueueResponseDTO> getAllQueues() {
        return repository.findAll().stream()
                .map(entity -> convertToDto(entity, null)) // Message burada null olabilir veya duruma göre belirlenebilir
                .collect(Collectors.toList());
    }

    @Override
    public QueueResponseDTO getQueueByNumber(String queueNumber) {
        QueueEntity entity = repository.findByQueueNumber(queueNumber)
                .orElseThrow(() -> new IllegalArgumentException("Növbə nömrəsi tapılmadı: " + queueNumber));
        return convertToDto(entity, null); // Message burada null olabilir
    }

    @Override
    public List<QueueResponseDTO> getQueuesByServiceType(ServiceType type) {
        return repository.findByServiceType(type).stream()
                .map(entity -> convertToDto(entity, null)) // Message burada null olabilir
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteQueue(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Silinəcək növbə tapılmadı, ID: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void markQueueAsCompleted(Long id) {
        QueueEntity queue = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tamamlanacaq növbə tapılmadı, ID: " + id));
        queue.setCompleted(true);
        repository.save(queue);
    }

    @Override
    public String getStatistics() {
        long totalQueues = repository.count();
        long completedQueues = repository.countByCompleted(true);
        long pendingQueues = totalQueues - completedQueues;

        StringBuilder stats = new StringBuilder();
        stats.append("Ümumi növbə sayı: ").append(totalQueues).append("\n");
        stats.append("Tamamlanmış növbə sayı: ").append(completedQueues).append("\n");
        stats.append("Gözləyən növbə sayı: ").append(pendingQueues).append("\n\n");

        stats.append("Xidmət Növlərinə Görə Statistikalar:\n");
        for (ServiceType type : ServiceType.values()) {
            long countByType = repository.countByServiceType(type);
            long completedByType = repository.countByServiceTypeAndCompleted(type, true);
            stats.append("- ").append(type.name()).append(":\n")
                    .append("  Toplam: ").append(countByType).append("\n")
                    .append("  Tamamlanmış: ").append(completedByType).append("\n")
                    .append("  Gözləyən: ").append(countByType - completedByType).append("\n\n");
        }

        return stats.toString();
    }

    // Növbə nömrəsi yaratma metodu
    private String generateQueueNumber(QueueEntity lastQueue, ServiceType serviceType) {
        String prefix = getPrefixForServiceType(serviceType);
        int nextNumber = 1;

        if (lastQueue != null && lastQueue.getQueueNumber() != null) {
            String lastQueueNum = lastQueue.getQueueNumber();
            if (lastQueueNum.startsWith(prefix) && lastQueueNum.length() >= 4) {
                try {
                    String numStr = lastQueueNum.substring(prefix.length());
                    nextNumber = Integer.parseInt(numStr) + 1;
                } catch (NumberFormatException e) {
                    System.err.println("Növbə nömrəsi parse xətası: " + lastQueueNum + ". " + serviceType + " üçün " + prefix + "001 olaraq sıfırlandı.");
                    nextNumber = 1;
                }
            }
        }
        return prefix + String.format("%03d", nextNumber);
    }


    private String getPrefixForServiceType(ServiceType serviceType) {
        return switch (serviceType) {
            case URGENT_MONEY_TRANSFER, URGENT_MONEY_WITHDRAWAL -> "T"; // Təcili
            case PLASTIC_CARD_VISA, PLASTIC_CARD_MASTER -> "K"; // Kart
            case CREDIT_ONLINE, CREDIT_CASH -> "L"; // Kredit
            case DEPOSIT_BOX, DEPOSIT_WITHDRAWAL -> "D"; // Depozit
            default -> "A";
        };
    }


    private QueueResponseDTO convertToDto(QueueEntity entity, String customMessage) {
        String message = customMessage != null ? customMessage :
                (entity.isCompleted() ? "Növbə tamamlandı." : "Xidmət nömrəniz: " + entity.getQueueNumber() + ". Gözləmədədir.");

        return new QueueResponseDTO(
                entity.getQueueNumber(),
                message,
                entity.getServiceType().name(),
                entity.getUserFullName(),
                entity.isCompleted()//
        );
    }
}