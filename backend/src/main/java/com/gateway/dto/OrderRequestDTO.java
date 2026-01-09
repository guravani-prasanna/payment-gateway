package com.gateway.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class OrderRequestDTO {

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be at least 1")
    private Double amount;

    private String currency;

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
