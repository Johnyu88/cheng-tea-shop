import type { ServiceResult } from "./result";
import type { PaymentRequestDto, PaymentResultDto } from "./integration-types";

export interface PaymentService {
  authorize(request: PaymentRequestDto): Promise<ServiceResult<PaymentResultDto>>;
}
