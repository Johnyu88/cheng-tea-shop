import type { ServiceResult } from "./result";
import type {
  FulfillmentRequestDto,
  FulfillmentResultDto,
  ShippingQuoteDto,
  ShippingQuoteRequestDto,
} from "./integration-types";

export interface LogisticsService {
  quote(request: ShippingQuoteRequestDto): Promise<ServiceResult<ShippingQuoteDto>>;
  createFulfillment(request: FulfillmentRequestDto): Promise<ServiceResult<FulfillmentResultDto>>;
}
