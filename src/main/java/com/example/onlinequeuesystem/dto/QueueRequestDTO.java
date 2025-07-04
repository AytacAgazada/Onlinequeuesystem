package com.example.onlinequeuesystem.dto;

import com.example.onlinequeuesystem.enumeration.ServiceType;
import jakarta.validation.constraints.NotBlank; // @NotBlank ekledik
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor; // Ekledik
import lombok.AllArgsConstructor; // Ekledik

@Data
@NoArgsConstructor // Lombok constructor
@AllArgsConstructor // Lombok constructor
public class QueueRequestDTO {

    @NotNull(message = "Xidmət növü boş ola bilməz.")
    private ServiceType serviceType;

    @NotBlank(message = "Ad boş ola bilməz.") // @NotNull yerine @NotBlank daha iyi
    @Size(min = 2, max = 50, message = "Ad 2-50 simvol arasında olmalıdır.")
    private String userFullName;
}