package com.example.onlinequeuesystem.repository;

import com.example.onlinequeuesystem.entity.QueueEntity;
import com.example.onlinequeuesystem.enumeration.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<QueueEntity, Long> {

    QueueEntity findTopByServiceTypeAndCompletedFalseOrderByCreatedAtDesc(ServiceType serviceType);


    Optional<QueueEntity> findByQueueNumber(String queueNumber);


    List<QueueEntity> findByServiceType(ServiceType serviceType);


    long countByCompleted(boolean completed);


    long countByServiceType(ServiceType serviceType);


    long countByServiceTypeAndCompleted(ServiceType serviceType, boolean completed);
}//