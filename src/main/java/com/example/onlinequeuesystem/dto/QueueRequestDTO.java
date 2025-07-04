package com.example.onlinequeuesystem.dto;

import com.example.onlinequeuesystem.enumeration.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QueueRequestDTO {

    @NotNull(message = "Xidmət növü boş ola bilməz.")
    private ServiceType serviceType;

    @NotBlank(message = "Ad boş ola bilməz.")
    @Size(min = 2, max = 50, message = "Ad 2-50 simvol arasında olmalıdır.")
    private String userFullName;
}