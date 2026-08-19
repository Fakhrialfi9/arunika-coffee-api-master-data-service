import { Controller } from '@nestjs/common';

interface HealthResponse {
  service: string;
  status: string;
}

@Controller()
export class MasterDataGrpcController {
  getHealth(): HealthResponse {
    return {
      service: 'arunika-coffee-api-master-data-service',
      status: 'ok',
    };
  }
}
