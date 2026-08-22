import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

interface HealthResponse {
  service: string;
  status: string;
}

@Controller()
export class MasterDataGrpcController {
  @GrpcMethod('MasterDataService', 'GetHealth')
  getHealth(): HealthResponse {
    return {
      service: 'arunika-coffee-api-master-data-service',
      status: 'ok',
    };
  }
}
