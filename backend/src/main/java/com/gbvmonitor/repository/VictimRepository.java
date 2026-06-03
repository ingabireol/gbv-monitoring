package com.gbvmonitor.repository;

import com.gbvmonitor.entity.Victim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VictimRepository extends JpaRepository<Victim, UUID> {
    Optional<Victim> findByAccountId(UUID accountId);
}
