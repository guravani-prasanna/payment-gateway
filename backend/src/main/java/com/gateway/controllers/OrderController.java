package com.gateway.controllers;

import com.gateway.dto.OrderRequestDTO;
import com.gateway.models.Order;
import com.gateway.services.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders")
    public Object createOrder(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @RequestBody OrderRequestDTO orderRequest) {

        try {
            return orderService.createOrder(orderRequest.getAmount());
        } catch (Exception e) {
            e.printStackTrace(); // Logs the real error
            return Map.of("error", e.getMessage());
        }
    }
}
