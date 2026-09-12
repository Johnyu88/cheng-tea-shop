# Website-First Architecture Design

Date: 2026-09-12

## 1. Context

The project is a new tea shop commerce website with a future lightweight ERP integration. The repository currently has no application implementation, so the main architectural risk is committing too early to a backend or ERP model before the storefront experience is understood.

## 2. Decision

Adopt the following architecture strategy:

**Website First → Mock API → ERP Reuse → API Integration**

The storefront experience is designed and validated first. Backend capabilities are derived from the validated storefront workflows. Existing mature open-source ERP / commerce backends should be preferred over building a full ERP from scratch.

## 3. Goals

- Optimize first for customer-facing quality: visual design, comfort, usability, mobile experience, product presentation, and checkout flow.
- Allow frontend development to proceed without waiting for ERP selection.
- Keep the storefront independent from any specific ERP data model.
- Reuse mature open-source backend capabilities where practical.
- Limit custom backend development to genuinely differentiating or missing capabilities.

## 4. Non-goals

Before the storefront requirements stabilize, the project will not:

- Build a complete ERP from scratch.
- Design speculative database schemas for future features.
- Couple frontend components directly to ERP-specific APIs.
- Let a chosen ERP dictate storefront UX.

## 5. System Boundaries

### Storefront

Responsibilities:

- Brand presentation
- Navigation
- Product discovery
- Product detail
- Cart
- Checkout
- Account and order views
- Mobile interactions
- Loading, empty, error, and success states

The storefront consumes a stable application-facing API contract.

### Unified API / Integration Layer

Responsibilities:

- Define stable commerce-facing contracts.
- Normalize errors and response shapes.
- Translate between storefront models and backend models.
- Isolate ERP, payment, and logistics providers behind adapters.

### ERP / Commerce Backend

Expected responsibilities:

- Product master data
- Categories
- Pricing
- Inventory
- Customers
- Orders
- Payment state
- Fulfillment / shipment state
- Basic reporting

The exact backend product is intentionally undecided during the frontend phase.

## 6. Data Flow

```text
Customer
   ↓
Storefront UI
   ↓
Unified Commerce API
   ├── ERP / Commerce Adapter
   ├── Payment Adapter
   └── Logistics Adapter
             ↓
External backend systems
```

During prototype phases, the Unified Commerce API may be backed by Mock Data / Mock API implementations.

## 7. Initial API Domains

The frontend should depend on domain-oriented interfaces rather than vendor-specific resources:

- Product
- Category
- Inventory availability
- Customer
- Cart
- Order
- Payment
- Shipment

Detailed schemas will be defined only when the related frontend workflows are understood.

## 8. Open-source Backend Selection

ERP / commerce candidates will be evaluated after storefront requirements stabilize.

Evaluation criteria:

- Functional fit
- API quality and completeness
- License compatibility
- Project activity and maintenance
- Security posture
- Deployment complexity and cost
- Customization effort
- Taiwan payment integration feasibility
- Taiwan logistics integration feasibility

The preferred solution is the candidate requiring the least risky custom work while satisfying the validated workflows.

## 9. Error Handling

The integration layer should normalize backend failures into application-facing error categories so the storefront does not depend on vendor-specific error formats.

Examples:

- Validation error
- Product unavailable
- Inventory insufficient
- Payment failed
- Order creation failed
- Backend temporarily unavailable

The storefront should design visible user states for each relevant category.

## 10. Testing Strategy

### Frontend phase

- Component behavior against fixtures / mock responses
- Responsive layout checks
- Cart and checkout flow tests
- Loading / empty / failure state tests

### Integration phase

- Contract tests between Unified API and adapters
- Backend adapter integration tests
- Payment sandbox tests
- Order and inventory synchronization tests

### Production phase

- End-to-end purchase flow
- Authorization and role checks
- Backup / restore verification
- Operational monitoring

## 11. Delivery Phases

1. Brand and UX discovery
2. Information architecture and wireframes
3. Visual design and mobile experience
4. Frontend prototype using mock data
5. Backend capability map derived from prototype
6. Unified API contract
7. GitHub open-source ERP / commerce evaluation
8. Adapter integration
9. Missing backend capability implementation
10. Production hardening

## 12. Decision Rule for New Backend Work

Before creating a new backend feature, ask in order:

1. Is this requirement validated by an actual storefront or operating workflow?
2. Can the workflow be validated with mock data first?
3. Does a mature open-source system already provide this capability?
4. Can an adapter expose it without coupling the storefront to the backend?
5. Only if the above are insufficient should custom backend implementation begin.

## 13. Current Status

Architecture strategy approved. No ERP product has been selected. The next product-design work should focus on website style, user experience, visual comfort, and storefront functionality before backend selection.
