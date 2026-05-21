## ADDED Requirements

### Requirement: Order creation uses atomic stock validation

The system SHALL validate stock availability and decrement stock in a single atomic database operation when creating an order.

`POST /api/orders` SHALL use `updateMany` with a `WHERE stock >= quantity` condition rather than separate SELECT and UPDATE statements, ensuring that concurrent orders for the same product cannot both pass stock validation.

#### Scenario: Concurrent orders for last item

- **WHEN** two users concurrently order the same product with quantity 1, and only 1 unit remains in stock
- **THEN** exactly one order succeeds and the other receives `OUT_OF_STOCK`
- **THEN** the product stock is 0 after the successful order

#### Scenario: Single order with sufficient stock

- **WHEN** a user submits an order with products that are all in stock
- **THEN** the order is created successfully and stock is decremented for each product
