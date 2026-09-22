import type { ServiceResult } from "./result";
import type { ErpOrderSyncDto, ErpProductUpsertDto, ErpSyncResultDto } from "./integration-types";

export interface ErpService {
  upsertProduct(request: ErpProductUpsertDto): Promise<ServiceResult<ErpSyncResultDto>>;
  syncOrder(request: ErpOrderSyncDto): Promise<ServiceResult<ErpSyncResultDto>>;
}
