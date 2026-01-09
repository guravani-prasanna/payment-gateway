package com.gateway.services;

import com.gateway.models.Order;
import com.gateway.repositories.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(Double amount) {
        Order order = new Order();
        order.setOrderId(UUID.randomUUID().toString());
        order.setAmount(amount);
        order.setStatus("CREATED");
        return orderRepository.save(order); // Save to DB
    }
}
