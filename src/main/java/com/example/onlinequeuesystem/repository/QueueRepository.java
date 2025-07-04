package com.example.onlinequeuesystem.repository;

import com.example.onlinequeuesystem.entity.QueueEntity;
import com.example.onlinequeuesystem.enumeration.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<QueueEntity, Long> {

    // ServiceType'a göre ve tamamlanmamış (completed=false) en son oluşturulan növbəni tap
    // Bu, yeni növbə numarası oluştururken doğru seri takibini sağlar.
    QueueEntity findTopByServiceTypeAndCompletedFalseOrderByCreatedAtDesc(ServiceType serviceType);

    // Növbə nömrəsinə görə növbəni tap
    Optional<QueueEntity> findByQueueNumber(String queueNumber);

    // Xidmət növünə görə növbələri gətir
    List<QueueEntity> findByServiceType(ServiceType serviceType);

    // Bütün növbələrin tamamlanmış durumuna göre sayısını getir
    long countByCompleted(boolean completed);

    // Belirli bir xidmət növüne ait tüm növbelerin sayısını getir
    long countByServiceType(ServiceType serviceType);

    // Belirli bir xidmət növüne ve tamamlanmış durumuna göre növbelerin sayısını getir
    long countByServiceTypeAndCompleted(ServiceType serviceType, boolean completed);
}